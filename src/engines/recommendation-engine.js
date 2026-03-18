// RecommendationEngine — ported from RecommendationEngine.swift
// Scores and ranks workout templates by muscle freshness, readiness, volume debt.

import { db, getExercises, getPastWorkouts, getWorkoutDetail, getAllTemplates } from '../db.js';

// ── Score all templates → sorted recommendations ──

export async function recommend(readinessScore) {
  const templates = await getAllTemplates();
  const exercises = await getExercises();
  const workouts = await getPastWorkouts(50);
  const results = [];

  for (const tpl of templates) {
    const freshnessScore = await muscleFreshnessScore(tpl, exercises, workouts);
    const readiness = readinessScore;
    const volScore = await volumeDebtScore(tpl, exercises, workouts);

    // Weighted: 45% freshness + 30% readiness + 25% volume debt
    const total = 0.45 * freshnessScore + 0.30 * readiness + 0.25 * volScore;

    const reasoning = await buildReasoning(freshnessScore, readiness, volScore, tpl, exercises, workouts);

    let badge;
    if (readiness < 45) badge = 'rest';
    else if (total >= 70) badge = 'optimal';
    else if (total >= 45) badge = 'good';
    else badge = 'skip';

    results.push({ template: tpl, score: total, reasoning, badge });
  }

  return results.sort((a, b) => b.score - a.score);
}

// ── Freshness (0–100) ──

async function muscleFreshnessScore(template, exercises, workouts) {
  const muscles = templatePrimaryMuscles(template, exercises);
  if (muscles.length === 0) return 50;
  let total = 0;
  for (const muscle of muscles) {
    const days = await daysSinceTrained(muscle, workouts, exercises);
    const f = days === 0 ? 10 : days === 1 ? 35 : days === 2 ? 75 :
      days === 3 ? 95 : days === 4 ? 90 : days === 5 ? 70 : days === 6 ? 55 : 40;
    total += f;
  }
  return total / muscles.length;
}

// ── Volume Debt (0–100) ──

async function volumeDebtScore(template, exercises, workouts) {
  const muscles = templatePrimaryMuscles(template, exercises);
  if (muscles.length === 0) return 50;
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
      for (const m of (seed?.primaryMuscles || [])) weeklySets[m] = (weeklySets[m] || 0) + done;
    }
  }

  const target = 10;
  let debtScore = 0;
  for (const muscle of muscles) {
    const current = weeklySets[muscle] || 0;
    const deficit = Math.max(0, target - current);
    debtScore += (deficit / target) * 100;
  }
  return Math.min(100, debtScore / muscles.length);
}

// ── Reasoning ──

async function buildReasoning(freshness, readiness, volScore, template, exercises, workouts) {
  const parts = [];
  const muscles = templatePrimaryMuscles(template, exercises);

  if (muscles.length > 0) {
    let stalest = muscles[0], stalestDays = 0;
    for (const m of muscles) {
      const d = await daysSinceTrained(m, workouts, exercises);
      if (d > stalestDays) { stalest = m; stalestDays = d; }
    }
    const name = stalest.replace(/_/g, ' ');
    if (stalestDays === 0) parts.push(`${name} trained today`);
    else if (stalestDays <= 2) parts.push(`${name} ${stalestDays}d ago`);
    else if (stalestDays <= 5) parts.push(`${name} fresh (${stalestDays}d)`);
    else parts.push(`${name} ${stalestDays}d — overdue`);
  }

  if (readiness >= 80) parts.push('ready for intensity');
  else if (readiness >= 60) parts.push('moderate recovery');
  else if (readiness >= 45) parts.push('consider lighter');
  else parts.push('recovery day');

  return parts.join(' · ');
}

// ── Adaptive Volume ──

export function adaptedSets(baseSets, readinessScore) {
  if (readinessScore >= 85) return baseSets + 1;
  if (readinessScore >= 65) return baseSets;
  if (readinessScore >= 45) return Math.max(1, baseSets - 1);
  return Math.max(1, baseSets - 2);
}

export function adaptationLabel(readinessScore) {
  if (readinessScore >= 85) return '💪 Peak — bonus set added';
  if (readinessScore >= 65) return 'Normal volume';
  if (readinessScore >= 45) return '⚡ Adapted — reduced volume';
  return '🛌 Deload — recovery mode';
}

// ── Helpers ──

function templatePrimaryMuscles(template, exercises) {
  const eids = (template.exerciseEntries || []).map(e => e.exerciseId);
  const muscles = new Set();
  for (const eid of eids) {
    const seed = exercises.find(e => e.id === eid);
    if (seed) for (const m of seed.primaryMuscles || []) muscles.add(m);
  }
  return [...muscles];
}

async function daysSinceTrained(muscle, workouts, exercises) {
  const now = new Date();
  for (const w of workouts) {
    const detail = await getWorkoutDetail(w.id);
    for (const wex of detail.exercises) {
      const seed = exercises.find(e => e.id === wex.exerciseId);
      if ((seed?.primaryMuscles || []).includes(muscle) && wex.sets.some(s => s.isDone)) {
        return Math.max(0, Math.floor((now - new Date(w.date)) / 86400000));
      }
    }
  }
  return 99;
}

// Badge styling
export const BADGE_STYLES = {
  optimal: { color: 'var(--bp-green)', bg: 'var(--bp-green-bg)', label: 'Optimal' },
  good:    { color: 'var(--bp-amber)', bg: 'var(--bp-amber-bg)', label: 'Good' },
  rest:    { color: 'var(--bp-amber)', bg: 'var(--bp-amber-bg)', label: 'Rest' },
  skip:    { color: 'var(--bp-subtle)', bg: 'var(--bp-surface-alt)', label: 'Skip' },
};
