import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getUser, getCustomSkills } from '../database/database';
import { getLevelInfo } from '../utils/xpCalculator';
import { useAppContext } from '../context/AppContext';
import { strings } from '../utils/i18n';
import { useColors, accent } from '../utils/colors';

const SKILL_KEYS  = ['social', 'focus', 'intelligence', 'endurance', 'discipline', 'talent', 'practicality'];
const SKILL_ICONS = { social: '🗣️', focus: '🎯', intelligence: '🧠', endurance: '💪', discipline: '🔒', talent: '⭐', practicality: '🔧' };

function getDailyMotto(mottos) {
  return mottos[new Date().getDate() % mottos.length];
}

export default function ProfileScreen() {
  const [user, setUser]               = useState(null);
  const [customSkills, setCustomSkills] = useState([]);
  const { language }    = useAppContext();
  const c      = useColors();
  const s      = strings[language]?.profile ?? strings.tr.profile;
  const skillS = strings[language]?.skills  ?? strings.tr.skills;
  const mottos = strings[language]?.mottos  ?? strings.tr.mottos;
  const isEN   = language === 'en';

  useFocusEffect(useCallback(() => {
    setUser(getUser());
    setCustomSkills(getCustomSkills());
  }, []));

  if (!user) return null;

  const { level, currentXP, xpForNext, progress } = getLevelInfo(user.totalXP);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.header, { color: c.text }]}>{s.header}</Text>

        {/* Seviye Kartı */}
        <View style={[styles.levelCard, { backgroundColor: c.card, borderColor: accent.primary }]}>
          <Text style={styles.levelBadge}>LVL {level}</Text>
          <Text style={[styles.levelSub, { color: c.textSub }]}>{currentXP} / {xpForNext} XP</Text>
          <View style={[styles.xpBarBg, { backgroundColor: c.border }]}>
            <View style={[styles.xpBarFill, { width: `${Math.floor(progress * 100)}%` }]} />
          </View>
        </View>

        {/* Yetenekler */}
        <Text style={[styles.sectionTitle, { color: c.textSub }]}>{s.skills}</Text>
        {SKILL_KEYS.map((key) => (
          <View key={key} style={[styles.skillRow, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={styles.skillIcon}>{SKILL_ICONS[key]}</Text>
            <Text style={[styles.skillLabel, { color: c.text }]}>{skillS[key]}</Text>
            <Text style={styles.skillValue}>{user[key] ?? 0}</Text>
          </View>
        ))}

        {/* Özel Beceriler */}
        {customSkills.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: c.textSub }]}>
              {isEN ? 'Custom Skills' : 'Özel Beceriler'}
            </Text>
            {customSkills.map((cs) => (
              <View key={cs.id} style={[styles.skillRow, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={styles.skillIcon}>✨</Text>
                <Text style={[styles.skillLabel, { color: c.text }]}>{cs.name}</Text>
                <Text style={styles.skillValue}>{cs.value}</Text>
              </View>
            ))}
          </>
        )}

        {/* Günün Motosu */}
        <Text style={[styles.sectionTitle, { color: c.textSub, marginTop: 24 }]}>{s.motto}</Text>
        <View style={[styles.mottoCard, { backgroundColor: c.card }]}>
          <Text style={[styles.mottoText, { color: c.textSub }]}>"{getDailyMotto(mottos)}"</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  levelCard: {
    borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 1, marginBottom: 24,
  },
  levelBadge:  { fontSize: 36, fontWeight: '900', color: accent.primary },
  levelSub:    { fontSize: 14, marginTop: 4 },
  xpBarBg:     { width: '100%', height: 8, borderRadius: 4, marginTop: 14, overflow: 'hidden' },
  xpBarFill:   { height: '100%', backgroundColor: accent.primary, borderRadius: 4 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  skillRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1,
  },
  skillIcon:   { fontSize: 20, marginRight: 12 },
  skillLabel:  { flex: 1, fontSize: 15 },
  skillValue:  { color: accent.primary, fontSize: 16, fontWeight: '700' },
  mottoCard:   { borderRadius: 12, padding: 16, borderLeftWidth: 3, borderLeftColor: accent.primary },
  mottoText:   { fontStyle: 'italic', fontSize: 14, lineHeight: 22 },
});
