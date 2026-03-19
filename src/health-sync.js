// Health Sync — Fetches Apple Health data via MCP Health API
// Caches in IndexedDB for offline use at the gym.
// Readiness formula from HealthKitManager.swift.

import { db } from './db.js';

// ── Config ──
const HEALTH_API = localStorage.getItem('barpath_health_api') || 'http://localhost:9876';

// ── IndexedDB health store ──
// Added in db.js version 2: healthRecords table

// ── Readiness Calculation ──
// 0.40 × sleep + 0.25 × HR + 0.25 × HRV + 0.10 × activity

export function computeReadiness(data) {
  // If no health data synced at all, readiness = 0
  const hasData = data.sleepHours > 0 || data.restingHR > 0 || data.hrv > 0 || data.steps > 0;
  if (!hasData) return 0;

  const sleepScore = Math.min(100, (data.sleepHours / 8.0) * 100);
  const hrScore = data.restingHR > 0
    ? Math.max(0, Math.min(100, ((80 - data.restingHR) / 30) * 100))
    : 0;
  const hrvScore = data.hrv > 0
    ? Math.max(0, Math.min(100, ((data.hrv - 20) / 60) * 100))
    : 0;
  const activityScore = Math.min(100, (data.steps / 8000) * 100);

  return Math.round(0.40 * sleepScore + 0.25 * hrScore + 0.25 * hrvScore + 0.10 * activityScore);
}

export function readinessLabel(score) {
  if (score >= 80) return 'Ready for intensity';
  if (score >= 60) return 'Normal training day';
  if (score >= 40) return 'Consider lighter volume';
  return 'Recovery day recommended';
}

export function readinessColor(score) {
  if (score >= 80) return 'var(--bp-green)';
  if (score >= 60) return 'var(--bp-amber)';
  return 'var(--bp-red)';
}

// ── Component scores (for breakdown bars) ──

export function sleepScoreComponent(hours) { return Math.min(100, (hours / 8.0) * 100); }
export function hrScoreComponent(rhr) {
  if (rhr <= 0) return 50;
  return Math.max(0, Math.min(100, ((80 - rhr) / 30) * 100));
}
export function hrvScoreComponent(hrv) {
  if (hrv <= 0) return 50;
  return Math.max(0, Math.min(100, ((hrv - 20) / 60) * 100));
}
export function activityScoreComponent(steps) { return Math.min(100, (steps / 8000) * 100); }

// ── HRV Baseline & Trend ──

export function hrvBaseline(hrvHistory) {
  if (!hrvHistory || hrvHistory.length === 0) return 0;
  return hrvHistory.reduce((s, h) => s + h.value, 0) / hrvHistory.length;
}

export function hrvTrend(currentHrv, baseline) {
  if (currentHrv <= 0 || baseline <= 0) return '—';
  const diff = currentHrv - baseline;
  if (Math.abs(diff) < 3) return 'Stable';
  return diff > 0 ? '↑ Above baseline' : '↓ Below baseline';
}

// ── Fetch from MCP Health API ──

export async function syncHealthData() {
  try {
    const [hrvRes, rhrRes, sleepRes, stepsRes, massRes] = await Promise.allSettled([
      fetchHealthMetric('HeartRateVariabilitySDNN', 7),
      fetchHealthMetric('RestingHeartRate', 7),
      fetchSleep(14),
      fetchHealthMetric('StepCount', 1),
      fetchHealthMetric('BodyMass', 30),
    ]);

    const healthData = {
      hrv: extractLatest(hrvRes),
      hrvHistory: extractHistory(hrvRes),
      restingHR: extractLatest(rhrRes),
      rhrHistory: extractHistory(rhrRes),
      sleepHours: extractSleep(sleepRes),
      sleepDeep: extractSleepStage(sleepRes, 'deep'),
      sleepREM: extractSleepStage(sleepRes, 'rem'),
      sleepCore: extractSleepStage(sleepRes, 'core'),
      sleepAwake: extractSleepStage(sleepRes, 'awake'),
      steps: extractLatest(stepsRes),
      bodyMassKg: extractLatest(massRes),
      lastSync: new Date().toISOString(),
    };

    // Cache to IndexedDB
    await db.healthRecords.put({ id: 'latest', ...healthData });
    return healthData;
  } catch (err) {
    console.warn('[HealthSync] API unreachable, using cached data:', err.message);
    return getCachedHealth();
  }
}

async function fetchHealthMetric(type, days) {
  const res = await fetch(`${HEALTH_API}/health/daily_stats?record_type=${type}&days=${days}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchSleep(days) {
  const res = await fetch(`${HEALTH_API}/health/sleep?days=${days}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function extractLatest(result) {
  if (result.status !== 'fulfilled' || !result.value?.data) return 0;
  const data = result.value.data;
  if (data.length === 0) return 0;
  const last = data[data.length - 1];
  return last.avg ?? last.sum ?? last.value ?? 0;
}

function extractHistory(result) {
  if (result.status !== 'fulfilled' || !result.value?.data) return [];
  return result.value.data.map(d => ({ date: d.date, value: d.avg ?? d.value ?? 0 }));
}

function extractSleep(result) {
  if (result.status !== 'fulfilled' || !result.value?.data) return 0;
  const data = result.value.data;
  if (data.length === 0) return 0;
  return data[data.length - 1]?.total_sleep_hours ?? 0;
}

function extractSleepStage(result, stage) {
  if (result.status !== 'fulfilled' || !result.value?.data) return 0;
  const data = result.value.data;
  if (data.length === 0) return 0;
  const last = data[data.length - 1];
  return last?.[`${stage}_hours`] ?? 0;
}

// ── Cached + Manual Fallback ──

export async function getCachedHealth() {
  const cached = await db.healthRecords.get('latest');
  if (cached) return cached;
  // Default empty state
  return {
    hrv: 0, hrvHistory: [], restingHR: 0, rhrHistory: [],
    sleepHours: 0, sleepDeep: 0, sleepREM: 0, sleepCore: 0, sleepAwake: 0,
    steps: 0, bodyMassKg: 0, lastSync: null,
  };
}

export async function saveManualHealth(data) {
  const existing = await getCachedHealth();
  const merged = { ...existing, ...data, lastSync: new Date().toISOString(), id: 'latest' };
  await db.healthRecords.put(merged);
  return merged;
}

// ── Get full readiness data ──

export async function getReadinessData() {
  const health = await getCachedHealth();
  const score = computeReadiness(health);
  return { ...health, readinessScore: score };
}
