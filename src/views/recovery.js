// Recovery View — ported from RecoveryView.swift
// Readiness breakdown, ANS balance, HRV sparkline, CNS fatigue, sleep stages, resting HR.

import { getReadinessData, syncHealthData, computeReadiness, readinessLabel, readinessColor,
  sleepScoreComponent, hrScoreComponent, hrvScoreComponent, activityScoreComponent,
  hrvBaseline, hrvTrend } from '../health-sync.js';
import { ansBalance } from '../engines/neuroscience-engine.js';
import { cnsFatigueIndex } from '../engines/neuroscience-engine.js';

function sparklineSVG(data, color, width = 280, height = 50, baseline = null) {
  if (!data || data.length < 2) return '';
  const vals = data.map(d => typeof d === 'number' ? d : d.value);
  const mn = Math.min(...vals) * 0.9;
  const mx = Math.max(...vals) * 1.1;
  const range = mx - mn || 1;

  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - mn) / range) * height;
    return `${x},${y}`;
  });

  let baselineLine = '';
  if (baseline != null && range > 0) {
    const by = height - ((baseline - mn) / range) * height;
    baselineLine = `<line x1="0" y1="${by}" x2="${width}" y2="${by}" stroke="${color}" stroke-opacity="0.2" stroke-dasharray="4,3"/>`;
  }

  const dots = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - mn) / range) * height;
    const isLast = i === vals.length - 1;
    return `<circle cx="${x}" cy="${y}" r="${isLast ? 3 : 2}" fill="${isLast ? color : color}" fill-opacity="${isLast ? 1 : 0.4}"/>`;
  }).join('');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="width: 100%; height: ${height}px">
    ${baselineLine}
    <polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
  </svg>`;
}

function componentBar(label, score, weight, icon) {
  const color = score >= 75 ? 'var(--bp-green)' : score >= 50 ? 'var(--bp-amber)' : 'var(--bp-red)';
  return `
    <div class="component-bar">
      <span class="comp-icon">${icon}</span>
      <span class="comp-label">${label}</span>
      <div class="comp-track">
        <div class="comp-fill" style="width: ${score}%; background: ${color}"></div>
      </div>
      <span class="comp-score">${Math.round(score)}</span>
      <span class="comp-weight">${weight}</span>
    </div>
  `;
}

function ansGaugeHTML(result) {
  const position = Math.min(1, Math.max(0, result.cv / 15)) * 100;
  const color = result.state === 'parasympathetic' ? 'var(--bp-green)' :
    result.state === 'balanced' ? 'var(--bp-amber)' : 'var(--bp-red)';
  return `
    <div class="card">
      <div class="flex justify-between items-center">
        <div>
          <div class="t-card" style="font-size: 15px">ANS Balance</div>
          <div class="t-caption text-muted">Autonomic Nervous System · HRV-CV</div>
        </div>
        <span class="t-data-sm" style="color: ${color}">${result.cv.toFixed(1)}%</span>
      </div>
      <div class="ans-gauge mt-md">
        <div class="ans-track">
          <div class="ans-marker" style="left: ${position}%; background: ${color}; box-shadow: 0 0 6px ${color}"></div>
        </div>
        <div class="flex justify-between mt-sm" style="font-size: 9px">
          <span class="text-green">Parasympathetic</span>
          <span class="text-amber">Balanced</span>
          <span class="text-red">Sympathetic</span>
        </div>
      </div>
      <div class="flex items-center gap-sm mt-md">
        <span class="legend-dot" style="background: ${color}"></span>
        <span style="color: ${color}; font-size: 12px; font-weight: 500">${result.label}</span>
      </div>
      <p class="t-caption text-muted mt-sm">${result.recommendation}</p>
      ${result.mean > 0 ? `
        <div class="flex gap-lg mt-md">
          <div class="text-center"><span class="t-data-sm">${result.mean.toFixed(0)}</span><br><span style="font-size: 8px; color: var(--bp-subtle); font-weight: 700">MEAN</span></div>
          <div class="text-center"><span class="t-data-sm">${result.sd.toFixed(1)}</span><br><span style="font-size: 8px; color: var(--bp-subtle); font-weight: 700">SD</span></div>
        </div>
      ` : ''}
    </div>
  `;
}

function cnsFatigueHTML(result) {
  const color = result.fatigueIndex < 30 ? 'var(--bp-green)' :
    result.fatigueIndex < 60 ? 'var(--bp-amber)' :
    result.fatigueIndex < 80 ? 'var(--bp-accent)' : 'var(--bp-red)';
  const pct = result.fatigueIndex;
  return `
    <div class="card">
      <div class="flex justify-between items-center">
        <div>
          <div class="t-card" style="font-size: 15px">CNS Load</div>
          <div class="t-caption text-muted">Neuromuscular fatigue · compounds</div>
        </div>
        <div class="text-right">
          <span class="t-data-sm" style="color: ${color}">${pct.toFixed(0)}</span>
          <div style="font-size: 14px">${result.trend}</div>
        </div>
      </div>
      <div class="cns-gauge mt-md">
        <div class="cns-track">
          <div class="cns-fill" style="width: ${pct}%"></div>
        </div>
        <div class="flex justify-between mt-sm" style="font-size: 9px">
          <span class="text-green">Fresh</span>
          <span class="text-amber">Moderate</span>
          <span class="text-red">Fatigued</span>
        </div>
      </div>
      <div class="flex items-center gap-sm mt-md">
        <span class="legend-dot" style="background: ${color}"></span>
        <span style="color: ${color}; font-size: 12px; font-weight: 500">${result.label}</span>
      </div>
      <p class="t-caption text-muted mt-sm">${result.recommendation}</p>
      ${result.dataPoints.length > 0 ? `
        <div class="mt-md">
          <span style="font-size: 9px; font-weight: 700; color: var(--bp-subtle); letter-spacing: 1px">RPE:VOLUME TREND</span>
          ${sparklineSVG(result.dataPoints, color, 280, 30)}
        </div>
      ` : ''}
    </div>
  `;
}

function sleepStagesHTML(data) {
  const total = (data.sleepDeep || 0) + (data.sleepREM || 0) + (data.sleepCore || 0) + (data.sleepAwake || 0);
  if (total <= 0) {
    return `<div class="card">
      <div class="flex justify-between"><span class="t-card" style="font-size: 15px">Sleep</span>
      <span class="t-data-sm">${(data.sleepHours || 0).toFixed(1)} hr</span></div>
      <p class="t-caption text-muted mt-md">No sleep stage data from last night</p>
    </div>`;
  }
  const deepPct = (data.sleepDeep / total) * 100;
  const remPct = (data.sleepREM / total) * 100;
  const corePct = (data.sleepCore / total) * 100;
  const awakePct = (data.sleepAwake / total) * 100;
  return `
    <div class="card">
      <div class="flex justify-between">
        <span class="t-card" style="font-size: 15px">Sleep</span>
        <span class="t-data-sm">${(data.sleepHours || 0).toFixed(1)} hr</span>
      </div>
      <div class="sleep-bar mt-md">
        <div class="sleep-seg sleep-deep" style="width: ${deepPct}%"></div>
        <div class="sleep-seg sleep-rem" style="width: ${remPct}%"></div>
        <div class="sleep-seg sleep-core" style="width: ${corePct}%"></div>
        <div class="sleep-seg sleep-awake" style="width: ${awakePct}%"></div>
      </div>
      <div class="flex gap-lg mt-md" style="flex-wrap: wrap">
        <span class="sleep-legend"><span class="legend-dot sleep-deep-dot"></span> Deep ${data.sleepDeep.toFixed(1)}h</span>
        <span class="sleep-legend"><span class="legend-dot sleep-rem-dot"></span> REM ${data.sleepREM.toFixed(1)}h</span>
        <span class="sleep-legend"><span class="legend-dot sleep-core-dot"></span> Core ${data.sleepCore.toFixed(1)}h</span>
        <span class="sleep-legend"><span class="legend-dot sleep-awake-dot"></span> Awake ${data.sleepAwake.toFixed(1)}h</span>
      </div>
    </div>
  `;
}

export async function renderRecoveryView(container) {
  container.innerHTML = '<div class="text-center text-muted mt-xxl">Loading recovery data...</div>';

  const healthData = await getReadinessData();
  const score = healthData.readinessScore;
  const cns = await cnsFatigueIndex();
  const ans = ansBalance(healthData.hrvHistory);
  const baseline = hrvBaseline(healthData.hrvHistory);
  const trend = hrvTrend(healthData.hrv, baseline);
  const rColor = readinessColor(score);

  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - score / 100);

  container.innerHTML = `
    <h1 class="t-section mb-md">Recovery</h1>
    <div class="flex-col gap-xxl">

      <!-- Readiness Breakdown -->
      <div class="card">
        <div class="readiness-ring" style="width: 100px; height: 100px; margin: 0 auto">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bp-border-strong)" stroke-width="6"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="${rColor}" stroke-width="6"
              stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
              style="transform: rotate(-90deg); transform-origin: center; transition: stroke-dashoffset 1s"/>
          </svg>
          <div class="readiness-value">
            <span class="t-hero" style="font-size: 36px">${score}</span>
            <span style="font-size: 9px; font-weight: 700; color: var(--bp-muted)">READY</span>
          </div>
        </div>
        <p class="text-center mt-md" style="color: ${rColor}; font-size: 13px">${readinessLabel(score)}</p>
        <div class="component-bars mt-lg">
          ${componentBar('Sleep', sleepScoreComponent(healthData.sleepHours), '40%', '🌙')}
          ${componentBar('Heart Rate', hrScoreComponent(healthData.restingHR), '25%', '❤️')}
          ${componentBar('HRV', hrvScoreComponent(healthData.hrv), '25%', '📈')}
          ${componentBar('Activity', activityScoreComponent(healthData.steps), '10%', '🚶')}
        </div>
        ${healthData.lastSync ? `<p class="text-center mt-md t-caption text-subtle">Synced: ${new Date(healthData.lastSync).toLocaleString()}</p>` : ''}
        <button class="btn btn-secondary btn-full mt-md" id="sync-health-btn">Sync Apple Health</button>
      </div>

      <!-- ANS Balance -->
      ${ansGaugeHTML(ans)}

      <!-- HRV -->
      <div class="card">
        <div class="flex justify-between items-center">
          <div>
            <div class="t-card" style="font-size: 15px">HRV</div>
            <div class="t-caption text-muted">Heart Rate Variability (SDNN)</div>
          </div>
          <div class="text-right">
            <span class="t-data-sm">${healthData.hrv > 0 ? `${healthData.hrv.toFixed(0)} ms` : '—'}</span>
            <div class="t-caption" style="color: ${healthData.hrv >= baseline ? 'var(--bp-green)' : 'var(--bp-amber)'}">${trend}</div>
          </div>
        </div>
        ${healthData.hrvHistory?.length > 0 ? `
          <div class="mt-md">${sparklineSVG(healthData.hrvHistory, 'var(--bp-accent)', 280, 60, baseline)}</div>
          <div class="flex justify-between mt-sm">
            <span class="t-caption text-muted">7-day avg: ${baseline.toFixed(0)} ms</span>
            <span style="font-size: 9px; color: var(--bp-subtle)"><span class="legend-dot" style="background: var(--bp-accent); opacity: 0.3"></span> baseline</span>
          </div>
        ` : '<p class="t-caption text-muted mt-lg text-center">Sync Apple Health to see HRV trends</p>'}
      </div>

      <!-- CNS Fatigue -->
      ${cnsFatigueHTML(cns)}

      <!-- Sleep Stages -->
      ${sleepStagesHTML(healthData)}

      <!-- Resting HR -->
      <div class="card">
        <div class="flex justify-between items-center">
          <span class="t-card" style="font-size: 15px">Resting HR</span>
          <span class="t-data-sm">${healthData.restingHR > 0 ? `${healthData.restingHR.toFixed(0)} bpm` : '—'}</span>
        </div>
        ${healthData.rhrHistory?.length > 0 ? `
          <div class="mt-md">${sparklineSVG(healthData.rhrHistory, 'var(--bp-red)', 280, 60)}</div>
        ` : ''}
      </div>

    </div>
  `;

  // Sync button
  document.getElementById('sync-health-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('sync-health-btn');
    btn.textContent = 'Syncing...';
    btn.disabled = true;
    try {
      await syncHealthData();
      renderRecoveryView(container);
    } catch (e) {
      btn.textContent = 'Sync failed — try again';
      btn.disabled = false;
    }
  });
}
