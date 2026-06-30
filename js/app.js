import {
  rankForLevel, xpForLevel, startingLevelFromPushupTest,
  buildWorkout, estimateCalories, buildTrainingDays, buildPenaltyQuest,
} from "./exercises.js";
import { loadState, saveState, clearState, exportStateFile, importStateFile } from "./db.js";

/* ------------------------------------------------------------------ */
/* Pure helpers (date math, conversions, profile/xp logic)             */
/* ------------------------------------------------------------------ */

function pad(n) { return n.toString().padStart(2, "0"); }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addDaysStr(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}
function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}
function formatNice(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function kgToLbs(kg) { return kg * 2.20462; }
function lbsToKg(lbs) { return lbs / 2.20462; }
function cmToFtIn(cm) {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return { ft, inch };
}
function ftInToCm(ft, inch) { return (ft * 12 + inch) * 2.54; }

function rankTitleFull(rank) {
  const names = { E: "E-Rank", D: "D-Rank", C: "C-Rank", B: "B-Rank", A: "A-Rank", S: "S-Rank" };
  return names[rank] || rank;
}

export function computeXP(profile, amount) {
  let { xp, level, xpToNext } = profile;
  xp = Math.max(0, xp + amount);
  let leveledUp = false;
  let fromRank = rankForLevel(level);
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = xpForLevel(level);
    leveledUp = true;
  }
  const toRank = rankForLevel(level);
  return { ...profile, xp, level, xpToNext, leveledUp, rankedUp: fromRank !== toRank, newRank: toRank };
}

export function freshDaily(profile, plan, dateStr) {
  const wd = weekdayOf(dateStr);
  const isTraining = !!plan.trainingDays[wd];
  const workout = isTraining ? buildWorkout(profile.focusArea, profile.goal, profile.level, profile.activity) : [];
  const exerciseChecks = {};
  workout.forEach((ex) => (exerciseChecks[ex.id] = false));

  let penalty = null;
  if (profile.penaltyActive) {
    const items = buildPenaltyQuest(profile.level);
    penalty = { items, checks: Object.fromEntries(items.map((it) => [it.id, false])), completed: false };
  }

  return {
    date: dateStr,
    workout,
    exerciseChecks,
    lifestyleChecks: { water: false, sleep: false },
    completed: false,
    penalty,
  };
}

// Determines whether any scheduled training day between the last tracked
// day and today was missed, and rebuilds today's daily record accordingly.
export function rolloverIfNeeded(state) {
  const today = todayStr();
  if (state.daily.date === today) return state;

  let missed = false;
  let cursor = state.daily.date;
  let guard = 0;
  while (cursor < today && guard < 90) {
    const wasTrackedDay = cursor === state.daily.date;
    const wasCompleted = wasTrackedDay ? state.daily.completed : false;
    const isTrainingDay = !!state.plan.trainingDays[weekdayOf(cursor)];
    if (isTrainingDay && !wasCompleted) missed = true;
    cursor = addDaysStr(cursor, 1);
    guard++;
  }

  let newProfile = { ...state.profile };
  if (missed) {
    newProfile.streak = 0;
    newProfile.penaltyActive = true;
  }

  const newDaily = freshDaily(newProfile, state.plan, today);
  return { ...state, profile: newProfile, daily: newDaily };
}

/* ------------------------------------------------------------------ */
/* App state                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_OB = {
  name: "",
  focusArea: "full",
  goal: "keepfit",
  weightKg: 70,
  heightCm: 175,
  weightUnit: "kg",
  heightUnit: "cm",
  activity: "moderate",
  pushupTest: "beginner",
  daysPerWeek: 4,
  firstDayOfWeek: 0,
};

let UI = {
  screen: "loading", // loading | onboarding | dashboard
  appState: null,
  ob: { ...DEFAULT_OB },
  obStep: 0,
  editingPlan: false,
  settingsOpen: false,
  toast: null,
  levelUpInfo: null,
  resetArmed: false,
};

const root = document.getElementById("app");

async function persist(state) {
  await saveState(state);
}

function showToast(msg) {
  if (!msg) return;
  UI.toast = msg;
  render();
  setTimeout(() => {
    UI.toast = null;
    render();
  }, 1500);
}

/* ------------------------------------------------------------------ */
/* Init                                                                 */
/* ------------------------------------------------------------------ */

