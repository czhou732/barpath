// Barpath — Exercise Picker Component
import { getExercises } from '../db.js';

export async function showExercisePicker(onSelect) {
  const exercises = await getExercises();
  const modal = document.getElementById('modal-root');

  function render(filter = '') {
    const q = filter.toLowerCase();
    const filtered = q
      ? exercises.filter(ex =>
          ex.nameEN.toLowerCase().includes(q) ||
          ex.nameZH.includes(q) ||
          ex.equipment.toLowerCase().includes(q) ||
          ex.primaryMuscles.some(m => m.toLowerCase().includes(q))
        )
      : exercises;

    // Group by category
    const groups = {};
    for (const ex of filtered) {
      const cat = getCategoryLabel(ex);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ex);
    }

    modal.innerHTML = `
      <div class="modal-backdrop" id="picker-backdrop">
        <div class="modal-sheet" style="max-height: 90dvh;">
          <div class="modal-handle"></div>
          <h2 class="t-section mb-md">Add Exercise</h2>

          <div class="search-bar">
            <input type="text" class="input" id="exercise-search" placeholder="Search exercises..." value="${filter}" autofocus>
          </div>

          <div style="overflow-y: auto; max-height: 65dvh;">
            ${Object.entries(groups).map(([cat, exs]) => `
              <div class="mt-lg">
                <div class="t-label mb-sm">${cat}</div>
                ${exs.map(ex => `
                  <div class="history-item exercise-option" data-exercise-id="${ex.id}" style="cursor: pointer;">
                    <div style="flex: 1;">
                      <div class="t-card">${ex.nameEN}</div>
                      <div class="t-caption text-muted">${ex.primaryMuscles.map(m => m.replace(/_/g, ' ')).join(', ')} · ${ex.equipment}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `).join('')}

            ${filtered.length === 0 ? '<p class="t-body text-muted text-center mt-xl">No exercises found</p>' : ''}
          </div>
        </div>
      </div>
    `;

    // Search
    const searchInput = document.getElementById('exercise-search');
    searchInput?.addEventListener('input', (e) => {
      render(e.target.value);
    });
    // Focus after render
    setTimeout(() => searchInput?.focus(), 100);

    // Select exercise
    modal.querySelectorAll('.exercise-option').forEach(el => {
      el.addEventListener('click', () => {
        const exerciseId = el.dataset.exerciseId;
        modal.innerHTML = '';
        onSelect(exerciseId);
      });
    });

    // Backdrop close
    document.getElementById('picker-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'picker-backdrop') modal.innerHTML = '';
    });
  }

  render();
}

function getCategoryLabel(exercise) {
  const muscles = exercise.primaryMuscles;
  if (muscles.some(m => ['chest', 'upper_chest'].includes(m))) return 'CHEST';
  if (muscles.some(m => ['back', 'lats'].includes(m))) return 'BACK';
  if (muscles.some(m => ['quads', 'hamstrings', 'glutes', 'calves'].includes(m))) return 'LEGS';
  if (muscles.some(m => ['front_delts', 'side_delts', 'rear_delts', 'traps', 'rotator_cuff'].includes(m))) return 'SHOULDERS';
  if (muscles.some(m => ['biceps', 'triceps', 'forearms'].includes(m))) return 'ARMS';
  if (muscles.some(m => ['core', 'obliques', 'hip_flexors'].includes(m))) return 'CORE';
  return 'OTHER';
}
