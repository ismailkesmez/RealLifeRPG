import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  TouchableOpacity, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getUser, getUnlockedTitles, unlockTitle, updateUser,
  getCustomSkills, getCustomTitles,
} from '../database/database';
import { useAppContext } from '../context/AppContext';
import { strings } from '../utils/i18n';
import { useColors, accent } from '../utils/colors';
import { TITLE_DEFINITIONS } from '../data/titleDefinitions';
import SkillCreatorModal from '../components/SkillCreatorModal';

// 100-threshold title keys that must all be claimed to unlock the hidden achievement
const HIDDEN_TITLE_100 = ['socialAdept', 'focusMaster', 'scholar', 'naturalTalent', 'skilled'];
const HIDDEN_KEY       = 'skillCreator';
const HIDDEN_XP        = 1000;

// All 250-threshold (max level) title keys across every base skill
const ALL_MAX_KEYS      = ['socialGod', 'focusAbsolute', 'pureIntellect', 'immortal', 'disciplineGod', 'legendaryTalent', 'practicalGenius'];
const ALL_MAX_DONE_KEY  = 'allMaxClaimed';

// ---------------------------------------------------------------------------
// XP popup (regular title claim)
// ---------------------------------------------------------------------------
function XPPopup({ xp, visible }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, friction: 5 }),
        Animated.timing(opacity, { toValue: 1, useNativeDriver: true, duration: 250 }),
      ]),
      Animated.delay(2000),
      Animated.timing(opacity, { toValue: 0, useNativeDriver: true, duration: 400 }),
    ]).start();
  }, [visible, xp]);

  if (!visible) return null;
  return (
    <Animated.View style={[popup.overlay, { opacity }]}>
      <Animated.View style={[popup.box, { transform: [{ scale }] }]}>
        <Text style={popup.icon}>🏆</Text>
        <Text style={popup.xpText}>+{xp} XP</Text>
        <Text style={popup.sub}>Lakap Ödülü</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Hidden achievement popup (5 seconds, special text)
// ---------------------------------------------------------------------------
function HiddenPopup({ visible, language }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    scale.setValue(0.5);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, friction: 4 }),
        Animated.timing(opacity, { toValue: 1, useNativeDriver: true, duration: 300 }),
      ]),
      Animated.delay(3800),
      Animated.timing(opacity, { toValue: 0, useNativeDriver: true, duration: 600 }),
    ]).start();
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View style={[hidden.overlay, { opacity }]}>
      <Animated.View style={[hidden.box, { transform: [{ scale }] }]}>
        <Text style={hidden.tag}>{language === 'en' ? 'HIDDEN ACHIEVEMENT' : 'GİZLİ BAŞARIM'}</Text>
        <Text style={hidden.icon}>🎴</Text>
        <Text style={hidden.title}>{language === 'en' ? 'Skill Creator' : 'Beceri Oluşturucu'}</Text>
        <Text style={hidden.xp}>+{HIDDEN_XP} XP</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Congratulations overlay (shown once when all max titles are claimed)
