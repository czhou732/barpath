// Barpath — Active Workout View
import { db, getActiveWorkout, getWorkoutExercises, getSets, getExercise,
         addExerciseToWorkout, addSet, updateSet, toggleSetDone, finishWorkout, deleteWorkout } from '../db.js';
import { showExercisePicker } from '../components/exercise-picker.js';
import { showRestTimer } from '../components/rest-timer.js';
import { getUnit } from '../main.js';

let refreshFn = null;

export async function renderWorkout(container, activeWorkout) {
  if (!activeWorkout) {
    container.innerHTML = `
      <div class="flex-col gap-xxl" style="padding-top: var(--sp-huge); text-align: center;">
        <h2 class="t-section">No Active Workout</h2>
        <p class="t-body text-muted">Start a workout from the dashboard to begin tracking.</p>
        <button class="btn btn-primary btn-full" onclick="document.querySelector('[data-view=dashboard]').click()">
          Go to Dashboard
        </button>
      </div>
    `;
    return;
  }

  const sessionId = activeWorkout.id;
  const exercises = await getWorkoutExercises(sessionId);
  const detailed = [];

  for (const ex of exercises) {
    const sets = await getSets(ex.id);
    const exerciseInfo = await getExercise(ex.exerciseId);
    detailed.push({ ...ex, sets, exercise: exerciseInfo });
  }

  // Duration
  const start = new Date(activeWorkout.startTime);
  const elapsed = Math.round((Date.now() - start.getTime()) / 60000);
  const totalSets = detailed.reduce((a, ex) => a + ex.sets.filter(s => s.isDone).length, 0);
  const totalVolume = detailed.reduce((a, ex) =>
    a + ex.sets.filter(s => s.isDone).reduce((v, s) => v + s.weight * s.reps, 0), 0);

  const unit = getUnit();

  container.innerHTML = `
    <div class="flex-col gap-lg">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="t-section">${activeWorkout.label}</h1>
          <div class="t-caption text-muted">${elapsed} min · ${totalSets} sets · ${totalVolume > 1000 ? (totalVolume/1000).toFixed(1) + 'k' : totalVolume} ${unit} volume</div>
        </div>
        <button class="btn btn-primary" id="finish-workout-btn">Finish</button>
      </div>

      <!-- Exercises -->
      ${detailed.map((ex, exIdx) => `
        <div class="exercise-block" data-exercise-id="${ex.id}">
          <div class="flex items-center justify-between mb-md">
            <div>
              <div class="exercise-name">${ex.name}</div>
              <div class="exercise-muscles">${ex.exercise?.primaryMuscles?.map(m => m.replace(/_/g, ' ')).join(', ') || ''}</div>
            </div>
          </div>

          <!-- Set header -->
          <div class="set-row" style="border-bottom: 1px solid var(--bp-border-strong);">
            <span class="t-label" style="text-align: center">SET</span>
            <span class="t-label" style="text-align: center">${unit.toUpperCase()}</span>
            <span class="t-label" style="text-align: center">REPS</span>
            <span class="t-label" style="text-align: center">RPE</span>
            <span></span>
          </div>

          <!-- Sets -->
          ${ex.sets.map((set, setIdx) => `
            <div class="set-row" data-set-id="${set.id}">
              <span class="set-number">${setIdx + 1}</span>
              <input type="number" inputmode="decimal" class="input input-number set-weight" value="${set.weight || ''}" placeholder="0" data-set-id="${set.id}" data-field="weight">
              <input type="number" inputmode="numeric" class="input input-number set-reps" value="${set.reps || ''}" placeholder="0" data-set-id="${set.id}" data-field="reps">
              <input type="number" inputmode="decimal" class="input input-number set-rpe" value="${set.rpe || ''}" placeholder="—" data-set-id="${set.id}" data-field="rpe" min="1" max="10" step="0.5">
              <button class="set-done ${set.isDone ? 'checked' : ''}" data-set-id="${set.id}" data-exercise-idx="${exIdx}">
                ${set.isDone ? '✓' : ''}
              </button>
            </div>
          `).join('')}

          <!-- Add set -->
          <button class="btn btn-ghost btn-full mt-sm add-set-btn" data-wex-id="${ex.id}" style="font-size: 13px; padding: var(--sp-sm);">
            + Add Set
          </button>
        </div>
      `).join('')}

      <!-- Add Exercise -->
      <button class="btn btn-secondary btn-full" id="add-exercise-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14m-7-7h14"/></svg>
        Add Exercise
      </button>

      <!-- Notes -->
      <div class="card">
        <div class="t-label mb-md">NOTES</div>
        <textarea class="input" id="workout-notes" rows="2" placeholder="Session notes..." style="resize: vertical;">${activeWorkout.notes || ''}</textarea>
      </div>

      <!-- Cancel -->
      <button class="btn btn-ghost btn-full text-red" id="cancel-workout-btn" style="font-size: 13px; padding: var(--sp-xl) 0;">
        Cancel Workout
      </button>
    </div>
  `;

  // ── Event Handlers ──

  // Set input changes (weight, reps, RPE)
  container.querySelectorAll('.set-weight, .set-reps, .set-rpe').forEach(input => {
    input.addEventListener('change', async () => {
      const setId = parseInt(input.dataset.setId);
      const field = input.dataset.field;
      const value = parseFloat(input.value) || 0;
      await updateSet(setId, { [field]: value });
    });
  });

  // Toggle set done
  container.querySelectorAll('.set-done').forEach(btn => {
    btn.addEventListener('click', async () => {
      const setId = parseInt(btn.dataset.setId);
      await toggleSetDone(setId);

      const set = await db.workoutSets.get(setId);
      btn.classList.toggle('checked', !!set.isDone);
      btn.textContent = set.isDone ? '✓' : '';

      // Trigger rest timer if set is marked done
      if (set.isDone) {
        showRestTimer(120);
      }

      // Update header stats
      const workout = await getActiveWorkout();
      if (workout) renderWorkout(container, workout);
    });
  });

  // Add set
  container.querySelectorAll('.add-set-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const wexId = parseInt(btn.dataset.wexId);
      await addSet(wexId);
      const workout = await getActiveWorkout();
      renderWorkout(container, workout);
    });
  });

  // Add exercise
  document.getElementById('add-exercise-btn')?.addEventListener('click', async () => {
    showExercisePicker(async (exerciseId) => {
      await addExerciseToWorkout(sessionId, exerciseId, 3);
      const workout = await getActiveWorkout();
      renderWorkout(container, workout);
    });
  });

  // Notes
  document.getElementById('workout-notes')?.addEventListener('change', async (e) => {
    await db.workoutSessions.update(sessionId, { notes: e.target.value });
  });

  // Finish workout
  document.getElementById('finish-workout-btn')?.addEventListener('click', () => {
    showSessionRating(sessionId, container);
  });

  // Cancel workout
  document.getElementById('cancel-workout-btn')?.addEventListener('click', async () => {
    if (confirm('Cancel this workout? All data will be lost.')) {
      await deleteWorkout(sessionId);
      document.querySelector('[data-view="dashboard"]').click();
    }
  });
}

