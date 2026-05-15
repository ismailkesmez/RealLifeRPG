export const TITLE_DEFINITIONS = [
  // ── Sosyal ──────────────────────────────────────────────────────────────
  { key: 'socialApprntice',    skill: 'social',       threshold: 50,  bonus: { multiplier: 1.05 }, label: { tr: 'Sosyal Çırak',           en: 'Social Apprentice'      } },
  { key: 'socialAdept',        skill: 'social',       threshold: 100, bonus: { multiplier: 1.10 }, label: { tr: 'Sosyal Usta',             en: 'Social Adept'           } },
  { key: 'socialCharisma',     skill: 'social',       threshold: 150, bonus: { multiplier: 1.18 }, label: { tr: 'Karizmatik',              en: 'Charismatic'            } },
  { key: 'socialLegend',       skill: 'social',       threshold: 200, bonus: { multiplier: 1.28 }, label: { tr: 'Sosyal Efsane',           en: 'Social Legend'          } },
  { key: 'socialGod',          skill: 'social',       threshold: 250, bonus: { multiplier: 1.40 }, label: { tr: 'İnsan Mıknatısı',         en: 'People Magnet'          } },
  // ── Odak ────────────────────────────────────────────────────────────────
  { key: 'focusSeeked',        skill: 'focus',        threshold: 50,  bonus: { multiplier: 1.05 }, label: { tr: 'Odak Arayan',             en: 'Focus Seeker'           } },
  { key: 'focusMaster',        skill: 'focus',        threshold: 100, bonus: { multiplier: 1.15 }, label: { tr: 'Konsantrasyon Ustası',    en: 'Focus Master'           } },
  { key: 'focusDeep',          skill: 'focus',        threshold: 150, bonus: { multiplier: 1.22 }, label: { tr: 'Derin Odak',              en: 'Deep Focus'             } },
  { key: 'focusMindLord',      skill: 'focus',        threshold: 200, bonus: { multiplier: 1.32 }, label: { tr: 'Zihin Hakimi',            en: 'Mind Lord'              } },
  { key: 'focusAbsolute',      skill: 'focus',        threshold: 250, bonus: { multiplier: 1.45 }, label: { tr: 'Mutlak Konsantrasyon',    en: 'Absolute Concentration' } },
  // ── Zeka ────────────────────────────────────────────────────────────────
  { key: 'scholarJr',          skill: 'intelligence', threshold: 50,  bonus: { multiplier: 1.05 }, label: { tr: 'Akademisyen Adayı',       en: 'Scholar Jr.'            } },
  { key: 'scholar',            skill: 'intelligence', threshold: 100, bonus: { multiplier: 1.20 }, label: { tr: 'Akademisyen',             en: 'Scholar'                } },
  { key: 'genius',             skill: 'intelligence', threshold: 150, bonus: { multiplier: 1.28 }, label: { tr: 'Deha',                    en: 'Genius'                 } },
  { key: 'superGenius',        skill: 'intelligence', threshold: 200, bonus: { multiplier: 1.38 }, label: { tr: 'Üstün Deha',              en: 'Super Genius'           } },
  { key: 'pureIntellect',      skill: 'intelligence', threshold: 250, bonus: { multiplier: 1.50 }, label: { tr: 'Saf Zeka',                en: 'Pure Intellect'         } },
  // ── Dayanıklılık ────────────────────────────────────────────────────────
  { key: 'ironWill',           skill: 'endurance',    threshold: 50,  bonus: { multiplier: 1.05 }, label: { tr: 'Demir İrade',             en: 'Iron Will'              } },
  { key: 'titanBody',          skill: 'endurance',    threshold: 100, bonus: { multiplier: 1.15 }, label: { tr: 'Titan Vücut',             en: 'Titan Body'             } },
  { key: 'steelBody',          skill: 'endurance',    threshold: 150, bonus: { multiplier: 1.22 }, label: { tr: 'Çelik Vücut',             en: 'Steel Body'             } },
  { key: 'legendEndurance',    skill: 'endurance',    threshold: 200, bonus: { multiplier: 1.32 }, label: { tr: 'Efsane Dayanıklılık',     en: 'Legendary Endurance'    } },
  { key: 'immortal',           skill: 'endurance',    threshold: 250, bonus: { multiplier: 1.45 }, label: { tr: 'Ölümsüz',                 en: 'Immortal'               } },
  // ── Disiplin ────────────────────────────────────────────────────────────
  { key: 'disciplined',        skill: 'discipline',   threshold: 50,  bonus: { multiplier: 1.10 }, label: { tr: 'Disiplinli',              en: 'Disciplined'            } },
  { key: 'ironDiscipline',     skill: 'discipline',   threshold: 100, bonus: { multiplier: 1.25 }, label: { tr: 'Demir Disiplin',          en: 'Iron Discipline'        } },
  { key: 'steelDiscipline',    skill: 'discipline',   threshold: 150, bonus: { multiplier: 1.32 }, label: { tr: 'Çelik Disiplin',          en: 'Steel Discipline'       } },
  { key: 'absoluteDiscipline', skill: 'discipline',   threshold: 200, bonus: { multiplier: 1.42 }, label: { tr: 'Mutlak Disiplin',         en: 'Absolute Discipline'    } },
  { key: 'disciplineGod',      skill: 'discipline',   threshold: 250, bonus: { multiplier: 1.55 }, label: { tr: 'Disiplin Tanrısı',        en: 'God of Discipline'      } },
  // ── Yetenek ─────────────────────────────────────────────────────────────
  { key: 'talented',           skill: 'talent',       threshold: 50,  bonus: { multiplier: 1.05 }, label: { tr: 'Yetenekli',               en: 'Talented'               } },
  { key: 'naturalTalent',      skill: 'talent',       threshold: 100, bonus: { multiplier: 1.15 }, label: { tr: 'Doğal Yetenek',           en: 'Natural Talent'         } },
  { key: 'exception',          skill: 'talent',       threshold: 150, bonus: { multiplier: 1.22 }, label: { tr: 'İstisna',                 en: 'Exception'              } },
  { key: 'rareTalent',         skill: 'talent',       threshold: 200, bonus: { multiplier: 1.32 }, label: { tr: 'Nadir Yetenek',           en: 'Rare Talent'            } },
  { key: 'legendaryTalent',    skill: 'talent',       threshold: 250, bonus: { multiplier: 1.45 }, label: { tr: 'Efsanevi Yetenek',        en: 'Legendary Talent'       } },
  // ── Pratiklik ───────────────────────────────────────────────────────────
  { key: 'practical',          skill: 'practicality', threshold: 50,  bonus: { multiplier: 1.05 }, label: { tr: 'Pratik',                  en: 'Practical'              } },
  { key: 'skilled',            skill: 'practicality', threshold: 100, bonus: { multiplier: 1.15 }, label: { tr: 'Becerikli',               en: 'Skilled'                } },
  { key: 'masterCraftsman',    skill: 'practicality', threshold: 150, bonus: { multiplier: 1.22 }, label: { tr: 'Usta İşçi',               en: 'Master Craftsman'       } },
  { key: 'versatile',          skill: 'practicality', threshold: 200, bonus: { multiplier: 1.32 }, label: { tr: 'Çok Yönlü',              en: 'Versatile'              } },
  { key: 'practicalGenius',    skill: 'practicality', threshold: 250, bonus: { multiplier: 1.45 }, label: { tr: 'Pratik Deha',             en: 'Practical Genius'       } },
];