async function init() {
  const saved = await loadState();
  if (saved) {
    const updated = rolloverIfNeeded(saved);
    UI.appState = updated;
    if (updated.daily.date !== saved.daily.date) await persist(updated);
    UI.screen = "dashboard";
  } else {
    UI.screen = "onboarding";
  }
  render();
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && UI.appState) {
    const updated = rolloverIfNeeded(UI.appState);
    if (updated.daily.date !== UI.appState.date) {
      UI.appState = updated;
      persist(updated);
      render();
    } else if (updated !== UI.appState) {
      UI.appState = updated;
      persist(updated);
      render();
    }
  }
});

/* ------------------------------------------------------------------ */
/* Onboarding actions                                                   */
/* ------------------------------------------------------------------ */

const OB_STEPS = [
  "name", "focus", "goal", "metrics", "activity", "pushup", "schedule", "review",
];

function startOnboarding(editing) {
  UI.editingPlan = !!editing;
  if (editing && UI.appState) {
    const p = UI.appState.profile;
    UI.ob = {
      name: p.name, focusArea: p.focusArea, goal: p.goal,
      weightKg: p.weightKg, heightCm: p.heightCm,
      weightUnit: p.weightUnit, heightUnit: p.heightUnit,
      activity: p.activity, pushupTest: p.pushupTest,
      daysPerWeek: p.daysPerWeek, firstDayOfWeek: p.firstDayOfWeek,
    };
  } else {
    UI.ob = { ...DEFAULT_OB };
  }
  UI.obStep = 0;
  UI.screen = "onboarding";
  UI.settingsOpen = false;
  render();
}

async function finishOnboarding() {
  const ob = UI.ob;
  const today = todayStr();

  if (UI.editingPlan && UI.appState) {
    const oldProfile = UI.appState.profile;
    const newProfile = {
      ...oldProfile,
      name: ob.name.trim() || "Player",
      focusArea: ob.focusArea,
      goal: ob.goal,
      weightKg: ob.weightKg,
      heightCm: ob.heightCm,
      weightUnit: ob.weightUnit,
      heightUnit: ob.heightUnit,
      activity: ob.activity,
      daysPerWeek: ob.daysPerWeek,
      firstDayOfWeek: ob.firstDayOfWeek,
    };
    const plan = { trainingDays: buildTrainingDays(ob.daysPerWeek) };
    const daily = freshDaily(newProfile, plan, today);
    UI.appState = { profile: newProfile, plan, daily };
  } else {
    const level = startingLevelFromPushupTest(ob.pushupTest);
    const profile = {
      name: ob.name.trim() || "Player",
      focusArea: ob.focusArea,
      goal: ob.goal,
      weightKg: ob.weightKg,
      heightCm: ob.heightCm,
      weightUnit: ob.weightUnit,
      heightUnit: ob.heightUnit,
      activity: ob.activity,
      pushupTest: ob.pushupTest,
      daysPerWeek: ob.daysPerWeek,
      firstDayOfWeek: ob.firstDayOfWeek,
      level,
      xp: 0,
      xpToNext: xpForLevel(level),
      streak: 0,
      lastCompletedDate: null,
      penaltyActive: false,
      stats: { STR: 0, AGI: 0, VIT: 0, END: 0 },
      createdAt: today,
    };
    const plan = { trainingDays: buildTrainingDays(ob.daysPerWeek) };
    const daily = freshDaily(profile, plan, today);
    UI.appState = { profile, plan, daily };
  }

  await persist(UI.appState);
  UI.editingPlan = false;
  UI.obStep = 0;
  UI.screen = "dashboard";
  render();
}

/* ------------------------------------------------------------------ */
/* Dashboard actions                                                    */
/* ------------------------------------------------------------------ */