// ── Session Rating Modal ──
function showSessionRating(sessionId, container) {
  const modal = document.getElementById('modal-root');
  let selectedRPE = 0;
  let selectedMood = '';

  modal.innerHTML = `
    <div class="modal-backdrop" id="rating-backdrop">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <h2 class="t-section text-center mb-md">Session Complete</h2>

        <div class="t-label mb-md">SESSION RPE</div>
        <div class="rpe-grid mb-md">
          ${[6, 7, 8, 9, 10].map(n => `
            <button class="rpe-btn" data-rpe="${n}">${n}</button>
          `).join('')}
        </div>

        <div class="t-label mb-md mt-xl">HOW DO YOU FEEL?</div>
        <div class="mood-row mb-md">
          ${['😤', '😐', '💪', '🔥', '😵'].map(m => `
            <button class="mood-btn" data-mood="${m}">${m}</button>
          `).join('')}
        </div>

        <div class="t-label mb-md mt-xl">NOTES</div>
        <textarea class="input" id="rating-notes" rows="2" placeholder="How was this session?"></textarea>

        <button class="btn btn-primary btn-full mt-xl" id="save-rating">Save & Finish</button>
      </div>
    </div>
  `;

  // RPE selection
  modal.querySelectorAll('.rpe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.rpe-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedRPE = parseInt(btn.dataset.rpe);
    });
  });

  // Mood selection
  modal.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
    });
  });

  // Save
  document.getElementById('save-rating')?.addEventListener('click', async () => {
    const notes = document.getElementById('rating-notes')?.value || '';
    await finishWorkout(sessionId, selectedRPE, selectedMood, notes);
    modal.innerHTML = '';
    document.querySelector('[data-view="dashboard"]').click();
  });

  // Backdrop close
  document.getElementById('rating-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'rating-backdrop') modal.innerHTML = '';
  });
}
