// Barpath — Main App + Router
import './design-system.css';
import { seedDatabase } from './seed-data.js';
import { getActiveWorkout } from './db.js';
import { renderDashboard } from './views/dashboard.js';
import { renderWorkout } from './views/workout.js';
import { renderHistory } from './views/history.js';
import { renderStats } from './views/stats.js';

let currentView = 'dashboard';
let unit = localStorage.getItem('bp-unit') || 'lb';

export function getUnit() { return unit; }
export function setUnit(u) { unit = u; localStorage.setItem('bp-unit', u); }

// ── Router ──
async function navigate(view) {
  currentView = view;
  const container = document.getElementById('view-container');

  // Update nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Check for active workout
  const activeWorkout = await getActiveWorkout();

  switch (view) {
    case 'dashboard':
      await renderDashboard(container, activeWorkout);
      break;
    case 'workout':
      await renderWorkout(container, activeWorkout);
      break;
    case 'history':
      await renderHistory(container);
      break;
    case 'stats':
      await renderStats(container);
      break;
  }
}

// ── Init ──
async function init() {
  await seedDatabase();

  // Nav handlers
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  // Check if there's an active workout
  const active = await getActiveWorkout();
  if (active) {
    navigate('workout');
  } else {
    navigate('dashboard');
  }
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

init();
