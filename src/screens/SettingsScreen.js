import React, { useCallback, useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Modal,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getUser, updateUser, clearCompletions, clearTasks, clearTitles, clearCustomSkills } from '../database/database';
import { useAppContext } from '../context/AppContext';
import { strings } from '../utils/i18n';

const RESET_FIELDS = {
  totalXP: 0, discipline: 1, social: 0,
  focus: 0, intelligence: 0, endurance: 0,
  talent: 0, practicality: 0,
};

export default function SettingsScreen() {
  const [user, setUser]              = useState(null);
  const [confirmVisible, setConfirm] = useState(false);
  const { language, theme, setLanguage, setTheme } = useAppContext();
  const s        = strings[language]?.settings ?? strings.tr.settings;
  const navigation = useNavigation();
  const isDark   = theme === 'dark';

  useFocusEffect(
    useCallback(() => { setUser(getUser()); }, [])
  );

  if (!user) return null;

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark';
    updateUser({ theme: next });
    setUser((prev) => ({ ...prev, theme: next }));
    setTheme(next);
  }

  function handleLanguage(lang) {
    updateUser({ language: lang });
    setUser((prev) => ({ ...prev, language: lang }));
    setLanguage(lang);
  }

  function toggleDataShare(value) {
    updateUser({ dataShare: value ? 1 : 0 });
    setUser((prev) => ({ ...prev, dataShare: value ? 1 : 0 }));
  }

  function handleReset() {
    updateUser(RESET_FIELDS);
    clearCompletions();
    clearTasks();
    clearTitles();
    clearCustomSkills();
    setUser((prev) => ({ ...prev, ...RESET_FIELDS }));
    setConfirm(false);
  }

  function handleCancel() {
    setConfirm(false);
    navigation.navigate('Tasks');
  }

  const bg      = isDark ? '#0d0d1a' : '#f0f0f8';
  const cardBg  = isDark ? '#16162a' : '#ffffff';
  const cardBorder = isDark ? '#2a2a4a' : '#e0e0ee';
  const textPrimary   = isDark ? '#e0e0ff' : '#111122';
  const textSecondary = isDark ? '#555577' : '#888899';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.header, { color: textPrimary }]}>{s.header}</Text>

        {/* Görünüm */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={styles.sectionTitle}>{s.appearance}</Text>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: textPrimary }]}>
              {isDark ? s.darkMode : s.lightMode}
            </Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#2a2a4a', true: '#7b61ff' }}
              thumbColor="#e0e0ff"
            />
          </View>
        </View>

        {/* Dil */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={styles.sectionTitle}>{s.language}</Text>
          <View style={styles.langRow}>
            {[{ value: 'tr', label: 'Türkçe' }, { value: 'en', label: 'English' }].map((lang) => (
              <TouchableOpacity
                key={lang.value}
                style={[styles.langBtn, { borderColor: cardBorder }, language === lang.value && styles.langBtnActive]}
                onPress={() => handleLanguage(lang.value)}
              >
                <Text style={[styles.langBtnText, language === lang.value && styles.langBtnTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Gizlilik */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={styles.sectionTitle}>{s.privacy}</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.rowLabel, { color: textPrimary }]}>{s.dataShare}</Text>
              <Text style={[styles.rowSub, { color: textSecondary }]}>{s.dataShareSub}</Text>
            </View>
            <Switch
              value={!!user.dataShare}
              onValueChange={toggleDataShare}
              trackColor={{ false: '#2a2a4a', true: '#7b61ff' }}
              thumbColor="#e0e0ff"
            />
          </View>
        </View>

        {/* Sıfırlama */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={styles.sectionTitle}>{s.dangerZone}</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => setConfirm(true)}>
            <Ionicons name="refresh-circle-outline" size={20} color="#ff6b6b" />
            <Text style={styles.resetBtnText}>{s.resetBtn}</Text>
          </TouchableOpacity>
          <Text style={[styles.rowSub, { color: textSecondary }]}>{s.resetSub}</Text>
        </View>
      </ScrollView>

      {/* Onay Modalı */}
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
        <View style={confirm.overlay}>
          <View style={confirm.box}>
            <Text style={confirm.icon}>⚠️</Text>
            <Text style={confirm.title}>{s.confirmTitle}</Text>
            <Text style={confirm.body}>{s.confirmBody}</Text>
            <View style={confirm.btnRow}>
              <TouchableOpacity style={confirm.yesBtn} onPress={handleReset}>
                <Text style={confirm.yesBtnText}>{s.yes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={confirm.noBtn} onPress={handleCancel}>
                <Text style={confirm.noBtnText}>{s.no}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 24 },
  section: { borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#7b61ff',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 15 },
  rowSub: { fontSize: 12, marginTop: 8, lineHeight: 18 },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: 'center', borderWidth: 1,
  },
  langBtnActive: { borderColor: '#7b61ff', backgroundColor: '#7b61ff22' },
  langBtnText: { color: '#888899', fontWeight: '600' },
  langBtnTextActive: { color: '#7b61ff' },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ff6b6b15', borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: '#ff6b6b44',
  },
  resetBtnText: { color: '#ff6b6b', fontWeight: '700', fontSize: 15 },
});

const confirm = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: '#000000cc',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  box: {
    backgroundColor: '#16162a', borderRadius: 20, padding: 28,
    width: '100%', alignItems: 'center',
    borderWidth: 1, borderColor: '#ff6b6b55',
  },
  icon:  { fontSize: 44, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#e0e0ff', marginBottom: 12 },
  body:  { color: '#a0a0cc', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  btnRow: { flexDirection: 'row', width: '100%', gap: 14 },
  yesBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#ff6b6b', alignItems: 'center', justifyContent: 'center',
  },
  yesBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  noBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#7b61ff', alignItems: 'center', justifyContent: 'center',
  },
  noBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
