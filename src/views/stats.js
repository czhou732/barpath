// Barpath — Stats View
import { getPastWorkouts, getWorkoutExercises, getSets, getExercises } from '../db.js';
import { getUnit } from '../main.js';
import { dotsScore, lbToKg, volumeLandmarks } from '../engines/neuroscience-engine.js';
import { getCachedHealth } from '../health-sync.js';

export async function renderStats(container) {
  const workouts = await getPastWorkouts(100);
  const exercises = await getExercises();
  const unit = getUnit();

  // Extract PRs
  const prs = {};
  for (const w of workouts) {
    const wExs = await getWorkoutExercises(w.id);
    for (const wex of wExs) {
      const sets = await getSets(wex.id);
      for (const s of sets) {
        if (s.isDone && s.weight > 0) {
          if (!prs[wex.exerciseId] || s.weight > prs[wex.exerciseId].weight) {
            prs[wex.exerciseId] = { weight: s.weight, reps: s.reps, date: w.date };
          }
        }
      }
    }
  }

  const prList = Object.entries(prs)
    .map(([exId, data]) => {
      const ex = exercises.find(e => e.id === exId);
      return { id: exId, name: ex?.nameEN || exId, ...data };
    })
    .sort((a, b) => b.weight - a.weight);

  // DOTS Score
  const health = await getCachedHealth();
  const bwKg = health.bodyMassKg || 0;
  const squat = prs['squat']?.weight || 0;
  const bench = prs['bench_press']?.weight || 0;
  const dead = prs['deadlift']?.weight || 0;
  const sKg = unit === 'lb' ? lbToKg(squat) : squat;
  const bKg = unit === 'lb' ? lbToKg(bench) : bench;
  const dKg = unit === 'lb' ? lbToKg(dead) : dead;
  const dots = dotsScore(bwKg, sKg, bKg, dKg);

  // Volume landmarks
  let landmarks = [];
  try { landmarks = await volumeLandmarks(); } catch (e) { /* silent */ }

  // Volume over time (last 20 workouts)
  const volumeData = [];
  for (const w of workouts.slice(0, 20).reverse()) {
    const wExs = await getWorkoutExercises(w.id);
    let vol = 0;
    for (const ex of wExs) {
      const sets = await getSets(ex.id);
      for (const s of sets) { if (s.isDone) vol += s.weight * s.reps; }
    }
    volumeData.push({ date: w.date, label: w.label, volume: vol });
  }

  // Total stats
  const totalWorkouts = workouts.length;
  const totalVolume = volumeData.reduce((a, v) => a + v.volume, 0);
  const avgDuration = workouts.reduce((a, w) => {
    if (w.endTime) return a + (new Date(w.endTime) - new Date(w.startTime)) / 60000;
    return a;
  }, 0) / (totalWorkouts || 1);

  const dotsColor = dots.classification === 'elite' ? 'var(--bp-green)' :
    dots.classification === 'advanced' ? 'var(--bp-green)' :
    dots.classification === 'intermediate' ? 'var(--bp-amber)' : 'var(--bp-muted)';

  function volZoneColor(zone) {
    if (zone === 'hypertrophy') return 'var(--bp-green)';
    if (zone === 'maintenance') return 'var(--bp-amber)';
    if (zone === 'overreaching') return 'var(--bp-amber)';
    if (zone === 'exceededMRV') return 'var(--bp-red)';
    return 'var(--bp-muted)';
  }

  container.innerHTML = `
    <div class="flex-col gap-xxl">
      <h1 class="t-screen" style="margin-top: var(--sp-sm)">Stats</h1>

      <!-- Summary -->
      <div class="stat-row">
        <div class="stat-pill">
          <div class="stat-value">${totalWorkouts}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-pill">
          <div class="stat-value">${totalVolume > 1000 ? (totalVolume/1000).toFixed(0) + 'k' : totalVolume}</div>
          <div class="stat-label">Volume</div>
        </div>
        <div class="stat-pill">
          <div class="stat-value">${Math.round(avgDuration)}</div>
          <div class="stat-label">Avg Min</div>
        </div>
      </div>

      <!-- DOTS Score -->
      <div class="card">
        <div class="flex justify-between items-center">
          <div>
            <div class="t-card" style="font-size: 15px">DOTS Score</div>
            <div class="t-caption text-muted">IPF Relative Strength</div>
          </div>
          <div class="text-right">
            <span class="t-data-md" style="color: ${dotsColor}">${dots.score > 0 ? dots.score.toFixed(0) : '—'}</span>
            <div style="font-size: 10px; text-transform: capitalize; color: ${dotsColor}">${dots.classification}</div>
          </div>
        </div>
        ${dots.score > 0 ? `
          <div class="flex gap-lg mt-md" style="justify-content: center">
            <div class="text-center"><span class="t-data-sm">${squat}</span><br><span style="font-size: 8px; color: var(--bp-subtle)">SQ</span></div>
            <div class="text-center"><span class="t-data-sm">${bench}</span><br><span style="font-size: 8px; color: var(--bp-subtle)">BP</span></div>
            <div class="text-center"><span class="t-data-sm">${dead}</span><br><span style="font-size: 8px; color: var(--bp-subtle)">DL</span></div>
            <div class="text-center"><span class="t-data-sm">${bwKg > 0 ? bwKg.toFixed(0) : '—'}</span><br><span style="font-size: 8px; color: var(--bp-subtle)">BW kg</span></div>
          </div>
        ` : '<p class="t-caption text-muted mt-md">Log SBD + sync bodyweight for DOTS</p>'}
      </div>

      <!-- Volume Landmarks -->
      ${landmarks.length > 0 ? `
        <div class="card">
          <div class="t-label mb-md">WEEKLY VOLUME vs LANDMARKS</div>
          ${landmarks.map(v => {
            const maxVal = v.mrv * 1.2;
            const fillPct = Math.min(100, (v.weeklySets / maxVal) * 100);
            const mevPct = (v.mev / maxVal) * 100;
            const mavPct = (v.mav / maxVal) * 100;
            const mrvPct = (v.mrv / maxVal) * 100;
            const fillColor = volZoneColor(v.zone);
            return `
              <div class="vol-landmark">
                <span class="vol-muscle">${v.muscle.replace(/_/g, ' ')}</span>
                <div class="vol-bar-track">
                  <div class="vol-bar-fill" style="width: ${fillPct}%; background: ${fillColor}"></div>
                  <div class="vol-marker" style="left: ${mevPct}%" title="MEV"></div>
                  <div class="vol-marker" style="left: ${mavPct}%" title="MAV"></div>
                  <div class="vol-marker" style="left: ${mrvPct}%" title="MRV"></div>
                </div>
                <span class="vol-sets">${v.weeklySets}</span>
                <span class="vol-zone" style="color: ${fillColor}">${v.zone.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            `;
          }).join('')}
          <div class="flex gap-lg mt-md" style="font-size: 8px; color: var(--bp-subtle)">
            <span>| = MEV / MAV / MRV markers</span>
          </div>
        </div>
      ` : ''}

      <!-- Volume Chart -->
      ${volumeData.length > 1 ? `
        <div class="card">
          <div class="t-label mb-md">VOLUME TREND</div>
          <div style="height: 180px; position: relative;" id="volume-chart-container">
            <canvas id="volume-chart"></canvas>
          </div>
        </div>
      ` : ''}

      <!-- PRs -->
      ${prList.length > 0 ? `
        <div>
          <div class="t-label mb-md">PERSONAL RECORDS</div>
          ${prList.slice(0, 15).map(pr => {
            const d = new Date(pr.date);
            return `
              <div class="card" style="margin-bottom: var(--sp-sm);">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="t-card">${pr.name}</div>
                    <div class="t-caption text-muted">${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                  <div class="text-right">
                    <span class="t-data-md">${pr.weight}</span>
                    <span class="t-caption text-muted"> ${unit} × ${pr.reps}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="text-center mt-xl">
          <p class="t-body text-muted">Log some workouts to see your PRs here!</p>
        </div>
      `}
    </div>
  `;

  // Render chart
  if (volumeData.length > 1) {
    try {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const ctx = document.getElementById('volume-chart');
      if (ctx) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: volumeData.map(d => {
              const dt = new Date(d.date);
              return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
              data: volumeData.map(d => d.volume),
              borderColor: '#1A1A1A',
              backgroundColor: 'rgba(26, 26, 26, 0.08)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: '#1A1A1A',
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                grid: { display: false },
                ticks: { font: { size: 10, family: 'Inter' }, color: '#949494' }
              },
              y: {
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: {
                  font: { size: 10, family: 'JetBrains Mono' },
                  color: '#949494',
                  callback: v => v > 1000 ? (v/1000).toFixed(0) + 'k' : v
                }
              }
            }
          }
        });
      }
    } catch (e) { console.warn('Chart.js not loaded', e); }
  }
}
