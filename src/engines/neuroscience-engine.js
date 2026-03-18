// NeuroscienceEngine — ported 1:1 from NeuroscienceEngine.swift
// Evidence-based training physiology computations.

import { db, getExercises, getPastWorkouts, getWorkoutDetail } from '../db.js';

// ═══════════════════════════════════════════════════════
// 1 — ANS Balance (Autonomic Nervous System)
// Plews et al. (2013) — HRV coefficient of variation
// ═══════════════════════════════════════════════════════

export function ansBalance(hrvHistory) {
  if (!hrvHistory || hrvHistory.length < 3) {
    return { cv: 0, state: 'balanced', label: 'Insufficient data',
      recommendation: 'Sync Apple Health for 3+ nights of HRV data', mean: 0, sd: 0 };
  }
  const values = hrvHistory.map(h => h.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean <= 0) return { cv: 0, state: 'balanced', label: 'No HRV data', recommendation: '', mean: 0, sd: 0 };

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const sd = Math.sqrt(variance);
  const cv = (sd / mean) * 100;

  let state, label, recommendation;
  if (cv < 5) {
    state = 'parasympathetic';
    label = 'Parasympathetic-dominant';
    recommendation = 'Nervous system recovered — cleared for high-intensity work';
  } else if (cv < 10) {
    state = 'balanced';
    label = 'Autonomically balanced';
    recommendation = 'Normal training capacity — maintain current load';
  } else {
    state = 'sympathetic';
    label = 'Sympathetic shift detected';
    recommendation = 'Accumulated fatigue — consider reducing volume 20-30%';
  }
  return { cv, state, label, recommendation, mean, sd };
}

// ═══════════════════════════════════════════════════════
// 2 — MPS Windows (Muscle Protein Synthesis)
// Damas et al. (2015) — MPS elevation duration
// ═══════════════════════════════════════════════════════

export function mpsWindow(muscle, lastTrainedDate, now = new Date()) {
  const hours = Math.floor((now - new Date(lastTrainedDate)) / 3600000);
  let phase, decay;
  if (hours < 24) {
    phase = 'active';    // still synthesizing
    decay = hours / 72;
  } else if (hours < 72) {
    phase = 'prime';     // optimal re-training window
    decay = hours / 72;
  } else {
    phase = 'closed';    // MPS returned to baseline
    decay = 1.0;
  }
  return { muscle, hoursSinceTraining: hours, phase, decayPercent: Math.min(1.0, decay) };
}

export const MPS_LABELS = { active: 'Synthesizing', prime: 'Prime Window', closed: 'Window Closed' };

// ═══════════════════════════════════════════════════════
// 3 — CNS Fatigue Index
// Häkkinen (1994) — neuromuscular fatigue from compounds
// ═══════════════════════════════════════════════════════

const CNS_HEAVY_COMPOUNDS = new Set([
  'squat', 'bench_press', 'deadlift', 'ohp', 'front_squat',
  'sumo_deadlift', 'incline_bench', 'rdl', 'hip_thrust',
  'pendlay_row', 'barbell_row'
]);