function applyXpToProfile(profile, amount) {
  const result = computeXP(profile, amount);
  if (result.leveledUp) {
    UI.levelUpInfo = { level: result.level, rank: result.newRank, rankedUp: result.rankedUp };
  }
  const clean = { ...result };
  delete clean.leveledUp;
  delete clean.rankedUp;
  delete clean.newRank;
  return clean;
}

async function toggleExercise(exId) {
  const state = UI.appState;
  if (!state || state.profile.penaltyActive || state.daily.completed) return;
  const checks = { ...state.daily.exerciseChecks };
  const turningOn = !checks[exId];
  checks[exId] = turningOn;

  const ex = state.daily.workout.find((e) => e.id === exId);
  let newProfile = applyXpToProfile(state.profile, turningOn ? 10 : -10);
  if (ex) {
    const stats = { ...newProfile.stats };
    stats[ex.statType] = Math.max(0, (stats[ex.statType] || 0) + (turningOn ? 1 : -1));
    newProfile = { ...newProfile, stats };
  }

  let newDaily = { ...state.daily, exerciseChecks: checks };
  const allDone = state.daily.workout.length > 0 && state.daily.workout.every((e) => checks[e.id]);
  let msg = turningOn ? "+10 XP" : null;

  if (allDone) {
    newProfile = applyXpToProfile(newProfile, 40);
    newProfile.streak = newProfile.streak + 1;
    newProfile.lastCompletedDate = state.daily.date;
    newDaily.completed = true;
    msg = "Quest cleared +40 XP";
  }

  UI.appState = { ...state, profile: newProfile, daily: newDaily };
  await persist(UI.appState);
  showToast(msg);
}

async function toggleLifestyle(key) {
  const state = UI.appState;
  if (!state) return;
  const checks = { ...state.daily.lifestyleChecks };
  const turningOn = !checks[key];
  checks[key] = turningOn;
  let newProfile = applyXpToProfile(state.profile, turningOn ? 5 : -5);
  const statKey = key === "water" ? "END" : "VIT";
  const stats = { ...newProfile.stats };
  stats[statKey] = Math.max(0, (stats[statKey] || 0) + (turningOn ? 1 : -1));
  newProfile = { ...newProfile, stats };
  UI.appState = { ...state, profile: newProfile, daily: { ...state.daily, lifestyleChecks: checks } };
  await persist(UI.appState);
  showToast(turningOn ? "+5 XP" : null);
}

async function togglePenaltyItem(itemId) {
  const state = UI.appState;
  if (!state || !state.daily.penalty || state.daily.penalty.completed) return;
  const checks = { ...state.daily.penalty.checks };
  checks[itemId] = !checks[itemId];
  const allDone = state.daily.penalty.items.every((it) => checks[it.id]);
  let newPenalty = { ...state.daily.penalty, checks };
  let newProfile = { ...state.profile };
  let msg = null;

  if (allDone) {
    newPenalty.completed = true;
    newProfile.penaltyActive = false;
    newProfile = applyXpToProfile(newProfile, 15);
    msg = "Quota restored +15 XP";
  }

  UI.appState = { ...state, profile: newProfile, daily: { ...state.daily, penalty: newPenalty } };
  await persist(UI.appState);
  showToast(msg);
}

async function clearPenaltyManually() {
  const state = UI.appState;
  if (!state) return;
  const newProfile = { ...state.profile, penaltyActive: false };
  const newDaily = { ...state.daily, penalty: state.daily.penalty ? { ...state.daily.penalty, completed: true } : null };
  UI.appState = { ...state, profile: newProfile, daily: newDaily };
  await persist(UI.appState);
  UI.settingsOpen = false;
  render();
}

async function resetAll() {
  await clearState();
  UI.appState = null;
  UI.settingsOpen = false;
  UI.resetArmed = false;
  startOnboarding(false);
}

function handleExport() {
  if (UI.appState) exportStateFile(UI.appState);
}

