// Original bodyweight exercise database, organized by focus area and rank tier.
// Not sourced or copied from any third-party workout database — built fresh
// from common calisthenics movements, in a similar no-equipment spirit.

export const TIERS = { 1: "tier1", 2: "tier2", 3: "tier3" };

export const EXERCISES = {
  chest: [
    { id: "chest-01", name: "Wall push-ups", tier: 1, statType: "STR", mode: "reps", target: 10 },
    { id: "chest-02", name: "Knee push-ups", tier: 1, statType: "STR", mode: "reps", target: 8 },
    { id: "chest-03", name: "Incline push-ups", tier: 1, statType: "STR", mode: "reps", target: 8 },
    { id: "chest-04", name: "Push-ups", tier: 1, statType: "STR", mode: "reps", target: 6 },
    { id: "chest-05", name: "Wide push-ups", tier: 2, statType: "STR", mode: "reps", target: 10 },
    { id: "chest-06", name: "Diamond push-ups", tier: 2, statType: "STR", mode: "reps", target: 8 },
    { id: "chest-07", name: "Decline push-ups", tier: 2, statType: "STR", mode: "reps", target: 8 },
    { id: "chest-08", name: "Pike push-ups", tier: 2, statType: "STR", mode: "reps", target: 8 },
    { id: "chest-09", name: "Archer push-ups", tier: 3, statType: "STR", mode: "reps", target: 6 },
    { id: "chest-10", name: "Slow-negative push-ups", tier: 3, statType: "STR", mode: "reps", target: 8 },
    { id: "chest-11", name: "Clap push-ups", tier: 3, statType: "AGI", mode: "reps", target: 6 },
  ],
  arm: [
    { id: "arm-01", name: "Arm circles", tier: 1, statType: "END", mode: "time", target: 30 },
    { id: "arm-02", name: "Chair tricep dips", tier: 1, statType: "STR", mode: "reps", target: 8 },
    { id: "arm-03", name: "Plank shoulder taps", tier: 1, statType: "AGI", mode: "reps", target: 12 },
    { id: "arm-04", name: "Pike shoulder push-ups", tier: 2, statType: "STR", mode: "reps", target: 8 },
    { id: "arm-05", name: "Diamond push-ups", tier: 2, statType: "STR", mode: "reps", target: 8 },
    { id: "arm-06", name: "Tricep dip pulses", tier: 2, statType: "STR", mode: "reps", target: 12 },
    { id: "arm-07", name: "Wall handstand hold", tier: 3, statType: "STR", mode: "time", target: 20 },
    { id: "arm-08", name: "Wall handstand push-ups", tier: 3, statType: "STR", mode: "reps", target: 5 },
  ],
  abs: [
    { id: "abs-01", name: "Crunches", tier: 1, statType: "VIT", mode: "reps", target: 15 },
    { id: "abs-02", name: "Plank", tier: 1, statType: "VIT", mode: "time", target: 20 },
    { id: "abs-03", name: "Dead bug", tier: 1, statType: "VIT", mode: "reps", target: 10 },
    { id: "abs-04", name: "Bicycle crunches", tier: 1, statType: "VIT", mode: "reps", target: 16 },
    { id: "abs-05", name: "Mountain climbers", tier: 2, statType: "AGI", mode: "reps", target: 20 },
    { id: "abs-06", name: "Russian twists", tier: 2, statType: "VIT", mode: "reps", target: 20 },
    { id: "abs-07", name: "Leg raises", tier: 2, statType: "VIT", mode: "reps", target: 12 },
    { id: "abs-08", name: "Side plank", tier: 2, statType: "VIT", mode: "time", target: 25 },
    { id: "abs-09", name: "V-ups", tier: 3, statType: "VIT", mode: "reps", target: 12 },
    { id: "abs-10", name: "Hollow body hold", tier: 3, statType: "VIT", mode: "time", target: 30 },
    { id: "abs-11", name: "Lying knee tucks", tier: 3, statType: "VIT", mode: "reps", target: 15 },
  ],
  leg: [
    { id: "leg-01", name: "Bodyweight squats", tier: 1, statType: "STR", mode: "reps", target: 12 },
    { id: "leg-02", name: "Glute bridges", tier: 1, statType: "STR", mode: "reps", target: 12 },
    { id: "leg-03", name: "Standing calf raises", tier: 1, statType: "STR", mode: "reps", target: 15 },
    { id: "leg-04", name: "Lunges", tier: 1, statType: "STR", mode: "reps", target: 10 },
    { id: "leg-05", name: "Wall sit", tier: 2, statType: "VIT", mode: "time", target: 25 },
    { id: "leg-06", name: "Chair-assisted split squats", tier: 2, statType: "STR", mode: "reps", target: 10 },
    { id: "leg-07", name: "Jump squats", tier: 2, statType: "AGI", mode: "reps", target: 12 },
    { id: "leg-08", name: "Curtsy lunges", tier: 2, statType: "STR", mode: "reps", target: 10 },
    { id: "leg-09", name: "Single-leg glute bridges", tier: 3, statType: "STR", mode: "reps", target: 10 },
    { id: "leg-10", name: "Assisted pistol squats", tier: 3, statType: "STR", mode: "reps", target: 6 },
    { id: "leg-11", name: "Jump lunges", tier: 3, statType: "AGI", mode: "reps", target: 12 },
  ],
  full: [
    { id: "full-01", name: "Jumping jacks", tier: 1, statType: "END", mode: "time", target: 30 },
    { id: "full-02", name: "Standing march", tier: 1, statType: "END", mode: "time", target: 30 },
    { id: "full-03", name: "Step-back lunges", tier: 1, statType: "STR", mode: "reps", target: 10 },
    { id: "full-04", name: "Bear crawl hold", tier: 2, statType: "STR", mode: "time", target: 20 },
    { id: "full-05", name: "Mountain climbers", tier: 2, statType: "AGI", mode: "reps", target: 20 },
    { id: "full-06", name: "Squat-thrust (no push-up)", tier: 2, statType: "END", mode: "reps", target: 8 },
    { id: "full-07", name: "Plank jacks", tier: 2, statType: "AGI", mode: "reps", target: 16 },
    { id: "full-08", name: "Burpees", tier: 3, statType: "END", mode: "reps", target: 8 },
    { id: "full-09", name: "Squat thrusts", tier: 3, statType: "END", mode: "reps", target: 12 },
    { id: "full-10", name: "High knees", tier: 3, statType: "AGI", mode: "time", target: 30 },
  ],
};

