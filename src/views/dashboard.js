// Barpath — Dashboard View
import { db, getPastWorkouts, getSessionVolume, getAllTemplates, startWorkout, getWorkoutExercises, getSets } from '../db.js';
import { getReadinessData, readinessLabel, readinessColor } from '../health-sync.js';
import { recommend, BADGE_STYLES } from '../engines/recommendation-engine.js';
import { renderMuscleHeatmap } from '../components/muscle-heatmap.js';

export async function renderDashboard(container, activeWorkout) {
  const workouts = await getPastWorkouts(30);
  const templates = await getAllTemplates();

  // Week stats
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart);
  let weekVolume = 0;
  let weekSets = 0;
  for (const w of weekWorkouts) {
    const exercises = await getWorkoutExercises(w.id);
    for (const ex of exercises) {
      const sets = await getSets(ex.id);
      for (const s of sets) {
        if (s.isDone) {
          weekVolume += s.weight * s.reps;
          weekSets++;
        }
      }
    }
  }

  // Real readiness from health data
  const healthData = await getReadinessData();
  const readiness = healthData.readinessScore;
  const rColor = readinessColor(readiness);

  // Get recommendations
  let recommendations = [];
  try { recommendations = await recommend(readiness); } catch (e) { /* silent */ }

  const circumference = 2 * Math.PI * 62;
  const offset = circumference * (1 - readiness / 100);

  container.innerHTML = `
    <div class="flex-col gap-xxl">
      <h1 class="t-screen" style="margin-top: var(--sp-sm)">Barpath</h1>

      ${activeWorkout ? `
        <div class="card" style="border-left: 3px solid var(--bp-green); cursor: pointer;" id="resume-workout">
          <div class="flex items-center justify-between">
            <div>
              <div class="t-card">${activeWorkout.label}</div>
              <div class="t-caption text-muted">In progress — tap to resume</div>
            </div>
            <div class="pulse" style="width: 10px; height: 10px; background: var(--bp-green); border-radius: 50%;"></div>
          </div>
        </div>
      ` : ''}

      <!-- Readiness Ring -->
      <div class="card text-center" style="padding: var(--sp-xxl);">
        <div class="readiness-ring">
          <div class="warm-glow" style="width: 140px; height: 140px; background: ${rColor}; top: 0; left: 0;"></div>
          <svg viewBox="0 0 140 140">
            <circle class="ring-bg" cx="70" cy="70" r="62" fill="none" stroke-width="8"/>
            <circle class="ring-fill" cx="70" cy="70" r="62" fill="none" stroke="${rColor}" stroke-width="8"
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="readiness-value">
            <span class="t-hero" style="color: ${rColor}">${readiness}</span>
            <span class="t-label">READINESS</span>
          </div>
        </div>
        <p class="t-caption mt-md" style="color: ${rColor}">${readinessLabel(readiness)}</p>
      </div>

      <!-- Week Stats -->
      <div class="stat-row">
        <div class="stat-pill">
          <div class="stat-value">${weekWorkouts.length}</div>
          <div class="stat-label">Sessions</div>
        </div>
        <div class="stat-pill">
          <div class="stat-value">${weekVolume > 1000 ? (weekVolume / 1000).toFixed(1) + 'k' : weekVolume}</div>
          <div class="stat-label">Volume</div>
        </div>
        <div class="stat-pill">
          <div class="stat-value">${weekSets}</div>
          <div class="stat-label">Sets</div>
        </div>
      </div>

      <!-- MPS Heatmap -->
      <div id="dash-heatmap"></div>

      <!-- Quick Start w/ Recommendations -->
      ${!activeWorkout ? `
        <div>
          <div class="t-label mb-md">RECOMMENDED</div>
          ${recommendations.map(r => {
            const badge = BADGE_STYLES[r.badge];
            return `
              <div class="template-card" data-template-id="${r.template.id}">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="t-card">${r.template.name}</div>
                    <div class="t-caption text-muted">${r.template.exerciseEntries?.length || 0} exercises · ${r.template.exerciseEntries?.reduce((a, e) => a + e.sets, 0) || 0} sets</div>
                  </div>
                  <div class="text-right">
                    <span class="rec-badge" style="color: ${badge.color}; background: ${badge.bg}">${badge.label}</span>
                    <div class="t-data-sm" style="font-size: 11px; color: var(--bp-muted)">${Math.round(r.score)}</div>
                  </div>
                </div>
                <div class="rec-reasoning">${r.reasoning}</div>
              </div>
            `;
          }).join('')}
          <button class="btn btn-secondary btn-full mt-md" id="empty-workout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14m-7-7h14"/></svg>
            Empty Workout
          </button>
        </div>
      ` : ''}

      <!-- Recent Sessions -->
      ${workouts.length > 0 ? `
        <div>
          <div class="t-label mb-md">RECENT</div>
          ${workouts.slice(0, 5).map(w => {
            const d = new Date(w.date);
            const dur = w.endTime ? Math.round((new Date(w.endTime) - new Date(w.startTime)) / 60000) : 0;
            return `
              <div class="history-item">
                <div style="flex: 1;">
                  <div class="t-card">${w.label}</div>
                  <div class="t-caption text-muted">${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}${dur ? ` · ${dur} min` : ''}</div>
                </div>
                ${w.sessionRPE ? `<span class="t-data-sm" style="color: var(--bp-muted)">RPE ${w.sessionRPE}</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    </div>
  `;

  // Render heatmap
  const heatmapEl = document.getElementById('dash-heatmap');
  if (heatmapEl) {
    try { await renderMuscleHeatmap(heatmapEl); } catch (e) { console.warn('Heatmap error:', e); }
  }

  // Event handlers
  if (activeWorkout) {
    document.getElementById('resume-workout')?.addEventListener('click', () => {
      document.querySelector('[data-view="workout"]').click();
    });
  }

  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', async () => {
      const templateId = card.dataset.templateId;
      const template = templates.find(t => t.id === templateId);
      await startWorkout(template?.name || 'Workout', templateId);
      document.querySelector('[data-view="workout"]').click();
    });
  });

  document.getElementById('empty-workout')?.addEventListener('click', async () => {
    await startWorkout('Workout');
    document.querySelector('[data-view="workout"]').click();
  });
}