async function handleImport(file) {
  try {
    const parsed = await importStateFile(file);
    if (!parsed || !parsed.profile || !parsed.plan || !parsed.daily) throw new Error("Invalid file");
    const updated = rolloverIfNeeded(parsed);
    UI.appState = updated;
    await persist(updated);
    UI.settingsOpen = false;
    UI.screen = "dashboard";
    showToast("Backup restored");
  } catch (e) {
    showToast("Could not read that file");
  }
}

/* ------------------------------------------------------------------ */
/* Rendering                                                            */
/* ------------------------------------------------------------------ */

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function render() {
  if (UI.screen === "loading") {
    root.innerHTML = `<div class="boot">INITIALIZING SYSTEM…</div>`;
    return;
  }
  if (UI.screen === "onboarding") {
    root.innerHTML = renderOnboarding();
    wireOnboardingEvents();
    return;
  }
  if (UI.screen === "dashboard" && UI.appState) {
    root.innerHTML = renderDashboard();
    wireDashboardEvents();
    return;
  }
}

/* ---- Onboarding ---- */

const GOALS = [
  { id: "loseweight", label: "Lose Weight", sub: "Higher volume, cardio finishers" },
  { id: "muscle", label: "Build Muscle", sub: "Lower reps, more sets" },
  { id: "keepfit", label: "Keep Fit", sub: "Balanced, sustainable load" },
];
const FOCUS_AREAS = [
  { id: "full", label: "Full Body" },
  { id: "arm", label: "Arms" },
  { id: "chest", label: "Chest" },
  { id: "abs", label: "Abs" },
  { id: "leg", label: "Legs" },
];
const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary", sub: "Desk-bound most of the day" },
  { id: "light", label: "Lightly active", sub: "Some walking, light tasks" },
  { id: "moderate", label: "Moderately active", sub: "Regular movement, exercise 2-3x/wk" },
  { id: "very", label: "Very active", sub: "On your feet most of the day" },
];
const PUSHUP_TESTS = [
  { id: "beginner", label: "Beginner", sub: "3-5 push-ups → starts at E-Rank" },
  { id: "intermediate", label: "Intermediate", sub: "5-10 push-ups → starts at D-Rank" },
  { id: "advanced", label: "Advanced", sub: "10+ push-ups → starts at C-Rank" },
];

function optionList(items, field, current) {
  return `<div class="option-list">${items.map((it) => `
    <button class="option-btn ${current === it.id ? "selected" : ""}" data-action="ob-select" data-field="${field}" data-value="${it.id}">
      ${esc(it.label)}${it.sub ? `<span class="opt-sub">${esc(it.sub)}</span>` : ""}
    </button>`).join("")}</div>`;
}