// Approximate MET (metabolic equivalent) values used only for a rough,
// session-level calorie estimate — not a medical-grade calculation.
const MET_BY_STAT = { STR: 3.8, AGI: 8, VIT: 3.5, END: 7 };

export const RANKS = [
  { rank: "E", minLevel: 1 },
  { rank: "D", minLevel: 5 },
  { rank: "C", minLevel: 10 },
  { rank: "B", minLevel: 16 },
  { rank: "A", minLevel: 23 },
  { rank: "S", minLevel: 31 },
];

export function rankForLevel(level) {
  let current = RANKS[0].rank;
  for (const r of RANKS) {
    if (level >= r.minLevel) current = r.rank;
  }
  return current;
}

export function tierForLevel(level) {
  if (level >= 23) return 3;
  if (level >= 10) return 2;
  return 1;
}

export function xpForLevel(level) {
  return 100 + (level - 1) * 40;
}

// Push-up self-test -> starting level (sets initial Rank realistically)
export function startingLevelFromPushupTest(testId) {
  if (testId === "advanced") return 10; // starts at C-rank
  if (testId === "intermediate") return 5; // starts at D-rank
  return 1; // beginner, E-rank
}

const ACTIVITY_BONUS = { sedentary: 0, light: 0.05, moderate: 0.1, very: 0.15 };

function repMultiplier(level, activity) {
  const levelBonus = Math.min(0.5, (level - 1) * 0.02);
  const activityBonus = ACTIVITY_BONUS[activity] ?? 0;
  return 1 + levelBonus + activityBonus;
}

