// Barpath — Dashboard View
import { db, getPastWorkouts, getSessionVolume, getAllTemplates, startWorkout, getWorkoutExercises, getSets } from '../db.js';

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

  // Readiness score (placeholder without HealthKit — uses rest days logic)
  const lastWorkoutDate = workouts[0] ? new Date(workouts[0].date) : null;
  const hoursSinceLastWorkout = lastWorkoutDate ? (now - lastWorkoutDate) / 3600000 : 72;
  const readiness = Math.min(100, Math.round(
    hoursSinceLastWorkout < 12 ? 40 :
    hoursSinceLastWorkout < 24 ? 55 :
    hoursSinceLastWorkout < 48 ? 80 :
    hoursSinceLastWorkout < 72 ? 95 : 100
  ));

  const readinessColor = readiness >= 70 ? 'var(--bp-green)' :
    readiness >= 45 ? 'var(--bp-amber)' : 'var(--bp-red)';

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
          <div class="warm-glow" style="width: 140px; height: 140px; background: ${readinessColor}; top: 0; left: 0;"></div>
          <svg viewBox="0 0 140 140">
            <circle class="ring-bg" cx="70" cy="70" r="62" fill="none" stroke-width="8"/>
            <circle class="ring-fill" cx="70" cy="70" r="62" fill="none" stroke="${readinessColor}" stroke-width="8"
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="readiness-value">
            <span class="t-hero" style="color: ${readinessColor}">${readiness}</span>
            <span class="t-label">READINESS</span>
          </div>
        </div>
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

      <!-- Quick Start -->
      ${!activeWorkout ? `
        <div>
          <div class="t-label mb-md">QUICK START</div>
          ${templates.map(t => `
            <div class="template-card" data-template-id="${t.id}">
              <div class="t-card">${t.name}</div>
              <div class="t-caption text-muted">${t.exerciseEntries?.length || 0} exercises · ${t.exerciseEntries?.reduce((a, e) => a + e.sets, 0) || 0} sets</div>
            </div>
          `).join('')}
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