function renderOnboarding() {
  const ob = UI.ob;
  const step = OB_STEPS[UI.obStep];
  const total = OB_STEPS.length;

  let title = "", sub = "", body = "";

  if (step === "name") {
    title = "Identify yourself";
    sub = "This name appears on your Status Window.";
    body = `<input class="input-text" id="ob-name" placeholder="Player" value="${esc(ob.name)}" maxlength="24" />`;
  } else if (step === "focus") {
    title = "Choose your focus";
    sub = "Where should your daily quests concentrate?";
    body = optionList(FOCUS_AREAS, "focusArea", ob.focusArea);
  } else if (step === "goal") {
    title = "Declare your objective";
    sub = "This shapes how quests scale over time.";
    body = optionList(GOALS, "goal", ob.goal);
  } else if (step === "metrics") {
    title = "Baseline readings";
    sub = "Used only to estimate energy spent per quest.";
    const wDisp = ob.weightUnit === "kg" ? ob.weightKg.toFixed(1) : kgToLbs(ob.weightKg).toFixed(1);
    const hDisp = ob.heightUnit === "cm" ? `${Math.round(ob.heightCm)}` : (() => { const { ft, inch } = cmToFtIn(ob.heightCm); return `${ft}'${inch}"`; })();
    body = `
      <div class="field-row">
        <div class="field-label">
          <span class="name">Weight</span>
          <div class="unit-toggle">
            <button data-action="ob-unit" data-unit-field="weightUnit" data-unit-value="kg" class="${ob.weightUnit === "kg" ? "active" : ""}">kg</button>
            <button data-action="ob-unit" data-unit-field="weightUnit" data-unit-value="lbs" class="${ob.weightUnit === "lbs" ? "active" : ""}">lbs</button>
          </div>
        </div>
        <div class="stepper">
          <button data-action="ob-adjust" data-target="weight" data-delta="-1">−</button>
          <div class="value mono">${wDisp} ${ob.weightUnit}</div>
          <button data-action="ob-adjust" data-target="weight" data-delta="1">+</button>
        </div>
      </div>
      <div class="field-row">
        <div class="field-label">
          <span class="name">Height</span>
          <div class="unit-toggle">
            <button data-action="ob-unit" data-unit-field="heightUnit" data-unit-value="cm" class="${ob.heightUnit === "cm" ? "active" : ""}">cm</button>
            <button data-action="ob-unit" data-unit-field="heightUnit" data-unit-value="ft" class="${ob.heightUnit === "ft" ? "active" : ""}">ft</button>
          </div>
        </div>
        <div class="stepper">
          <button data-action="ob-adjust" data-target="height" data-delta="-1">−</button>
          <div class="value mono">${hDisp}${ob.heightUnit === "cm" ? " cm" : ""}</div>
          <button data-action="ob-adjust" data-target="height" data-delta="1">+</button>
        </div>
      </div>`;
  } else if (step === "activity") {
    title = "Current activity level";
    sub = "How much do you move outside training?";
    body = optionList(ACTIVITY_LEVELS, "activity", ob.activity);
  } else if (step === "pushup") {
    title = "Combat assessment";
    sub = UI.editingPlan ? "Already ranked — this won't change your level." : "How many push-ups can you complete, unbroken?";
    body = optionList(PUSHUP_TESTS, "pushupTest", ob.pushupTest);
  } else if (step === "schedule") {
    title = "Set your quota";
    sub = "Training days per week. Miss a quota day and a Penalty Quest is issued.";
    body = `
      <div class="day-grid">
        ${[1, 2, 3, 4, 5, 6, 7].map((d) => `<button class="day-btn ${ob.daysPerWeek === d ? "selected" : ""}" data-action="ob-select" data-field="daysPerWeek" data-value="${d}">${d}</button>`).join("")}
      </div>
      <div class="section-label" style="margin-top:22px;">First day of week</div>
      <select class="input-text" id="ob-firstday">
        ${WEEKDAY_LETTERS.map((l, i) => `<option value="${i}" ${ob.firstDayOfWeek === i ? "selected" : ""}>${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][i]}</option>`).join("")}
      </select>`;
  } else if (step === "review") {
    const lvl = startingLevelFromPushupTest(ob.pushupTest);
    const rank = rankForLevel(UI.editingPlan ? UI.appState.profile.level : lvl);
    title = "System initializing";
    sub = "Your profile is ready to be logged.";
    body = `
      <div class="status-card">
        <div class="player-name">${esc(ob.name.trim() || "Player")}</div>
        <div class="rank-row">
          <div class="rank-badge">${rank}</div>
          <div>
            <div class="level-num">${UI.editingPlan ? UI.appState.profile.level : lvl}</div>
            <div class="level-label">Level</div>
          </div>
        </div>
        <div class="info-box">
          <div>Focus: <span class="v">${esc(FOCUS_AREAS.find((f) => f.id === ob.focusArea).label)}</span></div>
          <div>Objective: <span class="v">${esc(GOALS.find((g) => g.id === ob.goal).label)}</span></div>
          <div>Quota: <span class="v">${ob.daysPerWeek} days / week</span></div>
        </div>
      </div>
      <p class="disclaimer">Not medical advice. Stop any exercise that causes pain and consult a professional before starting a new training program.</p>`;
  }

  const isLast = step === "review";
  const backBtn = UI.obStep > 0 ? `<button class="btn-secondary" data-action="ob-back">‹ Back</button>` : "";

  return `<div class="wrap">
    <div class="progress-row">
      ${UI.obStep === 0 ? `<div></div>` : `<button class="icon-btn" data-action="ob-back">‹</button>`}
      <div class="progress-bar">${OB_STEPS.map((_, i) => `<div class="progress-seg ${i <= UI.obStep ? "filled" : ""}"></div>`).join("")}</div>
      <div style="width:36px;"></div>
    </div>
    <h1 class="step-title">${title}</h1>
    <p class="step-sub">${sub}</p>
    ${body}
    <div class="btn-row">
      <button class="btn-primary" data-action="${isLast ? "ob-finish" : "ob-next"}">${isLast ? "AWAKEN" : "CONTINUE"}</button>
    </div>
  </div>`;
}

