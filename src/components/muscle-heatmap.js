// Muscle Heatmap — ported from MuscleHeatmapView.swift
// Shows MPS decay per muscle group with front/back toggle.
// Uses inline SVG icons instead of emojis.

import { mpsWindow, MPS_LABELS, lastTrainedDate } from '../engines/neuroscience-engine.js';

// ── SVG Icons (minimal, elegant, monoline) ──

const ICONS = {
  chest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 13c0-3 2-6 4-7s4 0 4 0 2-1 4 0 4 4 4 7-1 4-4 5-4 0-4 0-1 1-4 0-4-2-4-5z"/></svg>`,
  front_delts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="9" r="5"/><path d="M7 14l-2 6m12-6l2 6"/></svg>`,
  side_delts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="10" r="4"/><path d="M5 10h-2m18 0h-2"/><path d="M8 14v5m8-5v5"/></svg>`,
  biceps: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M7 18v-4c0-3 2-5 5-6m5 10v-4c0-2-1-4-3-5"/><circle cx="14" cy="7" r="3"/></svg>`,
  quads: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 4v6c0 3 0 6 1 8l1 3m6-17v6c0 3 0 6-1 8l-1 3"/><path d="M8 10h8"/></svg>`,
  core: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="7" y="4" width="10" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 3v18m-5-14c1 2 3 3 5 3s4-1 5-3m-10 8c1-2 3-3 5-3s4 1 5 3"/></svg>`,
  lats: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 4v16M8 6c-2 2-3 6-3 10m11-14c2 2 3 6 3 10"/><path d="M5 16h14"/></svg>`,
  rear_delts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="10" r="4"/><path d="M6 8l-3-2m18 2l-3-2"/><path d="M8 14v5m8-5v5"/></svg>`,
  triceps: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M10 4v8l-3 6m7-14v8l3 6"/><path d="M10 8h4"/></svg>`,
  hamstrings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 4v8c0 2 1 5 2 8m6-16v8c0 2-1 5-2 8"/><path d="M8 12h8"/></svg>`,
  glutes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><ellipse cx="9" cy="12" rx="4" ry="5"/><ellipse cx="15" cy="12" rx="4" ry="5"/><path d="M12 7v10"/></svg>`,
  calves: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 4c0 4-2 6-2 10s1 4 2 6m6-16c0 4 2 6 2 10s-1 4-2 6"/></svg>`,
  traps: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 14l4-8h8l4 8"/><path d="M12 6v12"/><circle cx="12" cy="4" r="2"/></svg>`,
};

const FRONT_MUSCLES = [
  { id: 'chest', label: 'Chest' },
  { id: 'front_delts', label: 'Front Delt' },
  { id: 'side_delts', label: 'Side Delt' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'quads', label: 'Quads' },
  { id: 'core', label: 'Core' },
];

const BACK_MUSCLES = [
  { id: 'back', label: 'Upper Back' },
  { id: 'lats', label: 'Lats' },
  { id: 'rear_delts', label: 'Rear Delt' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'calves', label: 'Calves' },
  { id: 'traps', label: 'Traps' },
];

function mpsColor(phase) {
  if (phase === 'active') return 'var(--bp-amber)';
  if (phase === 'prime') return 'var(--bp-green)';
  return 'var(--bp-red)';
}

function mpsBg(phase) {
  if (phase === 'active') return 'var(--bp-amber-bg)';
  if (phase === 'prime') return 'var(--bp-green-bg)';
  return 'var(--bp-red-bg)';
}

export async function renderMuscleHeatmap(container) {
  let showBack = false;

  async function render() {
    const muscles = showBack ? BACK_MUSCLES : FRONT_MUSCLES;
    const cells = [];

    for (const muscle of muscles) {
      const trainedDate = await lastTrainedDate(muscle.id);
      const mps = trainedDate
        ? mpsWindow(muscle.id, trainedDate)
        : { muscle: muscle.id, hoursSinceTraining: 9999, phase: 'closed', decayPercent: 1.0 };

      const color = mpsColor(mps.phase);
      const bg = mpsBg(mps.phase);
      const barWidth = Math.round((1 - mps.decayPercent) * 100);
      const hoursText = mps.hoursSinceTraining < 9999 ? `${mps.hoursSinceTraining}h` : '—';
      const icon = ICONS[muscle.id] || ICONS.core;

      cells.push(`
        <div class="heatmap-cell" style="background: ${bg}">
          <div class="heatmap-icon" style="color: ${color}">${icon}</div>
          <span class="heatmap-label">${muscle.label}</span>
          <span class="heatmap-phase" style="color: ${color}">${MPS_LABELS[mps.phase]}</span>
          <div class="heatmap-bar-bg">
            <div class="heatmap-bar-fill" style="width: ${barWidth}%; background: ${color}"></div>
          </div>
          <span class="heatmap-hours">${hoursText}</span>
        </div>
      `);
    }

    container.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-md">
          <span class="t-label">MPS WINDOWS</span>
          <button class="btn-ghost heatmap-toggle" style="font-size: 12px; color: var(--bp-accent)">${showBack ? '← Front' : 'Back →'}</button>
        </div>
        <div class="heatmap-grid">${cells.join('')}</div>
        <div class="heatmap-legend mt-md">
          <span><span class="legend-dot" style="background: var(--bp-amber)"></span> Synthesizing</span>
          <span><span class="legend-dot" style="background: var(--bp-green)"></span> Prime window</span>
          <span><span class="legend-dot" style="background: var(--bp-red)"></span> Window closed</span>
        </div>
      </div>
    `;

    container.querySelector('.heatmap-toggle').addEventListener('click', () => {
      showBack = !showBack;
      render();
    });
  }

  await render();
}
