import * as SQLite from 'expo-sqlite';

let db = null;

export function getDB() {
  if (!db) db = SQLite.openDatabaseSync('liferpg.db');
  return db;
}

export function initDatabase() {
  const database = getDB();

  database.execSync(`CREATE TABLE IF NOT EXISTS user (
    id           INTEGER PRIMARY KEY DEFAULT 1,
    totalXP      INTEGER NOT NULL DEFAULT 0,
    discipline   INTEGER NOT NULL DEFAULT 0,
    social       INTEGER NOT NULL DEFAULT 0,
    focus        INTEGER NOT NULL DEFAULT 0,
    intelligence INTEGER NOT NULL DEFAULT 0,
    endurance    INTEGER NOT NULL DEFAULT 0,
    lastLogin    TEXT,
    theme        TEXT NOT NULL DEFAULT 'dark',
    language     TEXT NOT NULL DEFAULT 'tr',
    dataShare    INTEGER NOT NULL DEFAULT 0
  )`);

  database.execSync(`CREATE TABLE IF NOT EXISTS tasks (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    baseXP    INTEGER NOT NULL DEFAULT 10,
    isProject INTEGER NOT NULL DEFAULT 0,
    count     INTEGER NOT NULL DEFAULT 0,
    skills    TEXT NOT NULL DEFAULT '{}'
  )`);

  database.execSync(`CREATE TABLE IF NOT EXISTS titles (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    key        TEXT NOT NULL UNIQUE,
    unlockedAt TEXT NOT NULL
  )`);

  database.execSync(`CREATE TABLE IF NOT EXISTS completions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    taskId      TEXT NOT NULL,
    taskName    TEXT NOT NULL,
    earnedXP    INTEGER NOT NULL DEFAULT 0,
    skillGains  TEXT NOT NULL DEFAULT '{}',
    completedAt TEXT NOT NULL
  )`);

  database.execSync(`CREATE TABLE IF NOT EXISTS custom_skills (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    value     INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  )`);

  database.execSync(`CREATE TABLE IF NOT EXISTS custom_titles (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    skillId    TEXT NOT NULL,
    threshold  INTEGER NOT NULL,
    label      TEXT NOT NULL,
    multiplier REAL NOT NULL
  )`);

  database.runSync('INSERT OR IGNORE INTO user (id) VALUES (1)');

  try { database.execSync('ALTER TABLE user ADD COLUMN talent INTEGER NOT NULL DEFAULT 0'); } catch {}
  try { database.execSync('ALTER TABLE user ADD COLUMN practicality INTEGER NOT NULL DEFAULT 0'); } catch {}
}

// ---------------------------------------------------------------------------
// Kullanıcı
// ---------------------------------------------------------------------------
export function getUser() { return getDB().getFirstSync('SELECT * FROM user WHERE id = 1'); }

export function updateUser(fields) {
  const keys = Object.keys(fields);
  const set  = keys.map((k) => `${k} = ?`).join(', ');
  getDB().runSync(`UPDATE user SET ${set} WHERE id = 1`, keys.map((k) => fields[k]));
}

export function setLastLogin(iso) { updateUser({ lastLogin: iso }); }

// ---------------------------------------------------------------------------
// Görevler
// ---------------------------------------------------------------------------
export function getAllTasks() {
  return getDB().getAllSync('SELECT * FROM tasks ORDER BY name ASC')
    .map((r) => ({ ...r, skills: JSON.parse(r.skills) }));
}
export function insertTask({ id, name, baseXP, isProject, skills }) {
  getDB().runSync('INSERT INTO tasks (id,name,baseXP,isProject,skills) VALUES (?,?,?,?,?)',
    [id, name, baseXP, isProject ? 1 : 0, JSON.stringify(skills ?? {})]);
}
export function incrementTaskCount(id) { getDB().runSync('UPDATE tasks SET count=count+1 WHERE id=?', [id]); }
export function deleteTask(id) { getDB().runSync('DELETE FROM tasks WHERE id=?', [id]); }
export function clearTasks() { getDB().runSync('DELETE FROM tasks'); }

// ---------------------------------------------------------------------------
// Tamamlanma geçmişi
// ---------------------------------------------------------------------------
export function addCompletion(taskId, taskName, earnedXP, skillGains) {
  getDB().runSync('INSERT INTO completions (taskId,taskName,earnedXP,skillGains,completedAt) VALUES (?,?,?,?,?)',
    [taskId, taskName, earnedXP, JSON.stringify(skillGains ?? {}), new Date().toISOString()]);
}
export function getAllCompletions() {
  return getDB().getAllSync('SELECT * FROM completions ORDER BY completedAt DESC')
    .map((r) => ({ ...r, skillGains: JSON.parse(r.skillGains) }));
}
export function getTodayCompletedTaskIds() {
  const start = new Date(); start.setHours(0,0,0,0);
  return new Set(
    getDB().getAllSync('SELECT DISTINCT taskId FROM completions WHERE completedAt >= ?', [start.toISOString()])
      .map((r) => r.taskId)
  );
}
export function clearCompletions() { getDB().runSync('DELETE FROM completions'); }

export function getTodaySkillGains() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const rows = getDB().getAllSync(
    'SELECT skillGains FROM completions WHERE completedAt >= ?',
    [start.toISOString()]
  );
  const totals = {};
  for (const row of rows) {
    for (const [k, v] of Object.entries(JSON.parse(row.skillGains))) {
      totals[k] = (totals[k] ?? 0) + v;
    }
  }
  return totals;
}

// ---------------------------------------------------------------------------
// Lakaplar
// ---------------------------------------------------------------------------
export function getUnlockedTitles() { return getDB().getAllSync('SELECT * FROM titles ORDER BY unlockedAt DESC'); }
export function unlockTitle(key) {
  getDB().runSync('INSERT OR IGNORE INTO titles (key,unlockedAt) VALUES (?,?)', [key, new Date().toISOString()]);
}
export function clearTitles() { getDB().runSync('DELETE FROM titles'); }

// ---------------------------------------------------------------------------
// Özel Beceriler (Beceri Oluşturucu)
// ---------------------------------------------------------------------------
export function getCustomSkills() { return getDB().getAllSync('SELECT * FROM custom_skills ORDER BY createdAt ASC'); }

export function createCustomSkill(id, name, titles) {
  const db = getDB();
  db.runSync('INSERT OR IGNORE INTO custom_skills (id,name,value,createdAt) VALUES (?,?,0,?)',
    [id, name, new Date().toISOString()]);
  for (const t of titles) {
    db.runSync('INSERT INTO custom_titles (skillId,threshold,label,multiplier) VALUES (?,?,?,?)',
      [id, t.threshold, t.label, t.multiplier]);
  }
}

export function getCustomTitles() {
  return getDB().getAllSync('SELECT * FROM custom_titles ORDER BY skillId, threshold ASC');
}

export function updateCustomSkillValue(skillId, delta) {
  getDB().runSync('UPDATE custom_skills SET value = MAX(0, value + ?) WHERE id = ?', [delta, skillId]);
}

export function clearCustomSkills() {
  getDB().runSync('DELETE FROM custom_skills');
  getDB().runSync('DELETE FROM custom_titles');
}