function wireOnboardingEvents() {
  const nameInput = document.getElementById("ob-name");
  if (nameInput) nameInput.addEventListener("input", (e) => { UI.ob.name = e.target.value; });

  const firstDay = document.getElementById("ob-firstday");
  if (firstDay) firstDay.addEventListener("change", (e) => { UI.ob.firstDayOfWeek = Number(e.target.value); });

  root.addEventListener("click", onboardingClick);
}

function onboardingClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === "ob-select") {
    const field = btn.dataset.field;
    let value = btn.dataset.value;
    if (field === "daysPerWeek") value = Number(value);
    UI.ob[field] = value;
    render();
  } else if (action === "ob-unit") {
    UI.ob[btn.dataset.unitField] = btn.dataset.unitValue;
    render();
  } else if (action === "ob-adjust") {
    const delta = Number(btn.dataset.delta);
    if (btn.dataset.target === "weight") {
      if (UI.ob.weightUnit === "kg") {
        UI.ob.weightKg = Math.max(30, Math.round((UI.ob.weightKg + delta * 0.5) * 10) / 10);
      } else {
        const lbs = kgToLbs(UI.ob.weightKg) + delta * 1;
        UI.ob.weightKg = Math.max(30, lbsToKg(lbs));
      }
    } else {
      if (UI.ob.heightUnit === "cm") {
        UI.ob.heightCm = Math.max(100, UI.ob.heightCm + delta * 1);
      } else {
        UI.ob.heightCm = Math.max(100, UI.ob.heightCm + delta * 2.54);
      }
    }
    render();
  } else if (action === "ob-next") {
    UI.obStep = Math.min(OB_STEPS.length - 1, UI.obStep + 1);
    render();
  } else if (action === "ob-back") {
    if (UI.obStep === 0) {
      UI.screen = UI.appState ? "dashboard" : "onboarding";
      UI.editingPlan = false;
      render();
    } else {
      UI.obStep -= 1;
      render();
    }
  } else if (action === "ob-finish") {
    root.removeEventListener("click", onboardingClick);
    finishOnboarding();
  }
}

/* ---- Dashboard ---- */

const DAY_TYPE_NOTE = { full: "Full body", arm: "Arms", chest: "Chest", abs: "Abs", leg: "Legs" };

function statCap(level) { return Math.max(10, level * 5); }

