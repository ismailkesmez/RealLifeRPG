import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  Switch, ScrollView, StyleSheet, KeyboardAvoidingView,
  Platform, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { strings } from '../utils/i18n';
import { useColors, accent } from '../utils/colors';
import { getCustomSkills, getTodaySkillGains } from '../database/database';

const DAILY_CAP = 10;

const SKILL_KEYS  = ['social', 'focus', 'intelligence', 'endurance', 'talent', 'practicality'];
const SKILL_ICONS = { social: '🗣️', focus: '🎯', intelligence: '🧠', endurance: '💪', talent: '⭐', practicality: '🔧' };
const DEFAULT_SKILLS = { social: 0, focus: 0, intelligence: 0, endurance: 0, talent: 0, practicality: 0 };

function generateId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }

// ---------------------------------------------------------------------------
// Sürüklenebilir XP Slider
// ---------------------------------------------------------------------------
const THUMB_R = 11; // thumb yarıçapı (px)

function DragSlider({ value, min = 10, max = 100, onChange, trackColor }) {
  const trackWRef = useRef(0);
  const [trackW, setTrackW] = useState(0);

  function updateFromX(locationX) {
    const w = trackWRef.current;
    if (!w) return;
    const usable = w - THUMB_R * 2;
    const ratio  = clamp((locationX - THUMB_R) / usable, 0, 1);
    onChange(clamp(Math.round(min + ratio * (max - min)), min, max));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture:  () => true,
      onPanResponderGrant: (evt) => updateFromX(evt.nativeEvent.locationX),
      onPanResponderMove:  (evt) => updateFromX(evt.nativeEvent.locationX),
    })
  ).current;

  function onLayout(e) {
    const w = e.nativeEvent.layout.width;
    trackWRef.current = w;
    setTrackW(w);
  }

  const usable    = trackW - THUMB_R * 2;
  const ratio     = (value - min) / (max - min);
  const thumbLeft = trackW ? ratio * usable : 0;
  const fillWidth = trackW ? ratio * usable : 0;

  return (
    <View style={slider.wrapper} onLayout={onLayout} {...panResponder.panHandlers}>
      <View style={[slider.trackBg, { backgroundColor: trackColor, marginHorizontal: THUMB_R }]}>
        <View style={[slider.fill, { width: fillWidth, backgroundColor: accent.primary }]} />
      </View>
      {trackW > 0 && (
        <View style={[slider.thumb, { left: thumbLeft, backgroundColor: accent.primary }]} />
      )}
    </View>
  );
}

const slider = StyleSheet.create({
  wrapper: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 8,   // slider kenarlara dayanmasın
  },
  trackBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_R * 2,
    height: THUMB_R * 2,
    borderRadius: THUMB_R,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});