export async function cnsFatigueIndex() {
  const workouts = await getPastWorkouts(20);
  const exercises = await getExercises();
  const sessionData = [];

  for (const w of workouts) {
    const detail = await getWorkoutDetail(w.id);
    const compoundRPEs = [];
    let compoundVolume = 0;
    for (const wex of detail.exercises) {
      if (!CNS_HEAVY_COMPOUNDS.has(wex.exerciseId)) continue;
      for (const s of wex.sets) {
        if (!s.isDone) continue;
        if (s.rpe > 0) compoundRPEs.push(s.rpe);
        compoundVolume += s.weight * s.reps;
      }
    }
    if (compoundRPEs.length > 0) {
      const avgRPE = compoundRPEs.reduce((a, b) => a + b, 0) / compoundRPEs.length;
      sessionData.push({ date: w.date, avgRPE, totalVolume: compoundVolume });
    }
    if (sessionData.length >= 8) break;
  }

  if (sessionData.length < 2) {
    return { fatigueIndex: 0, label: 'Insufficient data', trend: '—',
      recommendation: 'Log RPE on compound lifts to enable CNS tracking', dataPoints: [] };
  }

  const ratios = sessionData.map(d => d.totalVolume > 0 ? d.avgRPE / (d.totalVolume / 1000) : 0);
  const recentSlice = ratios.slice(0, 2);
  const olderSlice = ratios.slice(2);
  const recent = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length;
  const older = olderSlice.length > 0 ? olderSlice.reduce((a, b) => a + b, 0) / olderSlice.length : recent;
  const drift = older > 0 ? ((recent - older) / older) * 100 : 0;
  const fatigueIndex = Math.max(0, Math.min(100, 50 + drift * 2));

  let label, rec, trend;
  if (fatigueIndex < 30) { label = 'CNS Fresh'; rec = 'Nervous system recovered — push compound intensity'; trend = '↓'; }
  else if (fatigueIndex < 60) { label = 'CNS Moderate'; rec = 'Normal CNS load — maintain compound volume'; trend = '→'; }
  else if (fatigueIndex < 80) { label = 'CNS Elevated'; rec = 'Consider swapping 1 compound for isolation variant'; trend = '↑'; }
  else { label = 'CNS Fatigued'; rec = 'Reduce compound volume 30% or take a deload'; trend = '⚠️'; }

  return { fatigueIndex, label, trend, recommendation: rec, dataPoints: ratios.slice(0, 6).reverse() };
}

// ═══════════════════════════════════════════════════════
// 4 — Volume Landmarks (MEV / MAV / MRV)
// Israetel, Hoffmann, Smith (2021)
// ═══════════════════════════════════════════════════════

const LANDMARKS = {
  chest:       { mev: 8,  mavLow: 12, mavHigh: 20, mrv: 22 },
  back:        { mev: 8,  mavLow: 12, mavHigh: 20, mrv: 25 },
  lats:        { mev: 8,  mavLow: 12, mavHigh: 20, mrv: 25 },
  quads:       { mev: 6,  mavLow: 12, mavHigh: 18, mrv: 20 },
  hamstrings:  { mev: 4,  mavLow: 8,  mavHigh: 16, mrv: 18 },
  glutes:      { mev: 4,  mavLow: 8,  mavHigh: 16, mrv: 20 },
  front_delts: { mev: 4,  mavLow: 8,  mavHigh: 14, mrv: 16 },
  side_delts:  { mev: 8,  mavLow: 14, mavHigh: 22, mrv: 26 },
  rear_delts:  { mev: 6,  mavLow: 10, mavHigh: 18, mrv: 22 },
  biceps:      { mev: 6,  mavLow: 10, mavHigh: 18, mrv: 22 },
  triceps:     { mev: 4,  mavLow: 8,  mavHigh: 14, mrv: 18 },
  traps:       { mev: 4,  mavLow: 8,  mavHigh: 16, mrv: 20 },
  core:        { mev: 4,  mavLow: 6,  mavHigh: 14, mrv: 16 },
  calves:      { mev: 6,  mavLow: 10, mavHigh: 16, mrv: 20 },
  upper_chest: { mev: 6,  mavLow: 10, mavHigh: 18, mrv: 20 },
};

export async function volumeLandmarks() {
  const exercises = await getExercises();
  const workouts = await getPastWorkouts(50);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart);
  const weeklySets = {};

  for (const w of weekWorkouts) {
    const detail = await getWorkoutDetail(w.id);
    for (const wex of detail.exercises) {
      const seed = exercises.find(e => e.id === wex.exerciseId);
      const done = wex.sets.filter(s => s.isDone).length;
      if (seed) {
        for (const m of (seed.primaryMuscles || [])) weeklySets[m] = (weeklySets[m] || 0) + done;
        for (const m of (seed.secondaryMuscles || [])) weeklySets[m] = (weeklySets[m] || 0) + Math.max(1, Math.floor(done / 2));
      }
    }
  }

  return Object.entries(LANDMARKS).map(([muscle, lm]) => {
    const sets = weeklySets[muscle] || 0;
    let zone;
    if (sets < lm.mev) zone = 'belowMEV';
    else if (sets < lm.mavLow) zone = 'maintenance';
    else if (sets <= lm.mavHigh) zone = 'hypertrophy';
    else if (sets < lm.mrv) zone = 'overreaching';
    else zone = 'exceededMRV';

    return { muscle, weeklySets: sets, mev: lm.mev, mav: Math.floor((lm.mavLow + lm.mavHigh) / 2), mrv: lm.mrv, zone };
  }).filter(v => v.weeklySets > 0).sort((a, b) => b.weeklySets - a.weeklySets);
}