function renderDashboard() {
  const { profile, plan, daily } = UI.appState;
  const today = daily.date;
  const wd = weekdayOf(today);
  const rank = rankForLevel(profile.level);
  const xpPct = Math.min(100, Math.round((profile.xp / profile.xpToNext) * 100));
  const isTraining = !!plan.trainingDays[wd];
  const cap = statCap(profile.level);

  const weightDisplay = profile.weightUnit === "kg" ? `${profile.weightKg.toFixed(1)} kg` : `${kgToLbs(profile.weightKg).toFixed(1)} lbs`;

  let calories = 0;
  if (isTraining && daily.workout.length) calories = estimateCalories(daily.workout, profile.weightKg);

  const weekStrip = `<div class="week-strip">
    ${[0, 1, 2, 3, 4, 5, 6].map((d) => `
      <div class="week-day">
        <span class="letter">${WEEKDAY_LETTERS[d]}</span>
        <div class="week-dot ${d === wd ? "today" : ""} ${plan.trainingDays[d] ? "training" : ""}">${plan.trainingDays[d] ? "●" : "–"}</div>
      </div>`).join("")}
  </div>`;

  let mainSection = "";

  if (profile.penaltyActive && daily.penalty) {
    mainSection = `
      <div class="banner penalty">
        <div class="title">QUOTA FAILURE DETECTED</div>
        <div class="sub">A scheduled quest was missed. Clear this Penalty Quest to resume normal quests.</div>
      </div>
      <div class="quest-list">
        ${daily.penalty.items.map((it) => `
          <button class="quest-row ${daily.penalty.checks[it.id] ? "checked" : ""} ${daily.penalty.completed ? "locked" : ""}" data-action="toggle-penalty" data-id="${it.id}">
            <span class="quest-check"></span>
            <span class="quest-name">${esc(it.name)}<span class="quest-sub">${it.mode === "time" ? it.target + "s hold" : it.target + " reps"}</span></span>
          </button>`).join("")}
      </div>
      <p class="disclaimer">Can't complete this right now? You can clear it manually in Settings.</p>`;
  } else if (!isTraining) {
    mainSection = `
      <div class="day-heading">
        <div class="date">${formatNice(today)}</div>
        <h2>Rest day</h2>
      </div>
      <div class="rest-card">Recovery is part of the system. No quota today.</div>`;
  } else {
    mainSection = `
      <div class="day-heading">
        <div class="date">${formatNice(today)}</div>
        <h2>${esc(DAY_TYPE_NOTE[profile.focusArea] || "Training")} quest</h2>
      </div>
      ${daily.completed ? `<div class="banner success">Quest cleared — streak ${profile.streak}</div>` : ""}
      ${calories ? `<div class="calorie-readout">Estimated exertion: <span class="num">${calories} kcal</span></div>` : ""}
      <div class="quest-list">
        ${daily.workout.map((ex) => `
          <button class="quest-row ${daily.exerciseChecks[ex.id] ? "checked" : ""} ${daily.completed ? "locked" : ""}" data-action="toggle-exercise" data-id="${ex.id}">
            <span class="quest-check"></span>
            <span class="quest-name">${esc(ex.name)}<span class="quest-sub">${ex.sets} sets × ${ex.mode === "time" ? ex.target + "s" : ex.target + " reps"}</span></span>
            <span class="quest-xp">+10</span>
          </button>`).join("")}
      </div>`;
  }

  return `<div class="wrap">
    <div class="topbar">
      <div class="wordmark">Ascend</div>
      <button class="icon-btn" data-action="open-settings">⚙</button>
    </div>

    <div class="status-card">
      <div class="streak-pill">🔥 ${profile.streak}</div>
      <div class="player-name">${esc(profile.name)}</div>
      <div class="rank-row">
        <div class="rank-badge">${rank}</div>
        <div>
          <div class="level-num">${profile.level}</div>
          <div class="level-label">${rankTitleFull(rank)}</div>
        </div>
      </div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${xpPct}%"></div></div>
      <div class="xp-label">${profile.xp} / ${profile.xpToNext} XP</div>
      <div class="stat-grid">
        ${["STR", "AGI", "VIT", "END"].map((s) => `
          <div class="stat-cell">
            <div class="label">${s}</div>
            <div class="val">${profile.stats[s]}</div>
          </div>`).join("")}
      </div>
    </div>

    ${weekStrip}
    ${mainSection}

    <div class="section-label">Daily quests</div>
    <div class="quest-list">
      <button class="quest-row ${daily.lifestyleChecks.water ? "checked" : ""}" data-action="toggle-lifestyle" data-key="water">
        <span class="quest-check"></span>
        <span class="quest-name">Hydrate<span class="quest-sub">2L of water</span></span>
        <span class="quest-xp">+5</span>
      </button>
      <button class="quest-row ${daily.lifestyleChecks.sleep ? "checked" : ""}" data-action="toggle-lifestyle" data-key="sleep">
        <span class="quest-check"></span>
        <span class="quest-name">Sleep<span class="quest-sub">7+ hours</span></span>
        <span class="quest-xp">+5</span>
      </button>
    </div>

    ${UI.toast ? `<div class="toast">${esc(UI.toast)}</div>` : ""}
    ${UI.levelUpInfo ? renderLevelUpModal() : ""}
    ${UI.settingsOpen ? renderSettingsSheet(weightDisplay) : ""}
  </div>`;
}

