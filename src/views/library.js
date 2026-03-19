// Barpath — Exercise Library (Movements View)
// Ported from MovementsView.swift + ExerciseDescriptions.swift

import { getExercises } from '../db.js';
import { smartRestSeconds } from '../engines/progression-engine.js';

// ── Exercise Descriptions ──

const DESCRIPTIONS = {
  bench_press: "Lie flat on a bench, grip the barbell slightly wider than shoulder-width. Lower the bar to mid-chest, then press up until arms are fully extended. Keep feet flat, back slightly arched, and shoulder blades retracted.",
  db_bench: "Lie on a flat bench holding dumbbells at chest level. Press up until arms are extended, then lower with control. Dumbbells allow greater range of motion than barbell.",
  incline_bench: "Set bench to 30-45°. Grip barbell slightly wider than shoulders, lower to upper chest, press back up. Targets upper chest and front delts more than flat bench.",
  db_incline_bench: "Set bench to 30-45° with dumbbells. Press up and slightly inward at the top. Greater stretch at the bottom compared to barbell.",
  cable_fly: "Set cables at chest height. Step forward, slight bend in elbows, bring handles together in front of chest in a hugging motion. Constant tension throughout.",
  db_fly: "Lie flat with dumbbells extended above chest, slight elbow bend. Lower arms out to sides until you feel a stretch, then squeeze back up.",
  pec_deck: "Sit with back against pad, forearms against the pads. Squeeze arms together in front of chest. Great for isolating the pecs.",
  dip: "Support yourself on parallel bars, lean slightly forward. Lower until upper arms are parallel to ground, then push back up.",
  decline_bench: "Lie on a decline bench, unrack the barbell. Lower to lower chest, press up. Emphasizes lower chest fibers.",
  machine_chest_press: "Sit with handles at chest height, push forward until arms are extended. Machine provides a fixed path.",
  pushup: "Hands shoulder-width apart, body in a straight line. Lower chest to near the floor, push back up.",
  diamond_pushup: "Form a diamond shape with hands under chest. Lower and press up. Shifts emphasis to triceps and inner chest.",
  squat: "Bar on upper traps, feet shoulder-width. Break at hips and knees simultaneously, descend until thighs are parallel or below. Drive through midfoot to stand.",
  front_squat: "Bar rests on front delts in a clean grip. More upright torso than back squat, emphasizes quads and core.",
  leg_press: "Sit in the machine, feet shoulder-width on the platform. Lower the sled by bending knees to 90°, then press back up.",
  leg_extension: "Sit in the machine, pad above ankles. Extend legs fully, squeeze quads at top. Pure quad isolation.",
  leg_curl: "Lie face down, pad behind ankles. Curl the weight by bending knees. Isolates the hamstrings.",
  rdl: "Stand with barbell at hips, slight knee bend. Hinge at hips, lower bar along legs until hamstring stretch, stand back up. Keep back flat.",
  deadlift: "Bar over midfoot, hip-width stance. Grip outside knees, flat back, drive through floor. The heaviest lift for most people.",
  hip_thrust: "Upper back on bench, barbell across hips. Drive hips up until body is flat from knees to shoulders. Squeeze glutes hard at top.",
  bulgarian_split: "Rear foot elevated on bench, front foot forward. Descend until front thigh is parallel, drive back up.",
  calf_raise: "Stand on platform with balls of feet, heels hanging off. Rise up onto toes, pause at top, lower with a full stretch.",
  lunge: "Step forward into a lunge position, lower until both knees are near 90°. Drive back up.",
  hack_squat: "Machine squat with back against angled pad. Feet forward on platform, lower until knees near 90°. Quad-dominant.",
  goblet_squat: "Hold a dumbbell vertically at chest level. Squat down keeping torso upright.",
  sumo_deadlift: "Wide stance, toes out, grip inside knees. More upright torso than conventional.",
  seated_calf_raise: "Sit with pad on lower thighs, balls of feet on platform. Targets the soleus.",
  step_up: "Step onto a box with one foot, drive up to standing. Step back down with control.",
  glute_kickback: "Cable attached to ankle, lean forward slightly. Kick leg straight back, squeezing glute at the top.",
  good_morning: "Bar on upper back. Hinge at hips with slight knee bend, lower torso until nearly parallel to floor.",
  db_rdl: "Same as barbell RDL but with dumbbells at sides.",
  barbell_row: "Hinge forward 45°, grip barbell outside knees. Pull to lower ribcage, squeezing shoulder blades together.",
  db_row: "One hand and knee on bench, other hand holds dumbbell. Pull to hip, squeeze back, lower with control.",
  pullup: "Hang from bar, overhand grip wider than shoulders. Pull up until chin clears bar. The gold standard for lats.",
  lat_pulldown: "Sit at machine, wide overhand grip. Pull bar to upper chest, squeezing lats.",
  cable_row: "Sit at cable station, feet on platform. Pull handle to lower chest/upper abdomen, squeeze shoulder blades.",
  t_bar_row: "Straddle the T-bar, grab handles. Row the weight up to chest, squeezing upper back.",
  chinup: "Hang from bar with underhand grip, shoulder-width. Pull up until chin clears bar. More bicep involvement than pull-ups.",
  pendlay_row: "Strict barbell row from the floor each rep. Explosive pull, great for power and back thickness.",
  chest_supported_row: "Lie chest-down on an incline bench with dumbbells. Row up, squeeze shoulder blades.",
  machine_row: "Sit at row machine, chest against pad. Pull handles back, squeeze shoulder blades.",
  straight_arm_pulldown: "Stand at cable machine, arms straight. Pull bar down in an arc. Isolates the lats.",
  ohp: "Standing with barbell at shoulders, press overhead until lockout. Fundamental overhead pressing.",
  db_ohp: "Seated or standing with dumbbells at shoulder height, press overhead.",
  lateral_raise: "Stand with dumbbells at sides. Raise arms out to sides until parallel to floor.",
  cable_lateral: "Side-on to cable machine. Raise arm out to side until parallel. Constant tension.",
  face_pull: "Cable at face height with rope attachment. Pull toward face, separating hands and externally rotating shoulders.",
  rear_delt_fly: "Bent over or seated, dumbbells hanging. Raise arms out to sides squeezing rear delts.",
  arnold_press: "Start with dumbbells in front of face, palms facing you. Rotate palms outward as you press overhead.",
  front_raise: "Stand with dumbbells at thighs. Raise one or both arms in front to shoulder height.",
  upright_row: "Grip barbell narrow, pull straight up along body to chin height, elbows flaring out.",
  reverse_pec_deck: "Face the pec deck machine, grip handles in front. Open arms back squeezing rear delts.",
  machine_shoulder_press: "Sit at shoulder press machine, press handles overhead. Guided path.",
  db_shrug: "Stand with heavy dumbbells at sides. Shrug shoulders toward ears, hold briefly, lower.",
  barbell_curl: "Stand with barbell, underhand grip. Curl up by flexing biceps, keep elbows pinned.",
  db_curl: "Stand or sit with dumbbells. Curl up, supinate wrists at the top for peak contraction.",
  hammer_curl: "Curl dumbbells with neutral grip. Targets brachialis and brachioradialis.",
  preacher_curl: "Arm over preacher bench pad, curl up. Eliminates momentum, isolates bicep peak.",
  cable_curl: "Stand at cable machine with bar attachment. Curl up, constant tension throughout.",
  concentration_curl: "Sit with elbow braced against inner thigh. Curl dumbbell focusing on peak contraction.",
  incline_curl: "Sit on incline bench with dumbbells hanging. Curl up. Incline stretches the long head.",
  spider_curl: "Lie chest-down on incline bench, arms hanging. Curl up. Targets short head of bicep.",
  tricep_pushdown: "Stand at cable machine. Push down extending elbows fully, keep upper arms pinned.",
  overhead_extension: "Cable or dumbbell behind head. Extend arms overhead. Targets long head of triceps.",
  skull_crusher: "Lie on bench with barbell. Lower to forehead, then extend back up. Classic tricep mass builder.",
  close_grip_bench: "Bench press with hands 12-16 inches apart. Emphasizes triceps while still working chest.",
  tricep_kickback: "Lean forward, upper arm parallel to ground. Extend forearm back until arm is straight.",
  reverse_curl: "Curl barbell with overhand grip. Builds forearm thickness.",
  wrist_curl: "Forearms on thighs, palms up. Curl wrists up, lower slowly.",
  farmer_walk: "Hold heavy dumbbells at sides. Walk with upright posture. Builds grip, traps, and core.",
  cable_crunch: "Kneel at cable machine with rope behind head. Crunch down curling ribcage toward pelvis.",
  hanging_leg_raise: "Hang from pull-up bar, raise legs until parallel to floor or higher.",
  ab_wheel: "Kneel with ab wheel, roll forward extending body, then pull back with abs.",
  russian_twist: "Sit with knees bent, lean back slightly, rotate torso side to side.",
  pallof_press: "Stand sideways to cable at chest height. Press handles straight out, resist rotation.",
  dragon_flag: "Lie on bench, hold behind head. Raise body to vertical, lower as slowly as possible.",
};