function setsForGoal(goal) {
  if (goal === "muscle") return 4;
  if (goal === "fatloss") return 3;
  return 3; // keepfit
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function eligiblePool(group, maxTier) {
  return EXERCISES[group].filter((e) => e.tier <= maxTier);
}

// Builds today's workout: a sample from the chosen focus area plus one
// full-body/cardio finisher for variety, scaled to current level/activity.
export function buildWorkout(focusArea, goal, level, activity) {
  const maxTier = tierForLevel(level);
  const sets = setsForGoal(goal);
  const mult = repMultiplier(level, activity);

  let picks = [];
  if (focusArea === "full") {
    const groups = ["chest", "arm", "abs", "leg"];
    for (const g of groups) {
      const pool = eligiblePool(g, maxTier);
      if (pool.length) picks.push(shuffle(pool)[0]);
    }
    const finisherPool = eligiblePool("full", maxTier);
    if (finisherPool.length) picks.push(shuffle(finisherPool)[0]);
  } else {
    const focusPool = eligiblePool(focusArea, maxTier);
    picks = shuffle(focusPool).slice(0, 4);
    const finisherPool = eligiblePool("full", maxTier);
    if (finisherPool.length) picks.push(shuffle(finisherPool)[0]);
  }

  return picks.map((ex) => {
    const scaledTarget = Math.round(ex.target * mult);
    return {
      id: ex.id,
      name: ex.name,
      statType: ex.statType,
      mode: ex.mode,
      sets,
      target: Math.max(ex.mode === "time" ? 10 : 4, scaledTarget),
    };
  });
}

function estimateExerciseMinutes(ex) {
  const workSeconds = ex.mode === "time" ? ex.target : ex.target * 3;
  const restSeconds = 30;
  return (ex.sets * (workSeconds + restSeconds)) / 60;
}

export function estimateCalories(workoutExercises, weightKg) {
  if (!weightKg || !workoutExercises?.length) return 0;
  let total = 0;
  for (const ex of workoutExercises) {
    const minutes = estimateExerciseMinutes(ex);
    const met = MET_BY_STAT[ex.statType] || 5;
    total += met * weightKg * (minutes / 60);
  }
  return Math.round(total);
}

// Which weekdays (0=Sun..6=Sat) are training days for a given weekly count.
const SCHEDULE_TEMPLATES = {
  1: [0, 0, 0, 1, 0, 0, 0],
  2: [0, 1, 0, 0, 1, 0, 0],
  3: [0, 1, 0, 1, 0, 1, 0],
  4: [0, 1, 1, 0, 1, 1, 0],
  5: [0, 1, 1, 1, 1, 1, 0],
  6: [0, 1, 1, 1, 1, 1, 1],
  7: [1, 1, 1, 1, 1, 1, 1],
};

export function buildTrainingDays(daysPerWeek) {
  return SCHEDULE_TEMPLATES[daysPerWeek] || SCHEDULE_TEMPLATES[3];
}

// Penalty Quest — a fixed makeup circuit scaled to current tier, issued
// when a scheduled training day was missed. Deliberately modest at low
// tiers so it stays completable rather than risking injury or burnout.
const PENALTY_BY_TIER = {
  1: [
    { name: "Squats", mode: "reps", target: 20, statType: "STR" },
    { name: "Knee push-ups", mode: "reps", target: 15, statType: "STR" },
    { name: "Plank", mode: "time", target: 20, statType: "VIT" },
  ],
  2: [
    { name: "Squats", mode: "reps", target: 40, statType: "STR" },
    { name: "Push-ups", mode: "reps", target: 25, statType: "STR" },
    { name: "Plank", mode: "time", target: 40, statType: "VIT" },
  ],
  3: [
    { name: "Squats", mode: "reps", target: 60, statType: "STR" },
    { name: "Push-ups", mode: "reps", target: 35, statType: "STR" },
    { name: "Plank", mode: "time", target: 60, statType: "VIT" },
  ],
};

export function buildPenaltyQuest(level) {
  const tier = tierForLevel(level);
  const items = PENALTY_BY_TIER[tier];
  return items.map((it, i) => ({ id: `penalty-${i}`, ...it }));
}
