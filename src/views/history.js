// Barpath — History View
import { getPastWorkouts, getWorkoutExercises, getSets } from '../db.js';
import { getUnit } from '../main.js';

export async function renderHistory(container) {
  const workouts = await getPastWorkouts(50);
  const unit = getUnit();

  // Enrich with stats
  const enriched = [];
  for (const w of workouts) {
    const exercises = await getWorkoutExercises(w.id);
    let volume = 0;
    let setCount = 0;
    const exNames = [];
    for (const ex of exercises) {
      exNames.push(ex.name);
      const sets = await getSets(ex.id);
      for (const s of sets) {
        if (s.isDone) { volume += s.weight * s.reps; setCount++; }
      }
    }
    const dur = w.endTime ? Math.round((new Date(w.endTime) - new Date(w.startTime)) / 60000) : 0;
    enriched.push({ ...w, volume, setCount, exerciseNames: exNames, duration: dur });
  }

  // Group by week
  const groups = {};
  for (const w of enriched) {
    const d = new Date(w.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(w);
  }

  container.innerHTML = `
    <div class="flex-col gap-xxl">
      <h1 class="t-screen" style="margin-top: var(--sp-sm)">History</h1>

      ${enriched.length === 0 ? `
        <div class="text-center mt-xl">
          <p class="t-body text-muted">No workouts yet. Start your first session from the dashboard!</p>
        </div>
      ` : ''}

      ${Object.entries(groups).map(([week, workouts]) => `
        <div>
          <div class="t-label mb-md">WEEK OF ${week.toUpperCase()}</div>
          ${workouts.map(w => {
            const d = new Date(w.date);
            return `
              <div class="card" style="margin-bottom: var(--sp-sm);">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="t-card">${w.label}</div>
                    <div class="t-caption text-muted">
                      ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      ${w.duration ? ` · ${w.duration} min` : ''}
                      · ${w.setCount} sets
                    </div>
                    <div class="t-caption text-subtle mt-sm" style="font-size: 11px;">
                      ${w.exerciseNames.slice(0, 4).join(', ')}${w.exerciseNames.length > 4 ? '...' : ''}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="t-data-sm">${w.volume > 1000 ? (w.volume/1000).toFixed(1) + 'k' : w.volume}</div>
                    <div class="t-caption text-muted">${unit}</div>
                    ${w.sessionRPE ? `<div class="t-caption mt-sm" style="color: var(--bp-amber);">RPE ${w.sessionRPE} ${w.sessionMood || ''}</div>` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `).join('')}
    </div>
  `;
}