// ── Equipment Icons ──
const EQUIP_ICONS = {
  barbell: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="9" width="4" height="6" rx="1"/><rect x="19" y="9" width="4" height="6" rx="1"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  dumbbell: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="9" width="3" height="6" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><rect x="5" y="10" width="2" height="4" rx="0.5"/><rect x="17" y="10" width="2" height="4" rx="0.5"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
  cable: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="16" height="4" rx="1"/><line x1="12" y1="6" x2="12" y2="18"/><circle cx="12" cy="20" r="2"/></svg>`,
  machine: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`,
  bodyweight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="5" r="3"/><path d="M12 8v8m-4-4h8m-6 4l-2 4m4-4l2 4"/></svg>`,
};

function formatMuscle(m) { return m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function formatRestTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}:${s.toString().padStart(2,'0')}` : `${m}:00`;
}

export function renderLibrary(container) {
  let searchText = '';
  let selectedMuscle = null;
  let allExercises = [];

  async function init() {
    allExercises = await getExercises();
    allExercises.sort((a, b) => a.nameEN.localeCompare(b.nameEN));
    render();
  }

  function filtered() {
    let result = allExercises;
    if (selectedMuscle) {
      result = result.filter(ex =>
        (ex.primaryMuscles || []).includes(selectedMuscle) ||
        (ex.secondaryMuscles || []).includes(selectedMuscle)
      );
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(ex =>
        ex.nameEN.toLowerCase().includes(q) || ex.nameZH?.includes(q) || ex.id.includes(q)
      );
    }
    return result;
  }

  function muscleGroups() {
    const set = new Set();
    allExercises.forEach(ex => (ex.primaryMuscles || []).forEach(m => set.add(m)));
    return [...set].sort();
  }

  function render() {
    const exercises = filtered();
    const groups = muscleGroups();

    container.innerHTML = `
      <div class="flex-col gap-lg">
        <h1 class="t-section" style="margin-top: var(--sp-sm)">Movements</h1>

        <!-- Search -->
        <div class="search-bar">
          <input class="input" type="text" id="lib-search" placeholder="Search exercises..." value="${searchText}">
        </div>

        <!-- Muscle chips -->
        <div class="chip-scroll">
          <button class="chip ${!selectedMuscle ? 'chip-active' : ''}" data-muscle="">All</button>
          ${groups.map(m => `
            <button class="chip ${selectedMuscle === m ? 'chip-active' : ''}" data-muscle="${m}">${formatMuscle(m)}</button>
          `).join('')}
        </div>

        <!-- Count -->
        <span class="t-caption text-muted">${exercises.length} exercises</span>

        <!-- Exercise list -->
        <div class="lib-list">
          ${exercises.map(ex => {
            const equip = EQUIP_ICONS[ex.equipment] || '';
            const repRange = ex.hypertrophyReps ? `${ex.hypertrophyReps[0]}–${ex.hypertrophyReps[1]}` : '';
            return `
              <div class="lib-item" data-exercise-id="${ex.id}">
                <div class="lib-item-left">
                  <div class="lib-name">${ex.nameEN}</div>
                  <div class="lib-sub">${ex.nameZH || ''}</div>
                </div>
                <div class="lib-item-right">
                  <span class="lib-equip">${equip} ${(ex.equipment || '').replace(/_/g, ' ')}</span>
                  ${repRange ? `<span class="lib-reps">${repRange} reps</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Search handler
    document.getElementById('lib-search')?.addEventListener('input', e => {
      searchText = e.target.value;
      render();
    });

    // Chip handlers
    container.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        selectedMuscle = chip.dataset.muscle || null;
        render();
      });
    });

    // Item click → detail modal
    container.querySelectorAll('.lib-item').forEach(item => {
      item.addEventListener('click', () => {
        const ex = allExercises.find(e => e.id === item.dataset.exerciseId);
        if (ex) showDetail(ex);
      });
    });
  }

  function showDetail(ex) {
    const desc = DESCRIPTIONS[ex.id] || '';
    const rest = smartRestSeconds(ex.id);
    const repRange = ex.hypertrophyReps ? `${ex.hypertrophyReps[0]}–${ex.hypertrophyReps[1]}` : '—';
    const strRange = ex.strengthReps ? `${ex.strengthReps[0]}–${ex.strengthReps[1]}` : '—';
    const equip = (ex.equipment || '').replace(/_/g, ' ');

    const modal = document.getElementById('modal-root');
    modal.innerHTML = `
      <div class="modal-backdrop" id="lib-detail-backdrop">
        <div class="modal-sheet" style="max-height: 80dvh">
          <div class="modal-handle"></div>

          <h2 class="t-section">${ex.nameEN}</h2>
          <p class="t-caption text-muted mb-md">${ex.nameZH || ''}</p>

          <!-- Info pills -->
          <div class="chip-scroll" style="margin-bottom: 16px">
            <span class="info-pill">${EQUIP_ICONS[ex.equipment] || ''} ${equip}</span>
            <span class="info-pill">🔄 ${repRange} reps</span>
            <span class="info-pill">⚡ ${strRange} strength</span>
            <span class="info-pill">⏱ ${formatRestTimer(rest)} rest</span>
          </div>

          ${desc ? `
            <div class="mb-md">
              <div class="t-label mb-sm">HOW TO PERFORM</div>
              <p class="t-body text-muted" style="line-height: 1.7">${desc}</p>
            </div>
          ` : ''}

          <div class="mb-md">
            <div class="t-label mb-sm">TARGET MUSCLES</div>
            ${(ex.primaryMuscles || []).map(m => `
              <div class="flex items-center gap-sm" style="padding: 3px 0">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--bp-accent); flex-shrink: 0"></span>
                <span class="t-body">${formatMuscle(m)}</span>
              </div>
            `).join('')}
            ${(ex.secondaryMuscles || []).length > 0 ? `
              <div class="t-label mb-sm mt-md" style="font-size: 9px">SECONDARY</div>
              ${(ex.secondaryMuscles || []).map(m => `
                <div class="flex items-center gap-sm" style="padding: 3px 0">
                  <span style="width: 6px; height: 6px; border-radius: 50%; border: 1px solid var(--bp-subtle); flex-shrink: 0"></span>
                  <span class="t-body text-muted">${formatMuscle(m)}</span>
                </div>
              `).join('')}
            ` : ''}
          </div>

          <button class="btn btn-secondary btn-full" id="lib-detail-close">Done</button>
        </div>
      </div>
    `;

    document.getElementById('lib-detail-backdrop').addEventListener('click', e => {
      if (e.target.id === 'lib-detail-backdrop') modal.innerHTML = '';
    });
    document.getElementById('lib-detail-close').addEventListener('click', () => {
      modal.innerHTML = '';
    });
  }

  init();
}