// ---------------------------------------------------------------------------
function CongratsOverlay({ visible, language, onClose }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    scale.setValue(0.8);
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, friction: 6 }),
      Animated.timing(opacity, { toValue: 1, useNativeDriver: true, duration: 400 }),
    ]).start();
  }, [visible]);

  if (!visible) return null;
  const isEN = language === 'en';

  return (
    <Animated.View style={[congrats.overlay, { opacity }]}>
      <TouchableOpacity style={congrats.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[congrats.card, { transform: [{ scale }] }]}>
        <Text style={congrats.trophy}>🏆</Text>
        <Text style={congrats.title}>{isEN ? 'Congratulations!' : 'Tebrikler!'}</Text>
        <Text style={congrats.body}>
          {isEN
            ? "I think you've finally got your life in order.\nI hope this app has been a success."
            : 'Artık hayatını düzene soktuğunu düşünüyorum.\nUmarım bu uygulama başarılı olmuştur.'}
        </Text>
        <TouchableOpacity style={congrats.btn} onPress={onClose}>
          <Text style={congrats.btnText}>{isEN ? 'Thank you 🙏' : 'Teşekkürler 🙏'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function TitlesScreen() {
  const [user, setUser]                   = useState(null);
  const [claimedKeys, setClaimedKeys]     = useState(new Set());
  const [xpPopup, setXpPopup]             = useState({ visible: false, xp: 0 });
  const [hiddenPopupVisible, setHiddenPopup] = useState(false);
  const [skillCreatorVisible, setSkillCreator] = useState(false);
  const [congratsVisible, setCongratsVisible] = useState(false);
  const [customSkills, setCustomSkills]   = useState([]);
  const [customTitleRows, setCustomTitleRows] = useState([]);

  const xpTimer     = useRef(null);
  const hiddenTimer = useRef(null);

  const { language } = useAppContext();
  const c      = useColors();
  const s      = strings[language]?.titles ?? strings.tr.titles;
  const skillS = strings[language]?.skills ?? strings.tr.skills;
  const isEN   = language === 'en';

  function loadData() {
    setUser(getUser());
    const claimed = new Set(getUnlockedTitles().map((r) => r.key));
    setClaimedKeys(claimed);
    setCustomSkills(getCustomSkills());
    setCustomTitleRows(getCustomTitles());
    // Show congrats if all max titles are claimed but the done-marker hasn't been stored yet
    if (!claimed.has(ALL_MAX_DONE_KEY) && ALL_MAX_KEYS.every((k) => claimed.has(k))) {
      unlockTitle(ALL_MAX_DONE_KEY);
      setClaimedKeys(new Set([...claimed, ALL_MAX_DONE_KEY]));
      setCongratsVisible(true);
    }
  }

  useFocusEffect(useCallback(() => { loadData(); }, []));

  // ── Hidden achievement state ─────────────────────────────────────────────
  // Claiming a title proves the skill WAS at the threshold — no need to
  // re-check current skill values (discipline can drop after claiming).
  const hiddenConditionsMet = user && HIDDEN_TITLE_100.every((k) => claimedKeys.has(k));
  const isHiddenClaimed   = claimedKeys.has(HIDDEN_KEY);
  const isHiddenClaimable = hiddenConditionsMet && !isHiddenClaimed;
  const hiddenVisible     = isHiddenClaimed || isHiddenClaimable;

  // ── Claim handlers ───────────────────────────────────────────────────────
  function handleClaim(item) {
    unlockTitle(item.key);
    const u = getUser();
    if (u) updateUser({ totalXP: (u.totalXP ?? 0) + item.threshold });

    const newClaimed = new Set([...claimedKeys, item.key]);
    setClaimedKeys(newClaimed);

    // Check if this claim completes all max-level titles
    if (!newClaimed.has(ALL_MAX_DONE_KEY) && ALL_MAX_KEYS.every((k) => newClaimed.has(k))) {
      unlockTitle(ALL_MAX_DONE_KEY);
      setClaimedKeys(new Set([...newClaimed, ALL_MAX_DONE_KEY]));
      setTimeout(() => setCongratsVisible(true), 800);
    }

    clearTimeout(xpTimer.current);
    setXpPopup({ visible: true, xp: item.threshold });
    xpTimer.current = setTimeout(() => setXpPopup({ visible: false, xp: 0 }), 3000);
  }

  function handleHiddenTap() {
    if (isHiddenClaimed) {
      setSkillCreator(true);
      return;
    }
    if (!isHiddenClaimable) return;
    unlockTitle(HIDDEN_KEY);
    const u = getUser();
    if (u) updateUser({ totalXP: (u.totalXP ?? 0) + HIDDEN_XP });
    setClaimedKeys((prev) => new Set([...prev, HIDDEN_KEY]));
    clearTimeout(hiddenTimer.current);
    setHiddenPopup(true);
    hiddenTimer.current = setTimeout(() => setHiddenPopup(false), 5000);
  }

  if (!user) return null;

  // ── Build combined title list ────────────────────────────────────────────
  const customItems = customTitleRows.map((ct) => {
    const cs = customSkills.find((s) => s.id === ct.skillId);
    return {
      key:              `custom_${ct.id}`,
      skill:            ct.skillId,
      threshold:        ct.threshold,
      bonus:            { multiplier: ct.multiplier },
      label:            { tr: ct.label, en: ct.label },
      isCustom:         true,
      customSkillName:  cs?.name ?? ct.skillId,
      customSkillValue: cs?.value ?? 0,
    };
  });

  const allItems = [...TITLE_DEFINITIONS, ...customItems];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <Text style={[styles.header, { color: c.text }]}>{s.header}</Text>

      <FlatList
        data={allItems}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        ListFooterComponent={hiddenVisible ? (
          <TouchableOpacity onPress={handleHiddenTap} activeOpacity={0.75} style={{ marginTop: 10 }}>
            <View style={[
              styles.card,
              { backgroundColor: c.card },
              isHiddenClaimed ? { borderColor: '#a855f7' } : { borderColor: '#f59e0b' },
            ]}>
              <View style={styles.cardLeft}>
                <Text style={[styles.titleLabel, { color: isHiddenClaimed ? '#a855f7' : '#f59e0b' }]}>
                  {isHiddenClaimed ? '🎴' : '❗'}{' '}
                  {isEN ? 'Skill Creator' : 'Beceri Oluşturucu'}
                </Text>
                <Text style={[styles.titleMeta, { color: accent.primary }]}>
                  {isEN ? 'Hidden Achievement' : 'Gizli Başarım'}
                </Text>
                {isHiddenClaimable && (
                  <Text style={styles.claimHint}>
                    {isEN ? `Claim → +${HIDDEN_XP} XP` : `Talep et → +${HIDDEN_XP} XP`}
                  </Text>
                )}
                {isHiddenClaimed && (
                  <Text style={[styles.claimHint, { color: '#a855f7' }]}>
                    {isEN ? 'Tap to create custom skills →' : 'Özel beceri oluşturmak için dokun →'}
                  </Text>
                )}
              </View>
              <View style={[
                styles.bonusBadge,
                { borderColor: isHiddenClaimed ? '#a855f7' : '#f59e0b',
                  backgroundColor: isHiddenClaimed ? '#a855f722' : '#f59e0b22' },
              ]}>
                <Text style={[styles.bonusText, { color: isHiddenClaimed ? '#a855f7' : '#f59e0b' }]}>
                  ✨
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}
        renderItem={({ item }) => {
          const skillValue  = item.isCustom
            ? item.customSkillValue
            : (user[item.skill] ?? 0);
          const isClaimed   = claimedKeys.has(item.key);
          const isClaimable = !isClaimed && skillValue >= item.threshold;
          const isLocked    = !isClaimed && !isClaimable;
          const label       = item.label[language] ?? item.label.tr;
          const skillName   = item.isCustom
            ? item.customSkillName
            : (skillS[item.skill] ?? item.skill);

          return (
            <TouchableOpacity
              activeOpacity={isClaimable ? 0.7 : 1}
              onPress={() => isClaimable && handleClaim(item)}
            >
              <View style={[
                styles.card,
                { backgroundColor: c.card },
                isClaimed   && { borderColor: accent.primary },
                isClaimable && { borderColor: '#f59e0b' },
                isLocked    && { borderColor: c.border, opacity: 0.45 },
              ]}>
                <View style={styles.cardLeft}>
                  <Text style={[styles.titleLabel, { color: isClaimed ? c.text : isClaimable ? '#f59e0b' : c.textMuted }]}>
                    {isClaimed ? '🏆' : isClaimable ? '❗' : '🔒'} {label}
                  </Text>
                  <Text style={[styles.titleMeta, { color: accent.primary }]}>
                    {skillName} ≥ {item.threshold}{'  '}({skillValue}/{item.threshold})
                  </Text>
                  {isClaimable && (
                    <Text style={styles.claimHint}>
                      {isEN ? `Claim → +${item.threshold} XP` : `Talep et → +${item.threshold} XP`}
                    </Text>
                  )}
                </View>

                {(isClaimed || isClaimable) && (
                  <View style={[
                    styles.bonusBadge,
                    { borderColor: isClaimed ? accent.primary : '#f59e0b',
                      backgroundColor: isClaimed ? accent.primaryBg : '#f59e0b22' },
                  ]}>
                    <Text style={[styles.bonusText, { color: isClaimed ? accent.primary : '#f59e0b' }]}>
                      x{item.bonus.multiplier} XP
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <XPPopup xp={xpPopup.xp} visible={xpPopup.visible} />
      <HiddenPopup visible={hiddenPopupVisible} language={language} />
      <CongratsOverlay visible={congratsVisible} language={language} onClose={() => setCongratsVisible(false)} />

      <SkillCreatorModal
        visible={skillCreatorVisible}
        onClose={() => setSkillCreator(false)}
        onCreated={loadData}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const popup = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  box: {
    backgroundColor: '#1a1a3a',
    borderRadius: 24,
    paddingHorizontal: 40,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: accent.primary,
    shadowColor: accent.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  icon:   { fontSize: 44, marginBottom: 8 },
  xpText: { fontSize: 38, fontWeight: '900', color: accent.primary },
  sub:    { fontSize: 14, color: '#a0a0cc', marginTop: 4 },
});

const hidden = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  box: {
    backgroundColor: '#1a0a2e',
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a855f7',
    shadowColor: '#a855f7',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10,
  },
  tag:   { fontSize: 11, fontWeight: '800', color: '#a855f7', letterSpacing: 2, marginBottom: 10 },
  icon:  { fontSize: 50, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '900', color: '#e0d0ff', textAlign: 'center' },
  xp:    { fontSize: 32, fontWeight: '900', color: '#a855f7', marginTop: 10 },
});

const congrats = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000cc',
  },
  card: {
    marginHorizontal: 24,
    backgroundColor: '#12112a',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  trophy: { fontSize: 56, marginBottom: 16 },
  title:  { fontSize: 26, fontWeight: '900', color: '#fde68a', marginBottom: 16, textAlign: 'center' },
  body:   { fontSize: 16, color: '#e0d8b0', textAlign: 'center', lineHeight: 26, marginBottom: 28 },
  btn: {
    backgroundColor: '#f59e0b', borderRadius: 14,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  btnText: { color: '#1a1200', fontWeight: '800', fontSize: 16 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header:    { fontSize: 22, fontWeight: '700', padding: 16, paddingBottom: 8 },
  card: {
    borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
  },
  cardLeft:   { flex: 1 },
  titleLabel: { fontSize: 15, fontWeight: '700' },
  titleMeta:  { fontSize: 12, marginTop: 4 },
  claimHint:  { fontSize: 11, color: '#f59e0b', marginTop: 4, fontWeight: '600' },
  bonusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  bonusText:  { fontWeight: '700', fontSize: 13 },
});