function renderLevelUpModal() {
  const info = UI.levelUpInfo;
  return `<div class="modal-overlay">
    <div class="modal-card">
      <div class="eyebrow">${info.rankedUp ? "RANK UP" : "LEVEL UP"}</div>
      <div class="big-num mono">${info.level}</div>
      <div class="rank-name">${rankTitleFull(info.rank)}</div>
      <button class="btn-primary" data-action="close-levelup">Continue</button>
    </div>
  </div>`;
}

function renderSettingsSheet(weightDisplay) {
  const { profile } = UI.appState;
  return `<div class="sheet-overlay">
    <div class="sheet">
      <div class="sheet-head">
        <h3>Settings</h3>
        <button class="icon-btn" data-action="close-settings">✕</button>
      </div>
      <div class="info-box">
        <div>Focus: <span class="v">${esc(FOCUS_AREAS.find((f) => f.id === profile.focusArea)?.label || profile.focusArea)}</span></div>
        <div>Objective: <span class="v">${esc(GOALS.find((g) => g.id === profile.goal)?.label || profile.goal)}</span></div>
        <div>Quota: <span class="v">${profile.daysPerWeek} days / week</span></div>
        <div>Weight: <span class="v">${weightDisplay}</span></div>
      </div>
      <button class="settings-btn" data-action="edit-plan">Edit training plan</button>
      <button class="settings-btn" data-action="export-backup">Export backup (.json)</button>
      <label class="settings-btn" for="import-file">Import backup
        <input type="file" id="import-file" accept="application/json" />
      </label>
      ${profile.penaltyActive ? `<button class="settings-btn" data-action="clear-penalty">Clear pending Penalty Quest</button>` : ""}
      <button class="settings-btn danger" data-action="reset-all">${UI.resetArmed ? "Tap again to confirm reset" : "Reset all data"}</button>
      <p class="disclaimer">All data is stored only on this device. To install as an app, use your browser menu → "Add to Home Screen" or "Install app."</p>
    </div>
  </div>`;
}

function wireDashboardEvents() {
  root.addEventListener("click", dashboardClick);
  const importInput = document.getElementById("import-file");
  if (importInput) {
    importInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleImport(file);
    });
  }
}

function dashboardClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === "open-settings") {
    UI.settingsOpen = true;
    UI.resetArmed = false;
    render();
  } else if (action === "close-settings") {
    UI.settingsOpen = false;
    UI.resetArmed = false;
    render();
  } else if (action === "toggle-exercise") {
    root.removeEventListener("click", dashboardClick);
    toggleExercise(btn.dataset.id).then(render).finally(() => root.addEventListener("click", dashboardClick));
  } else if (action === "toggle-lifestyle") {
    root.removeEventListener("click", dashboardClick);
    toggleLifestyle(btn.dataset.key).then(render).finally(() => root.addEventListener("click", dashboardClick));
  } else if (action === "toggle-penalty") {
    root.removeEventListener("click", dashboardClick);
    togglePenaltyItem(btn.dataset.id).then(render).finally(() => root.addEventListener("click", dashboardClick));
  } else if (action === "close-levelup") {
    UI.levelUpInfo = null;
    render();
  } else if (action === "edit-plan") {
    startOnboarding(true);
  } else if (action === "export-backup") {
    handleExport();
  } else if (action === "clear-penalty") {
    clearPenaltyManually();
  } else if (action === "reset-all") {
    if (!UI.resetArmed) {
      UI.resetArmed = true;
      render();
      setTimeout(() => { UI.resetArmed = false; render(); }, 3000);
    } else {
      resetAll();
    }
  }
}

init();