// ═══════════════════════════════════════════════════════
// 5 — DOTS Score (Relative Strength)
// IPF official coefficients (Nuckols 2019)
// ═══════════════════════════════════════════════════════

const MALE_COEFFS = { a: -307.75076, b: 24.990210, c: -0.1466250, d: 0.0007418348, e: -0.000001328915 };

export function dotsScore(bodyweightKg, squatKg, benchKg, deadliftKg) {
  if (bodyweightKg <= 0) return { score: 0, classification: 'untrained', total: 0, bodyweight: 0 };
  const total = squatKg + benchKg + deadliftKg;
  if (total <= 0) return { score: 0, classification: 'untrained', total: 0, bodyweight: bodyweightKg };

  const bw = bodyweightKg;
  const c = MALE_COEFFS;
  const denom = c.a + c.b * bw + c.c * Math.pow(bw, 2) + c.d * Math.pow(bw, 3) + c.e * Math.pow(bw, 4);
  const dots = denom !== 0 ? total * (500 / denom) : 0;

  let classification;
  if (dots < 150) classification = 'untrained';
  else if (dots < 250) classification = 'novice';
  else if (dots < 350) classification = 'intermediate';
  else if (dots < 450) classification = 'advanced';
  else classification = 'elite';

  return { score: Math.max(0, dots), classification, total, bodyweight: bodyweightKg };
}

export function lbToKg(lb) { return lb * 0.453592; }

// ═══════════════════════════════════════════════════════
// PR Extraction Helper
// ═══════════════════════════════════════════════════════

export async function personalRecord(exerciseId) {
  const workouts = await getPastWorkouts(100);
  let best = null;
  for (const w of workouts) {
    const detail = await getWorkoutDetail(w.id);
    for (const wex of detail.exercises) {
      if (wex.exerciseId !== exerciseId) continue;
      for (const s of wex.sets) {
        if (s.isDone && s.weight > 0 && (!best || s.weight > best.weight)) {
          best = { weight: s.weight, reps: s.reps };
        }
      }
    }
  }
  return best;
}

// Helper: get days since a muscle was last trained
export async function daysSinceLastTrained(muscleId) {
  const workouts = await getPastWorkouts(50);
  const exercises = await getExercises();
  const now = new Date();
  for (const w of workouts) {
    const detail = await getWorkoutDetail(w.id);
    for (const wex of detail.exercises) {
      const seed = exercises.find(e => e.id === wex.exerciseId);
      const muscles = [...(seed?.primaryMuscles || []), ...(seed?.secondaryMuscles || [])];
      if (muscles.includes(muscleId) && wex.sets.some(s => s.isDone)) {
        return Math.max(0, Math.floor((now - new Date(w.date)) / 86400000));
      }
    }
  }
  return 99;
}

export async function lastTrainedDate(muscleId) {
  const workouts = await getPastWorkouts(50);
  const exercises = await getExercises();
  for (const w of workouts) {
    const detail = await getWorkoutDetail(w.id);
    for (const wex of detail.exercises) {
      const seed = exercises.find(e => e.id === wex.exerciseId);
      const muscles = [...(seed?.primaryMuscles || []), ...(seed?.secondaryMuscles || [])];
      if (muscles.includes(muscleId) && wex.sets.some(s => s.isDone)) {
        return w.date;
      }
    }
  }
  return null;
}
