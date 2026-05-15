import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { useColors, accent } from '../utils/colors';
import { createCustomSkill } from '../database/database';
import { TITLE_DEFINITIONS } from '../data/titleDefinitions';

function generateId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function getAverageMultiplier(threshold) {
  const matches = TITLE_DEFINITIONS.filter((t) => t.threshold === threshold);
  if (!matches.length) return 1.0;
  const sum = matches.reduce((acc, t) => acc + t.bonus.multiplier, 0);
  return Math.round((sum / matches.length) * 100) / 100;
}

const THRESHOLDS = [150, 200, 250];

export default function SkillCreatorModal({ visible, onClose, onCreated }) {
  const [skillName, setSkillName] = useState('');
  const [titleNames, setTitleNames] = useState({ 150: '', 200: '', 250: '' });
  const [errors, setErrors]        = useState({});

  const { language } = useAppContext();
  const c    = useColors();
  const isEN = language === 'en';

  function resetForm() {
    setSkillName('');
    setTitleNames({ 150: '', 200: '', 250: '' });
    setErrors({});
  }

  function handleClose() { resetForm(); onClose(); }

  function handleCreate() {
    const newErrors = {};
    if (!skillName.trim()) newErrors.skillName = true;
    for (const t of THRESHOLDS) {
      if (!titleNames[t]?.trim()) newErrors[t] = true;
    }
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    const id     = generateId();
    const titles = THRESHOLDS.map((threshold) => ({
      threshold,
      label:      titleNames[threshold].trim(),
      multiplier: getAverageMultiplier(threshold),
    }));
    createCustomSkill(id, skillName.trim(), titles);
    resetForm();
    onClose();
    onCreated?.();
  }

  function setTitleName(threshold, value) {
    setTitleNames((prev) => ({ ...prev, [threshold]: value }));
    setErrors((prev) => ({ ...prev, [threshold]: false }));
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={st.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[st.sheet, { backgroundColor: c.cardAlt, borderColor: c.border }]}>

          <View style={st.headerRow}>
            <Text style={[st.title, { color: c.text }]}>
              {isEN ? '✨ Skill Creator' : '✨ Beceri Oluşturucu'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            <Text style={[st.label, { color: c.textSub }]}>
              {isEN ? 'Skill Name' : 'Beceri Adı'}
            </Text>
            <TextInput
              style={[st.input, {
                backgroundColor: c.inputBg,
                borderColor: errors.skillName ? accent.danger : c.border,
                color: c.text,
              }]}
              placeholder={isEN ? 'e.g. Creativity' : 'örn. Yaratıcılık'}
              placeholderTextColor={c.textFaint}
              value={skillName}
              onChangeText={(t) => { setSkillName(t); setErrors((p) => ({ ...p, skillName: false })); }}
              maxLength={30}
            />

            <Text style={[st.sectionLabel, { color: accent.primary }]}>
              {isEN ? 'Titles  (XP bonus auto-calculated)' : 'Lakaplar  (bonus otomatik hesaplanır)'}
            </Text>

            {THRESHOLDS.map((threshold) => (
              <View key={threshold} style={[st.thresholdRow, {
                backgroundColor: c.inputBg,
                borderColor: errors[threshold] ? accent.danger : c.border,
              }]}>
                <View style={st.badge}>
                  <Text style={st.badgeText}>{threshold}</Text>
                </View>
                <TextInput
                  style={[st.thresholdInput, { color: c.text }]}
                  placeholder={isEN ? 'Title name…' : 'Lakap adı…'}
                  placeholderTextColor={c.textFaint}
                  value={titleNames[threshold]}
                  onChangeText={(t) => setTitleName(threshold, t)}
                  maxLength={40}
                />
                <Text style={[st.multiplier, { color: accent.primary }]}>
                  ×{getAverageMultiplier(threshold)}
                </Text>
              </View>
            ))}

            <View style={[st.infoBox, { backgroundColor: c.inputBg, borderColor: c.border }]}>
              <Text style={[st.infoText, { color: c.textMuted }]}>
                {isEN
                  ? 'XP multipliers are averaged from existing titles at the same threshold.'
                  : 'XP çarpanları, aynı eşikteki mevcut lakapların ortalamasıyla belirlenir.'}
              </Text>
            </View>

          </ScrollView>

          <View style={st.btnRow}>
            <TouchableOpacity style={[st.cancelBtn, { borderColor: c.border }]} onPress={handleClose}>
              <Text style={[st.cancelText, { color: c.textMuted }]}>{isEN ? 'Cancel' : 'İptal'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.createBtn} onPress={handleCreate}>
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={st.createText}>{isEN ? 'Create' : 'Oluştur'}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36, maxHeight: '90%', borderWidth: 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title:     { fontSize: 20, fontWeight: '800' },
  label:     { fontSize: 13, fontWeight: '700', marginTop: 8, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  input:     { borderRadius: 10, borderWidth: 1, fontSize: 16, padding: 12 },
  thresholdRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, borderWidth: 1, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 10, gap: 10,
  },
  badge:          { backgroundColor: accent.primaryBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, minWidth: 48, alignItems: 'center' },
  badgeText:      { color: accent.primary, fontWeight: '800', fontSize: 13 },
  thresholdInput: { flex: 1, fontSize: 15, paddingVertical: 2 },
  multiplier:     { fontWeight: '800', fontSize: 14 },
  infoBox:  { borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 12, marginBottom: 4 },
  infoText: { fontSize: 12, lineHeight: 18 },
  btnRow:    { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelText:{ fontWeight: '700', fontSize: 15 },
  createBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: accent.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  createText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
});