// ---------------------------------------------------------------------------
// Basılı tutunca sürekli çalışan buton
// ---------------------------------------------------------------------------
function HoldButton({ onPress, disabled, children, style }) {
  const intervalRef = useRef(null);
  const timeoutRef  = useRef(null);

  const startHold = useCallback(() => {
    if (disabled) return;
    onPress();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        onPress();
      }, 80);
    }, 350);
  }, [disabled, onPress]);

  const stopHold = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
    timeoutRef.current  = null;
    intervalRef.current = null;
  }, []);

  return (
    <TouchableOpacity
      style={[style, disabled && { opacity: 0.35 }]}
      onPressIn={startHold}
      onPressOut={stopHold}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
export default function AddTaskModal({ visible, onClose, onAdd }) {
  const [name, setName]               = useState('');
  const [baseXP, setBaseXP]           = useState(25);
  const XP_MIN = 10;
  const [isProject, setIsProject]     = useState(false);
  const [skills, setSkills]           = useState({ ...DEFAULT_SKILLS });
  const [nameError, setNameError]         = useState(false);
  const [customSkillList, setCustomSkillList] = useState([]);
  const [dailyRemaining, setDailyRemaining]   = useState({});

  const { language } = useAppContext();
  const c      = useColors();
  const s      = strings[language]?.modal  ?? strings.tr.modal;
  const skillS = strings[language]?.skills ?? strings.tr.skills;
  const isEN   = language === 'en';

  useEffect(() => {
    if (visible) {
      const loaded   = getCustomSkills();
      const todayGains = getTodaySkillGains();
      setCustomSkillList(loaded);
      const remaining = {};
      for (const key of [...SKILL_KEYS, ...loaded.map((cs) => cs.id)]) {
        remaining[key] = Math.max(0, DAILY_CAP - (todayGains[key] ?? 0));
      }
      setDailyRemaining(remaining);
      setSkills((prev) => {
        const next = { ...DEFAULT_SKILLS };
        for (const cs of loaded) next[cs.id] = prev[cs.id] ?? 0;
        return next;
      });
    }
  }, [visible]);

  function resetForm() {
    setName(''); setBaseXP(25); setIsProject(false);
    setSkills({ ...DEFAULT_SKILLS }); setNameError(false);
  }
  function handleAdd() {
    if (!name.trim()) { setNameError(true); return; }
    onAdd({ id: generateId(), name: name.trim(), baseXP, isProject, skills, count: 0 });
    resetForm(); onClose();
  }
  function handleClose() { resetForm(); onClose(); }

  function changeSkill(key, delta) {
    setSkills((prev) => {
      const current     = prev[key] ?? 0;
      const cap         = dailyRemaining[key] ?? DAILY_CAP;
      const next        = clamp(current + delta, 0, Math.min(10, cap));
      const activeCount = Object.values(prev).filter((v) => v > 0).length;
      if (delta > 0 && current === 0 && activeCount >= 3) return prev;
      if (delta > 0 && next === current) return prev; // already at daily cap
      return { ...prev, [key]: next };
    });
  }

  const totalPts    = Object.values(skills).reduce((a, b) => a + b, 0);
  const activeCount = Object.values(skills).filter((v) => v > 0).length;
  const skillsFull  = activeCount >= 3;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { backgroundColor: c.cardAlt, borderColor: c.border }]}>

          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: c.text }]}>{s.title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Ad */}
            <Text style={[styles.label, { color: c.textSub }]}>{s.nameLabel}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, borderColor: nameError ? accent.danger : c.border, color: c.text }]}
              placeholder={s.namePlaceholder}
              placeholderTextColor={c.textFaint}
              value={name}
              onChangeText={(t) => { setName(t); setNameError(false); }}
              maxLength={60}
            />
            {nameError && <Text style={styles.errorText}>{s.nameError}</Text>}

            {/* XP — sürüklenebilir slider */}
            <Text style={[styles.label, { color: c.textSub }]}>
              {s.xpLabel}{'  '}
              <Text style={{ color: accent.primary, fontWeight: '800' }}>{baseXP}</Text>
            </Text>
            <DragSlider
              value={baseXP}
              min={XP_MIN}
              max={100}
              onChange={setBaseXP}
              trackColor={c.border}
            />
            <Text style={[styles.hint, { color: c.textFaint }]}>{s.xpHint}</Text>

            {/* Proje */}
            <View style={[styles.switchRow, { backgroundColor: c.inputBg, borderColor: c.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: c.textSub, marginTop: 0 }]}>{s.projectLabel}</Text>
                <Text style={[styles.hint, { color: c.textFaint }]}>{s.projectHint}</Text>
              </View>
              <Switch value={isProject} onValueChange={setIsProject}
                trackColor={{ false: c.border, true: accent.primary }} thumbColor={c.text} />
            </View>

            {/* Beceriler */}
            <Text style={[styles.label, { color: c.textSub }]}>
              {s.skillsLabel}{'  '}
              <Text style={{ color: accent.primary, fontWeight: '800' }}>+{totalPts} pt</Text>
              {'  '}
              <Text style={{ color: skillsFull ? accent.danger : c.textFaint, fontWeight: '600' }}>
                ({activeCount}/3)
              </Text>
            </Text>
            <Text style={[styles.hint, { color: c.textFaint }]}>{s.skillsHint}</Text>

            {[
              ...SKILL_KEYS.map((key) => ({ key, name: skillS[key], icon: SKILL_ICONS[key] })),
              ...customSkillList.map((cs) => ({ key: cs.id, name: cs.name, icon: '✨' })),
            ].map(({ key, name: skillName, icon }) => {
              const val       = skills[key] ?? 0;
              const cap       = dailyRemaining[key] ?? DAILY_CAP;
              const dailyFull = cap === 0;
              const locked    = (skillsFull && val === 0) || dailyFull;
              const atMax     = val >= Math.min(10, cap);
              return (
                <View key={key} style={[
                  styles.skillRow,
                  { backgroundColor: c.inputBg, borderColor: locked ? c.borderLight : c.border },
                  locked && { opacity: 0.4 },
                ]}>
                  <Text style={styles.skillIcon}>{icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.skillLabel, { color: c.textSub }]}>{skillName}</Text>
                    {cap < DAILY_CAP && (
                      <Text style={[styles.dailyHint, { color: dailyFull ? accent.danger : c.textFaint }]}>
                        {dailyFull
                          ? (isEN ? 'Daily cap reached' : 'Günlük limit doldu')
                          : (isEN ? `${cap} left today` : `Bugün +${cap} kaldı`)}
                      </Text>
                    )}
                  </View>
                  <HoldButton
                    style={[styles.skillBtn, { backgroundColor: c.border }]}
                    onPress={() => changeSkill(key, -1)}
                    disabled={val === 0}
                  >
                    <Ionicons name="remove" size={18} color={val === 0 ? c.textFaint : c.text} />
                  </HoldButton>
                  <Text style={[styles.skillValue, { color: accent.primary }]}>{val}</Text>
                  <HoldButton
                    style={[styles.skillBtn, { backgroundColor: c.border }]}
                    onPress={() => changeSkill(key, 1)}
                    disabled={locked || atMax}
                  >
                    <Ionicons name="add" size={18} color={(locked || atMax) ? c.textFaint : c.text} />
                  </HoldButton>
                </View>
              );
            })}

            {/* XP Önizleme */}
            {!isProject && (
              <View style={[styles.preview, { backgroundColor: c.bg, borderColor: c.border }]}>
                <Text style={[styles.previewTitle, { color: c.textSub }]}>{s.previewTitle}</Text>
                <Text style={[styles.previewRow, { color: c.textMuted }]}>
                  1. → <Text style={{ color: accent.primary, fontWeight: '700' }}>{baseXP} XP</Text>
                </Text>
                <Text style={[styles.previewRow, { color: c.textMuted }]}>
                  10. → <Text style={{ color: accent.primary, fontWeight: '700' }}>{Math.floor(baseXP / (1 + 9 * 0.1))} XP</Text>
                </Text>
                <Text style={[styles.previewRow, { color: c.textMuted }]}>
                  20. → <Text style={{ color: accent.primary, fontWeight: '700' }}>{Math.floor(baseXP / (1 + 19 * 0.1))} XP</Text>
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: c.border }]} onPress={handleClose}>
              <Text style={[styles.cancelText, { color: c.textMuted }]}>{s.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.addText}>{s.add}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36, maxHeight: '92%', borderWidth: 1,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title:    { fontSize: 20, fontWeight: '800' },
  label:    { fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  hint:     { fontSize: 12, marginBottom: 4 },
  errorText:{ color: accent.danger, fontSize: 12, marginTop: 2 },
  input:    { borderRadius: 10, borderWidth: 1, fontSize: 16, padding: 12 },
  switchRow:{ flexDirection: 'row', alignItems: 'center', marginTop: 16, borderRadius: 12, padding: 14, borderWidth: 1 },
  skillRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, gap: 8 },
  skillIcon:  { fontSize: 18 },
  skillLabel: { fontSize: 14 },
  dailyHint:  { fontSize: 10, marginTop: 1 },
  skillBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  skillValue:{ fontWeight: '800', fontSize: 16, minWidth: 28, textAlign: 'center' },
  preview:  { marginTop: 16, borderRadius: 12, padding: 14, borderWidth: 1 },
  previewTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  previewRow:   { fontSize: 13, marginBottom: 4 },
  btnRow:   { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn:{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelText:{ fontWeight: '700', fontSize: 15 },
  addBtn:   { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: accent.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
});
