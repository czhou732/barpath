// ProgressionEngine — ported from ProgressionEngine.swift
// Double progression: increase reps → when rep cap hit → bump weight.

import { db, getExercises, getPastWorkouts, getWorkoutDetail } from '../db.js';

// ── Double Progression Target ──

export async function progressionTarget(exerciseId, setIndex = 0) {
  const exercises = await getExercises();
  const seed = exercises.find(e => e.id === exerciseId);
  const workouts = await getPastWorkouts(20);

  // Collect last 3 sessions that include this exercise
  const history = [];
  for (const w of workouts) {
    const detail = await getWorkoutDetail(w.id);
    const found = detail.exercises.find(e => e.exerciseId === exerciseId);
    if (found) {
      const sorted = [...found.sets].sort((a, b) => a.order - b.order);
      if (sorted.length > 0) history.push({ date: w.date, sets: sorted });
    }
    if (history.length >= 3) break;
  }

  if (history.length === 0) {
    return { weight: 0, reps: 0, hint: 'First time — start light', delta: 'new' };
  }

  const lastSession = history[0];
  const idx = Math.min(setIndex, lastSession.sets.length - 1);
  const targetSet = lastSession.sets[idx];
  const prevWeight = targetSet.weight;
  const prevReps = targetSet.reps;

  const repCap = seed?.hypertrophyReps?.[1] ?? 12;
  const repFloor = seed?.hypertrophyReps?.[0] ?? 8;

  // Compound check
  const compounds = new Set([
    'squat', 'bench_press', 'deadlift', 'ohp', 'barbell_row', 'incline_bench',
    'front_squat', 'sumo_deadlift', 'hip_thrust', 'pendlay_row', 'rdl'
  ]);
  const isCompound = compounds.has(exerciseId) || (seed?.primaryMuscles?.length || 0) >= 2;
  const increment = isCompound ? 5 : 2.5; // lb

  // Check if all sessions hit rep cap at same weight
  const allHitCap = history.every(session => {
    const s = session.sets[Math.min(idx, session.sets.length - 1)];
    return s.reps >= repCap && s.weight >= prevWeight;
  });

  const lastHitCap = prevReps >= repCap;
  const lastAboveFloor = prevReps >= repFloor;

  if (prevWeight === 0) {
    return { weight: 0, reps: repFloor, hint: 'Start light, find working weight', delta: 'new' };
  }

  if (allHitCap && history.length >= 2) {
    const newWeight = prevWeight + increment;
    return { weight: newWeight, reps: repFloor,
      hint: `↑ Weight: ${fmt(prevWeight)}→${fmt(newWeight)} (hit ${repCap} reps × ${history.length} sessions)`, delta: 'up' };
  }

  if (lastHitCap) {
    return { weight: prevWeight, reps: repCap,
      hint: `✓ Hit ${repCap} reps — one more session → weight increase`, delta: 'hold' };
  }

  if (lastAboveFloor) {
    return { weight: prevWeight, reps: Math.min(prevReps + 1, repCap),
      hint: `→ Add a rep: ${prevReps}→${prevReps + 1} @ ${fmt(prevWeight)}`, delta: 'hold' };
  }

  if (prevReps < repFloor - 2) {
    const newWeight = Math.max(0, prevWeight - increment);
    return { weight: newWeight, reps: repFloor,
      hint: `↓ Deload: only ${prevReps} reps, try ${fmt(newWeight)}`, delta: 'down' };
  }

  return { weight: prevWeight, reps: repFloor,
    hint: `→ Push for ${repFloor} reps @ ${fmt(prevWeight)}`, delta: 'hold' };
}

function fmt(v) {
  return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1);
}

// ── Smart Rest Timer ──

const HEAVY = new Set([
  'squat', 'bench_press', 'deadlift', 'ohp', 'front_squat', 'sumo_deadlift',
  'incline_bench', 'close_grip_bench', 'decline_bench', 'rdl', 'hip_thrust',
]);

const MODERATE = new Set([
  'barbell_row', 'db_bench', 'db_incline_bench', 'db_ohp', 'pullup', 'chinup',
  'pendlay_row', 'dip', 'db_row', 'leg_press', 'hack_squat',
  'bulgarian_split', 'lunge', 'goblet_squat', 'good_morning', 'db_rdl',
  'chest_supported_row', 'machine_row', 'arnold_press',
  'skull_crusher', 'overhead_extension',
]);

export function smartRestSeconds(exerciseId) {
  if (HEAVY.has(exerciseId)) return 180;   // 3:00
  if (MODERATE.has(exerciseId)) return 120; // 2:00
  return 75;                                // 1:15
}

// ── Last Session Helper ──

export async function lastSessionForExercise(exerciseId) {
  const workouts = await getPastWorkouts(20);
  for (const w of workouts) {
    const detail = await getWorkoutDetail(w.id);
    const found = detail.exercises.find(e => e.exerciseId === exerciseId);
    if (found) {
      const sorted = [...found.sets].sort((a, b) => a.order - b.order);
      if (sorted.length > 0) return { date: w.date, sets: sorted };
    }
  }
  return null;
}
