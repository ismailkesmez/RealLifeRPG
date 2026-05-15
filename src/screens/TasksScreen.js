import React, { useCallback, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
  LayoutAnimation, UIManager, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllTasks, insertTask, incrementTaskCount, deleteTask,
  getUser, updateUser, addCompletion, getAllCompletions, getTodayCompletedTaskIds,
  getCustomSkills, updateCustomSkillValue, getTodaySkillGains,
} from '../database/database';

const DAILY_SKILL_CAP = 10;
import { calculateXP, calculateSkillGains } from '../utils/xpCalculator';
import { useAppContext } from '../context/AppContext';
import { strings } from '../utils/i18n';
import { useColors, accent } from '../utils/colors';
import AddTaskModal from '../components/AddTaskModal';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

const STANDARD_SKILLS = new Set(['social', 'focus', 'intelligence', 'endurance', 'discipline', 'talent', 'practicality']);

function formatDate(isoString) {
  const d = new Date(isoString);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getDate()}.${p(d.getMonth() + 1)}.${d.getFullYear()}  ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function CompletedBox({ completions, s, skillS, c, onRepeat }) {
  const [expanded, setExpanded] = useState(false);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  }

  return (
    <View style={[box.container, { backgroundColor: c.card, borderColor: c.border }]}>
      <TouchableOpacity style={box.header} onPress={toggle} activeOpacity={0.8}>
        <View style={box.headerLeft}>
          <Ionicons name="checkmark-done-circle" size={22} color={accent.success} />
          <Text style={[box.headerText, { color: c.text }]}>{s.completed}</Text>
          <View style={[box.badge, { backgroundColor: accent.successBg, borderColor: `${accent.success}66` }]}>
            <Text style={[box.badgeText, { color: accent.success }]}>{completions.length}</Text>
          </View>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={box.list}>
          <View style={[box.divider, { backgroundColor: c.border }]} />
          {completions.length === 0 ? (
            <Text style={[box.empty, { color: c.textFaint }]}>{s.noCompleted}</Text>
          ) : (
            completions.map((item) => (
              <View key={item.id} style={[box.row, { borderBottomColor: c.borderLight }]}>
                <View style={box.rowLeft}>
                  <Text style={[box.rowName, { color: c.textSub }]}>{item.taskName}</Text>
                  <Text style={[box.rowDate, { color: c.textFaint }]}>{formatDate(item.completedAt)}</Text>
                  {Object.entries(item.skillGains)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => (
                      <Text key={k} style={[box.rowSkill, { color: c.textMuted }]}>
                        +{v} {skillS[k]}
                      </Text>
                    ))}
                </View>
                <View style={box.rowRight}>
                  <Text style={[box.rowXP, { color: accent.success }]}>+{item.earnedXP} XP</Text>
                  <TouchableOpacity
                    style={[box.repeatBtn, { borderColor: c.border }]}
                    onPress={() => onRepeat(item.taskId)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh-outline" size={13} color={accent.primary} />
                    <Text style={[box.repeatText, { color: accent.primary }]}>{s.repeat}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function TasksScreen() {
  const [tasks, setTasks]               = useState([]);
  const [completions, setCompletions]   = useState([]);
  const [modalVisible, setModal]        = useState(false);
  const [toast, setToast]               = useState(null);
  const [customSkills, setCustomSkills] = useState([]);
  const repeatedIdsRef = useRef(new Set());

  const { language } = useAppContext();
  const c      = useColors();
  const s      = strings[language]?.tasks  ?? strings.tr.tasks;
  const skillS = strings[language]?.skills ?? strings.tr.skills;

  function loadData() {
    const allTasks       = getAllTasks();
    const completedToday = getTodayCompletedTaskIds();
    setTasks(allTasks.filter((t) => !completedToday.has(t.id) || repeatedIdsRef.current.has(t.id)));
    setCompletions(getAllCompletions());
    setCustomSkills(getCustomSkills());
  }

  useFocusEffect(useCallback(() => { loadData(); }, []));

  function handleAdd(task) {
    insertTask(task);
    setTasks((prev) => [...prev, task].sort((a, b) => a.name.localeCompare(b.name)));
  }

  function handleRepeat(taskId) {
    if (tasks.find((t) => t.id === taskId)) return; // already in active list
    const task = getAllTasks().find((t) => t.id === taskId);
    if (!task) return; // task was deleted
    repeatedIdsRef.current.add(taskId);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTasks((prev) => [...prev, task].sort((a, b) => a.name.localeCompare(b.name)));
  }

  function handleComplete(task) {
    const earnedXP    = calculateXP(task.baseXP, task.count, !!task.isProject);
    const rawGains    = calculateSkillGains(task.skills, task.count, !!task.isProject);
    const todayGains  = getTodaySkillGains();

    // Cap each skill gain at the remaining daily allowance
    const skillGains = {};
    for (const [key, val] of Object.entries(rawGains)) {
      const remaining = Math.max(0, DAILY_SKILL_CAP - (todayGains[key] ?? 0));
      skillGains[key] = Math.min(val, remaining);
    }

    incrementTaskCount(task.id);
    addCompletion(task.id, task.name, earnedXP, skillGains);

    const user = getUser();
    if (user) {
      const updates = { totalXP: (user.totalXP ?? 0) + earnedXP };
      for (const [key, val] of Object.entries(skillGains)) {
        if (STANDARD_SKILLS.has(key)) {
          updates[key] = (user[key] ?? 0) + val;
        } else if (val > 0) {
          updateCustomSkillValue(key, val);
        }
      }
      updateUser(updates);
    }

    repeatedIdsRef.current.delete(task.id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setCompletions((prev) => [{
      id: Date.now(), taskId: task.id, taskName: task.name,
      earnedXP, skillGains, completedAt: new Date().toISOString(),
    }, ...prev]);

    setToast({ xp: earnedXP, skills: skillGains, name: task.name });
    setTimeout(() => setToast(null), 2500);
  }

  function handleDelete(task) {
    Alert.alert(s.deleteTitle, s.deleteMsg(task.name), [
      { text: s.cancel, style: 'cancel' },
      {
        text: s.delete, style: 'destructive',
        onPress: () => {
          deleteTask(task.id);
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
        },
      },
    ]);
  }

  const customSkillMap = Object.fromEntries(customSkills.map((cs) => [cs.id, cs.name]));
  const allSkillNames  = { ...skillS, ...customSkillMap };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <Text style={[styles.header, { color: c.text }]}>{s.header}</Text>

      {toast && (
        <View style={[styles.toast, { backgroundColor: c.card, borderColor: accent.success }]}>
          <Text style={[styles.toastXP, { color: accent.success }]}>+{toast.xp} XP  ✓ {toast.name}</Text>
          {Object.entries(toast.skills).filter(([, v]) => v > 0).map(([k, v]) => (
            <Text key={k} style={[styles.toastSkill, { color: c.textSub }]}>+{v} {allSkillNames[k] ?? k}</Text>
          ))}
        </View>
      )}

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<CompletedBox completions={completions} s={s} skillS={allSkillNames} c={c} onRepeat={handleRepeat} />}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: c.textMuted }]}>
            {completions.length > 0 ? s.allDone : s.empty}
          </Text>
        }
        renderItem={({ item }) => {
          const previewXP  = calculateXP(item.baseXP, item.count, !!item.isProject);
          const skillPairs = Object.entries(item.skills ?? {}).filter(([, v]) => v > 0);
          return (
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.cardInfo}>
                <Text style={[styles.taskName, { color: c.text }]}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <View style={[styles.xpBadge, { backgroundColor: accent.primaryBg, borderColor: `${accent.primary}55` }]}>
                    <Text style={styles.xpBadgeText}>
                      {item.isProject ? `📁 ${s.project}` : `⚡ ${previewXP} XP`}
                    </Text>
                  </View>
                  <Text style={[styles.countText, { color: c.textFaint }]}>{item.count}x</Text>
                </View>
                {skillPairs.length > 0 && (
                  <Text style={[styles.skillPreview, { color: c.textMuted }]}>
                    {skillPairs.map(([k, v]) => `${allSkillNames[k] ?? k} +${v}`).join('  ·  ')}
                  </Text>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={18} color={c.textFaint} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(item)}>
                  <Ionicons name="checkmark-circle" size={36} color={accent.primary} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddTaskModal visible={modalVisible} onClose={() => setModal(false)} onAdd={handleAdd} />
    </SafeAreaView>
  );
}

const box = StyleSheet.create({
  container:  { borderRadius: 14, borderWidth: 1, marginBottom: 6, overflow: 'hidden' },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontWeight: '700', fontSize: 15 },
  badge:      { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1, borderWidth: 1 },
  badgeText:  { fontWeight: '800', fontSize: 12 },
  divider:    { height: 1, marginHorizontal: 14 },
  list:       { paddingHorizontal: 14, paddingBottom: 8 },
  empty:      { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1,
  },
  rowLeft:  { flex: 1, marginRight: 8 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  rowName:  { fontSize: 14, fontWeight: '600' },
  rowDate:  { fontSize: 11, marginTop: 2 },
  rowSkill: { fontSize: 11 },
  rowXP:    { fontWeight: '800', fontSize: 15 },
  repeatBtn:{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  repeatText:{ fontSize: 11, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header:    { fontSize: 22, fontWeight: '700', padding: 16, paddingBottom: 8 },
  toast:     { marginHorizontal: 16, marginBottom: 6, borderRadius: 12, padding: 12, borderWidth: 1 },
  toastXP:   { fontWeight: '800', fontSize: 15 },
  toastSkill:{ fontSize: 12, marginTop: 2 },
  empty:     { textAlign: 'center', marginTop: 40, fontSize: 15, lineHeight: 26 },
  card: {
    borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
  },
  cardInfo:     { flex: 1 },
  taskName:     { fontSize: 16, fontWeight: '600' },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  xpBadge:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  xpBadgeText:  { color: accent.primary, fontSize: 12, fontWeight: '700' },
  countText:    { fontSize: 12 },
  skillPreview: { fontSize: 11, marginTop: 5 },
  actions:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteBtn:    { padding: 6 },
  completeBtn:  { padding: 2 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28, backgroundColor: accent.primary,
    alignItems: 'center', justifyContent: 'center', elevation: 8,
    shadowColor: accent.primary, shadowOpacity: 0.4,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
});
