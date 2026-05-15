import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { initDatabase, getUser, updateUser } from './src/database/database';
import { calculateDisciplineResult, applySkillPenalty } from './src/utils/xpCalculator';
import { strings } from './src/utils/i18n';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

enableScreens();

function runDisciplineCheck() {
  const user = getUser();
  if (!user) return { missedDays: 0, disciplineDelta: 0, skillPenaltyPercent: 0 };

  const result = calculateDisciplineResult(user.lastLogin);
  const newDiscipline = Math.max(1, (user.discipline ?? 1) + result.disciplineDelta);
  const updates = { discipline: newDiscipline };

  if (result.skillPenaltyPercent > 0) {
    const skills = {
      social: user.social, focus: user.focus,
      intelligence: user.intelligence, endurance: user.endurance,
      talent: user.talent, practicality: user.practicality,
    };
    Object.assign(updates, applySkillPenalty(skills, result.skillPenaltyPercent));
  }
  if (result.disciplineDelta !== 0) updates.lastLogin = new Date().toISOString();
  updateUser(updates);
  return result;
}

function DisciplineModal({ result, language, onClose }) {
  if (!result || result.missedDays === 0) return null;
  const s = strings[language]?.discipline ?? strings.tr.discipline;
  const isHeavy = result.skillPenaltyPercent > 0;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.box}>
          <Text style={modal.icon}>{isHeavy ? '💀' : '⚠️'}</Text>
          <Text style={modal.title}>{isHeavy ? s.heavy : s.warning}</Text>
          <Text style={modal.body}>
            {s.missed(result.missedDays)}{'\n'}
            {s.delta(result.disciplineDelta)}
            {isHeavy ? s.penalty(result.skillPenaltyPercent) : ''}
          </Text>
          <TouchableOpacity style={modal.btn} onPress={onClose}>
            <Text style={modal.btnText}>{s.ok}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const [ready, setReady]                   = useState(false);
  const [disciplineResult, setDisciplineResult] = useState(null);
  const [initialLanguage, setInitialLanguage]   = useState('tr');
  const [initialTheme, setInitialTheme]         = useState('dark');

  useEffect(() => {
    try {
      initDatabase();
      const result = runDisciplineCheck();
      setDisciplineResult(result);
      const user = getUser();
      if (user) {
        setInitialLanguage(user.language ?? 'tr');
        setInitialTheme(user.theme ?? 'dark');
      }
    } catch (e) {
      console.error('Startup error:', e);
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={appStyles.loading}>
          <ActivityIndicator size="large" color="#7b61ff" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <AppProvider initialLanguage={initialLanguage} initialTheme={initialTheme}>
      <SafeAreaProvider>
        <StatusBar style={initialTheme === 'dark' ? 'light' : 'dark'} />
        <AppNavigator />
        <DisciplineModal
          result={disciplineResult}
          language={initialLanguage}
          onClose={() => setDisciplineResult(null)}
        />
      </SafeAreaProvider>
    </AppProvider>
  );
}

const appStyles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0d0d1a', alignItems: 'center', justifyContent: 'center' },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: '#000000cc',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  box: {
    backgroundColor: '#16162a', borderRadius: 20, padding: 28,
    alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: '#7b61ff',
  },
  icon:  { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#e0e0ff', marginBottom: 12 },
  body:  { color: '#a0a0cc', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  btn: {
    marginTop: 24, backgroundColor: '#7b61ff',
    borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
