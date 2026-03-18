// Muscle Heatmap — ported from MuscleHeatmapView.swift
// Shows MPS decay per muscle group with front/back toggle.

import { mpsWindow, MPS_LABELS, daysSinceLastTrained, lastTrainedDate } from '../engines/neuroscience-engine.js';

const FRONT_MUSCLES = [
  { id: 'chest', label: 'Chest', icon: '🫁' },
  { id: 'front_delts', label: 'Front Delt', icon: '🔵' },
  { id: 'side_delts', label: 'Side Delt', icon: '🟡' },
  { id: 'biceps', label: 'Biceps', icon: '💪' },
  { id: 'quads', label: 'Quads', icon: '🦵' },
  { id: 'core', label: 'Core', icon: '🎯' },
];

const BACK_MUSCLES = [
  { id: 'back', label: 'Back', icon: '🔙' },
  { id: 'lats', label: 'Lats', icon: '🦅' },
  { id: 'rear_delts', label: 'Rear Delt', icon: '🟠' },
  { id: 'triceps', label: 'Triceps', icon: '🔴' },
  { id: 'hamstrings', label: 'Hamstrings', icon: '🦿' },
  { id: 'glutes', label: 'Glutes', icon: '🍑' },
  { id: 'calves', label: 'Calves', icon: '🦶' },
  { id: 'traps', label: 'Traps', icon: '⬆️' },
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

      cells.push(`
        <div class="heatmap-cell" style="background: ${bg}">
          <span class="heatmap-icon">${muscle.icon}</span>
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
