/**
 * Azalan Verim (Diminishing Returns) XP Algoritması
 *
 * Formül: Kazanılan XP = BaseXP * (1 / (1 + count * 0.1))
 *   - 1. tamamlama  (count=0) → %100 XP
 *   - 10. tamamlama (count=9) → ~%52 XP
 *   - 20. tamamlama (count=19) → ~%34 XP
 *
 * isProject=true olan görevlerde düşüş uygulanmaz.
 */
export function calculateXP(baseXP, completionCount, isProject = false) {
  if (isProject) return baseXP;
  const earned = baseXP * (1 / (1 + completionCount * 0.1));
  return Math.max(1, Math.floor(earned));
}

/**
 * Beceri kazanımını da aynı azalan verim formülüyle hesaplar.
 * skills: { Social: 10, Focus: 20, ... } gibi bir Map.
 * Döndürdüğü Map'teki değerler kazanılacak delta puanlardır.
 */
export function calculateSkillGains(skills, completionCount, isProject = false) {
  const factor = isProject ? 1 : 1 / (1 + completionCount * 0.1);
  const result = {};
  for (const [key, value] of Object.entries(skills)) {
    result[key] = Math.max(0, Math.floor(value * factor));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Disiplin Kontrol Sistemi
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Son giriş tarihi ile bugün arasındaki farkı hesaplar.
 * Döndürür: { missedDays, disciplineDelta, skillPenaltyPercent }
 *
 * Kurallar:
 *   - Bugün giriş yapıldı       → disciplineDelta = +1, penalty = 0
 *   - missedDays gün eksik      → disciplineDelta = -missedDays
 *   - Her 5 eksik gün           → ek %10 beceri kaybı (doğrusal)
 */
export function calculateDisciplineResult(lastLoginISO) {
  if (!lastLoginISO) {
    // İlk açılış: giriş kabul edilir, ceza yok
    return { missedDays: 0, disciplineDelta: 1, skillPenaltyPercent: 0 };
  }

  const now = new Date();
  const last = new Date(lastLoginISO);

  // Saat bilgisini sıfırla — günlük karşılaştırma
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastMidnight = new Date(last.getFullYear(), last.getMonth(), last.getDate());

  const diffDays = Math.floor((todayMidnight - lastMidnight) / MS_PER_DAY);

  if (diffDays === 0) {
    // Aynı gün tekrar açılış — bonus verilmez, ceza da yok
    return { missedDays: 0, disciplineDelta: 0, skillPenaltyPercent: 0 };
  }

  if (diffDays === 1) {
    // Dünden bu yana — normal günlük giriş
    return { missedDays: 0, disciplineDelta: 1, skillPenaltyPercent: 0 };
  }

  // diffDays >= 2 → en az 1 gün atlandı
  const missedDays = diffDays - 1; // dün sayılmaz, öncesindeki günler eksik
  const disciplineDelta = -missedDays;
  // Her 5 eksik gün için %10 ek ceza; örn 5 gün → %10, 10 gün → %20
  const skillPenaltyPercent = Math.min(Math.floor(missedDays / 5) * 10, 100);

  return { missedDays, disciplineDelta, skillPenaltyPercent };
}

/**
 * Beceri cezasını uygular.
 * skills nesnesi: { Social: 120, Focus: 80, ... }
 * penaltyPercent: 0-100
 */
export function applySkillPenalty(skills, penaltyPercent) {
  if (!penaltyPercent || penaltyPercent <= 0) return { ...skills };
  const factor = 1 - penaltyPercent / 100;
  const penalized = {};
  for (const [key, value] of Object.entries(skills)) {
    penalized[key] = Math.max(0, Math.floor(value * factor));
  }
  return penalized;
}

// ---------------------------------------------------------------------------
// Seviye Hesaplama
// ---------------------------------------------------------------------------

/**
 * Toplam XP'ye göre seviyeyi ve bir sonraki seviyeye kalan XP'yi döndürür.
 * Her seviye bir öncekinden %20 daha fazla XP gerektirir.
 * Seviye 1 → 100 XP, Seviye 2 → 120 XP, ...
 */
export function getLevelInfo(totalXP) {
  const BASE_XP = 100;
  const GROWTH = 1.2;

  let level = 1;
  let xpConsumed = 0;
  let xpForNext = BASE_XP;

  while (xpConsumed + xpForNext <= totalXP) {
    xpConsumed += xpForNext;
    level += 1;
    xpForNext = Math.floor(BASE_XP * Math.pow(GROWTH, level - 1));
  }

  const currentXP = totalXP - xpConsumed;
  const progress = xpForNext > 0 ? currentXP / xpForNext : 1;

  return { level, currentXP, xpForNext, progress };
}
