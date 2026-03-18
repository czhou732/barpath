// Barpath Seed Data — 75 exercises + PPL templates
// Ported from SeedData.swift

import { db } from './db.js';

const EXERCISES = [
  // ── Chest ──
  { id: 'bench_press', nameEN: 'Barbell Bench Press', nameZH: '杠铃卧推', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'front_delts'], equipment: 'barbell', strengthReps: [3,6], hypertrophyReps: [6,12] },
  { id: 'db_bench', nameEN: 'Dumbbell Bench Press', nameZH: '哑铃卧推', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'front_delts'], equipment: 'dumbbell', strengthReps: [6,8], hypertrophyReps: [8,12] },
  { id: 'incline_bench', nameEN: 'Incline Barbell Bench', nameZH: '上斜杠铃卧推', primaryMuscles: ['upper_chest'], secondaryMuscles: ['front_delts', 'triceps'], equipment: 'barbell', strengthReps: [4,6], hypertrophyReps: [6,10] },
  { id: 'db_incline_bench', nameEN: 'Incline Dumbbell Press', nameZH: '上斜哑铃卧推', primaryMuscles: ['upper_chest'], secondaryMuscles: ['front_delts', 'triceps'], equipment: 'dumbbell', strengthReps: [6,8], hypertrophyReps: [8,12] },
  { id: 'cable_fly', nameEN: 'Cable Fly', nameZH: '绳索飞鸟', primaryMuscles: ['chest'], secondaryMuscles: [], equipment: 'cable', strengthReps: [10,12], hypertrophyReps: [12,20] },
  { id: 'db_fly', nameEN: 'Dumbbell Fly', nameZH: '哑铃飞鸟', primaryMuscles: ['chest'], secondaryMuscles: [], equipment: 'dumbbell', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'pec_deck', nameEN: 'Pec Deck Machine', nameZH: '蝴蝶机夹胸', primaryMuscles: ['chest'], secondaryMuscles: [], equipment: 'machine', strengthReps: [8,10], hypertrophyReps: [12,20] },
  { id: 'dip', nameEN: 'Dip', nameZH: '双杠臂屈伸', primaryMuscles: ['chest', 'triceps'], secondaryMuscles: ['front_delts'], equipment: 'bodyweight', strengthReps: [5,8], hypertrophyReps: [8,15] },
  { id: 'decline_bench', nameEN: 'Decline Bench Press', nameZH: '下斜卧推', primaryMuscles: ['chest'], secondaryMuscles: ['triceps'], equipment: 'barbell', strengthReps: [6,8], hypertrophyReps: [8,12] },
  { id: 'machine_chest_press', nameEN: 'Machine Chest Press', nameZH: '机器推胸', primaryMuscles: ['chest'], secondaryMuscles: ['triceps'], equipment: 'machine', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'pushup', nameEN: 'Push-Up', nameZH: '俯卧撑', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'front_delts'], equipment: 'bodyweight', strengthReps: [10,20], hypertrophyReps: [15,30] },
  { id: 'diamond_pushup', nameEN: 'Diamond Push-Up', nameZH: '钻石俯卧撑', primaryMuscles: ['triceps', 'chest'], secondaryMuscles: ['front_delts'], equipment: 'bodyweight', strengthReps: [8,15], hypertrophyReps: [10,20] },

  // ── Legs ──
  { id: 'squat', nameEN: 'Barbell Back Squat', nameZH: '杠铃深蹲', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings', 'core'], equipment: 'barbell', strengthReps: [3,6], hypertrophyReps: [6,12] },
  { id: 'front_squat', nameEN: 'Front Squat', nameZH: '前蹲', primaryMuscles: ['quads'], secondaryMuscles: ['core', 'glutes'], equipment: 'barbell', strengthReps: [3,6], hypertrophyReps: [6,10] },
  { id: 'leg_press', nameEN: 'Leg Press', nameZH: '腿举', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'], equipment: 'machine', strengthReps: [6,8], hypertrophyReps: [10,15] },
  { id: 'leg_extension', nameEN: 'Leg Extension', nameZH: '腿屈伸', primaryMuscles: ['quads'], secondaryMuscles: [], equipment: 'machine', strengthReps: [10,12], hypertrophyReps: [12,20] },
  { id: 'leg_curl', nameEN: 'Lying Leg Curl', nameZH: '俯卧腿弯举', primaryMuscles: ['hamstrings'], secondaryMuscles: [], equipment: 'machine', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'rdl', nameEN: 'Romanian Deadlift', nameZH: '罗马尼亚硬拉', primaryMuscles: ['hamstrings', 'glutes'], secondaryMuscles: ['back'], equipment: 'barbell', strengthReps: [6,8], hypertrophyReps: [8,12] },
  { id: 'deadlift', nameEN: 'Conventional Deadlift', nameZH: '传统硬拉', primaryMuscles: ['back', 'hamstrings', 'glutes'], secondaryMuscles: ['core', 'traps'], equipment: 'barbell', strengthReps: [1,5], hypertrophyReps: [5,8] },
  { id: 'hip_thrust', nameEN: 'Barbell Hip Thrust', nameZH: '杠铃臀推', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings'], equipment: 'barbell', strengthReps: [6,8], hypertrophyReps: [10,15] },
  { id: 'bulgarian_split', nameEN: 'Bulgarian Split Squat', nameZH: '保加利亚分腿蹲', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'], equipment: 'dumbbell', strengthReps: [6,8], hypertrophyReps: [8,12] },
  { id: 'calf_raise', nameEN: 'Standing Calf Raise', nameZH: '站姿提踵', primaryMuscles: ['calves'], secondaryMuscles: [], equipment: 'machine', strengthReps: [10,12], hypertrophyReps: [15,25] },
  { id: 'lunge', nameEN: 'Walking Lunge', nameZH: '行走弓步', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'], equipment: 'dumbbell', strengthReps: [6,8], hypertrophyReps: [10,15] },
  { id: 'hack_squat', nameEN: 'Hack Squat', nameZH: '哈克深蹲', primaryMuscles: ['quads'], secondaryMuscles: ['glutes'], equipment: 'machine', strengthReps: [6,8], hypertrophyReps: [8,12] },
  { id: 'goblet_squat', nameEN: 'Goblet Squat', nameZH: '高脚杯深蹲', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['core'], equipment: 'dumbbell', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'sumo_deadlift', nameEN: 'Sumo Deadlift', nameZH: '相扑硬拉', primaryMuscles: ['glutes', 'hamstrings'], secondaryMuscles: ['quads', 'back'], equipment: 'barbell', strengthReps: [3,6], hypertrophyReps: [6,10] },
  { id: 'seated_calf_raise', nameEN: 'Seated Calf Raise', nameZH: '坐姿提踵', primaryMuscles: ['calves'], secondaryMuscles: [], equipment: 'machine', strengthReps: [10,12], hypertrophyReps: [15,25] },
  { id: 'step_up', nameEN: 'Step-Up', nameZH: '踏步', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'], equipment: 'dumbbell', strengthReps: [6,8], hypertrophyReps: [10,15] },
  { id: 'glute_kickback', nameEN: 'Cable Glute Kickback', nameZH: '绳索臀后踢', primaryMuscles: ['glutes'], secondaryMuscles: [], equipment: 'cable', strengthReps: [10,12], hypertrophyReps: [12,20] },
  { id: 'good_morning', nameEN: 'Good Morning', nameZH: '早安式体前屈', primaryMuscles: ['hamstrings', 'back'], secondaryMuscles: ['glutes'], equipment: 'barbell', strengthReps: [6,8], hypertrophyReps: [8,12] },
  { id: 'db_rdl', nameEN: 'Dumbbell RDL', nameZH: '哑铃罗马尼亚硬拉', primaryMuscles: ['hamstrings', 'glutes'], secondaryMuscles: ['back'], equipment: 'dumbbell', strengthReps: [8,10], hypertrophyReps: [10,15] },

  // ── Back ──
  { id: 'barbell_row', nameEN: 'Barbell Row', nameZH: '杠铃划船', primaryMuscles: ['back', 'lats'], secondaryMuscles: ['biceps', 'rear_delts'], equipment: 'barbell', strengthReps: [5,8], hypertrophyReps: [8,12] },
  { id: 'db_row', nameEN: 'Dumbbell Row', nameZH: '哑铃划船', primaryMuscles: ['lats', 'back'], secondaryMuscles: ['biceps', 'rear_delts'], equipment: 'dumbbell', strengthReps: [6,8], hypertrophyReps: [8,15] },
  { id: 'pullup', nameEN: 'Pull-Up', nameZH: '引体向上', primaryMuscles: ['lats', 'back'], secondaryMuscles: ['biceps'], equipment: 'bodyweight', strengthReps: [3,6], hypertrophyReps: [6,12] },
  { id: 'lat_pulldown', nameEN: 'Lat Pulldown', nameZH: '高位下拉', primaryMuscles: ['lats'], secondaryMuscles: ['biceps'], equipment: 'cable', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'cable_row', nameEN: 'Cable Row', nameZH: '坐姿绳索划船', primaryMuscles: ['back', 'lats'], secondaryMuscles: ['biceps'], equipment: 'cable', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 't_bar_row', nameEN: 'T-Bar Row', nameZH: 'T杠划船', primaryMuscles: ['back', 'lats'], secondaryMuscles: ['biceps', 'rear_delts'], equipment: 'barbell', strengthReps: [6,8], hypertrophyReps: [8,12] },
  { id: 'chinup', nameEN: 'Chin-Up', nameZH: '反手引体向上', primaryMuscles: ['lats', 'biceps'], secondaryMuscles: ['back'], equipment: 'bodyweight', strengthReps: [3,6], hypertrophyReps: [6,12] },
  { id: 'pendlay_row', nameEN: 'Pendlay Row', nameZH: '彭德雷划船', primaryMuscles: ['back', 'lats'], secondaryMuscles: ['biceps', 'rear_delts'], equipment: 'barbell', strengthReps: [3,6], hypertrophyReps: [6,10] },
  { id: 'chest_supported_row', nameEN: 'Chest-Supported Row', nameZH: '胸靠划船', primaryMuscles: ['back', 'lats'], secondaryMuscles: ['rear_delts'], equipment: 'dumbbell', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'machine_row', nameEN: 'Machine Row', nameZH: '机器划船', primaryMuscles: ['back', 'lats'], secondaryMuscles: ['biceps'], equipment: 'machine', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'straight_arm_pulldown', nameEN: 'Straight-Arm Pulldown', nameZH: '直臂下压', primaryMuscles: ['lats'], secondaryMuscles: ['core'], equipment: 'cable', strengthReps: [10,12], hypertrophyReps: [12,20] },

  // ── Shoulders ──
  { id: 'ohp', nameEN: 'Overhead Press', nameZH: '杠铃推举', primaryMuscles: ['front_delts'], secondaryMuscles: ['triceps', 'side_delts'], equipment: 'barbell', strengthReps: [3,6], hypertrophyReps: [6,10] },
  { id: 'db_ohp', nameEN: 'Dumbbell Shoulder Press', nameZH: '哑铃推举', primaryMuscles: ['front_delts', 'side_delts'], secondaryMuscles: ['triceps'], equipment: 'dumbbell', strengthReps: [6,8], hypertrophyReps: [8,12] },
  { id: 'lateral_raise', nameEN: 'Lateral Raise', nameZH: '哑铃侧平举', primaryMuscles: ['side_delts'], secondaryMuscles: [], equipment: 'dumbbell', strengthReps: [10,12], hypertrophyReps: [12,20] },
  { id: 'cable_lateral', nameEN: 'Cable Lateral Raise', nameZH: '绳索侧平举', primaryMuscles: ['side_delts'], secondaryMuscles: [], equipment: 'cable', strengthReps: [10,12], hypertrophyReps: [12,20] },
  { id: 'face_pull', nameEN: 'Face Pull', nameZH: '面拉', primaryMuscles: ['rear_delts', 'rotator_cuff'], secondaryMuscles: ['traps'], equipment: 'cable', strengthReps: [12,15], hypertrophyReps: [15,25] },
  { id: 'rear_delt_fly', nameEN: 'Rear Delt Fly', nameZH: '俯身飞鸟', primaryMuscles: ['rear_delts'], secondaryMuscles: [], equipment: 'dumbbell', strengthReps: [12,15], hypertrophyReps: [15,20] },
  { id: 'arnold_press', nameEN: 'Arnold Press', nameZH: '阿诺德推举', primaryMuscles: ['front_delts', 'side_delts'], secondaryMuscles: ['triceps'], equipment: 'dumbbell', strengthReps: [6,8], hypertrophyReps: [8,12] },
  { id: 'front_raise', nameEN: 'Front Raise', nameZH: '前平举', primaryMuscles: ['front_delts'], secondaryMuscles: [], equipment: 'dumbbell', strengthReps: [10,12], hypertrophyReps: [12,20] },
  { id: 'upright_row', nameEN: 'Upright Row', nameZH: '直立划船', primaryMuscles: ['side_delts', 'traps'], secondaryMuscles: ['front_delts'], equipment: 'barbell', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'reverse_pec_deck', nameEN: 'Reverse Pec Deck', nameZH: '反向蝴蝶机', primaryMuscles: ['rear_delts'], secondaryMuscles: ['traps', 'rotator_cuff'], equipment: 'machine', strengthReps: [10,12], hypertrophyReps: [15,20] },
  { id: 'machine_shoulder_press', nameEN: 'Machine Shoulder Press', nameZH: '机器推肩', primaryMuscles: ['front_delts', 'side_delts'], secondaryMuscles: ['triceps'], equipment: 'machine', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'db_shrug', nameEN: 'Dumbbell Shrug', nameZH: '哑铃耸肩', primaryMuscles: ['traps'], secondaryMuscles: [], equipment: 'dumbbell', strengthReps: [8,10], hypertrophyReps: [12,15] },

  // ── Arms ──
  { id: 'barbell_curl', nameEN: 'Barbell Curl', nameZH: '杠铃弯举', primaryMuscles: ['biceps'], secondaryMuscles: [], equipment: 'barbell', strengthReps: [6,8], hypertrophyReps: [8,12] },
  { id: 'db_curl', nameEN: 'Dumbbell Curl', nameZH: '哑铃弯举', primaryMuscles: ['biceps'], secondaryMuscles: [], equipment: 'dumbbell', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'hammer_curl', nameEN: 'Hammer Curl', nameZH: '锤式弯举', primaryMuscles: ['biceps', 'forearms'], secondaryMuscles: [], equipment: 'dumbbell', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'preacher_curl', nameEN: 'Preacher Curl', nameZH: '牧师椅弯举', primaryMuscles: ['biceps'], secondaryMuscles: [], equipment: 'barbell', strengthReps: [6,8], hypertrophyReps: [10,15] },
  { id: 'cable_curl', nameEN: 'Cable Curl', nameZH: '绳索弯举', primaryMuscles: ['biceps'], secondaryMuscles: [], equipment: 'cable', strengthReps: [8,10], hypertrophyReps: [12,20] },
  { id: 'concentration_curl', nameEN: 'Concentration Curl', nameZH: '集中弯举', primaryMuscles: ['biceps'], secondaryMuscles: [], equipment: 'dumbbell', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'incline_curl', nameEN: 'Incline Dumbbell Curl', nameZH: '上斜弯举', primaryMuscles: ['biceps'], secondaryMuscles: [], equipment: 'dumbbell', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'spider_curl', nameEN: 'Spider Curl', nameZH: '蜘蛛弯举', primaryMuscles: ['biceps'], secondaryMuscles: [], equipment: 'dumbbell', strengthReps: [8,10], hypertrophyReps: [10,15] },
  { id: 'tricep_pushdown', nameEN: 'Tricep Pushdown', nameZH: '三头下压', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: 'cable', strengthReps: [8,10], hypertrophyReps: [12,20] },
  { id: 'overhead_extension', nameEN: 'Overhead Tricep Extension', nameZH: '过头臂屈伸', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: 'cable', strengthReps: [8,10], hypertrophyReps: [12,20] },
  { id: 'skull_crusher', nameEN: 'Skull Crusher', nameZH: '仰卧臂屈伸', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: 'barbell', strengthReps: [6,8], hypertrophyReps: [10,15] },
  { id: 'close_grip_bench', nameEN: 'Close-Grip Bench Press', nameZH: '窄距卧推', primaryMuscles: ['triceps', 'chest'], secondaryMuscles: ['front_delts'], equipment: 'barbell', strengthReps: [5,8], hypertrophyReps: [8,12] },
  { id: 'tricep_kickback', nameEN: 'Tricep Kickback', nameZH: '三头回弹', primaryMuscles: ['triceps'], secondaryMuscles: [], equipment: 'dumbbell', strengthReps: [10,12], hypertrophyReps: [12,20] },
  { id: 'reverse_curl', nameEN: 'Reverse Curl', nameZH: '反握弯举', primaryMuscles: ['forearms', 'biceps'], secondaryMuscles: [], equipment: 'barbell', strengthReps: [8,10], hypertrophyReps: [12,15] },
  { id: 'wrist_curl', nameEN: 'Wrist Curl', nameZH: '腕弯举', primaryMuscles: ['forearms'], secondaryMuscles: [], equipment: 'barbell', strengthReps: [10,12], hypertrophyReps: [15,25] },
  { id: 'farmer_walk', nameEN: "Farmer's Walk", nameZH: '农夫行走', primaryMuscles: ['forearms', 'traps'], secondaryMuscles: ['core'], equipment: 'dumbbell', strengthReps: [30,60], hypertrophyReps: [30,60] },

  // ── Core ──
  { id: 'cable_crunch', nameEN: 'Cable Crunch', nameZH: '绳索卷腹', primaryMuscles: ['core'], secondaryMuscles: [], equipment: 'cable', strengthReps: [10,12], hypertrophyReps: [15,25] },
  { id: 'hanging_leg_raise', nameEN: 'Hanging Leg Raise', nameZH: '悬垂举腿', primaryMuscles: ['core'], secondaryMuscles: ['hip_flexors'], equipment: 'bodyweight', strengthReps: [6,10], hypertrophyReps: [10,20] },
  { id: 'ab_wheel', nameEN: 'Ab Wheel Rollout', nameZH: '健腹轮', primaryMuscles: ['core'], secondaryMuscles: [], equipment: 'bodyweight', strengthReps: [6,8], hypertrophyReps: [8,15] },
  { id: 'russian_twist', nameEN: 'Russian Twist', nameZH: '俄罗斯转体', primaryMuscles: ['core'], secondaryMuscles: ['obliques'], equipment: 'bodyweight', strengthReps: [10,15], hypertrophyReps: [15,25] },
  { id: 'pallof_press', nameEN: 'Pallof Press', nameZH: '帕洛夫推', primaryMuscles: ['core'], secondaryMuscles: ['obliques'], equipment: 'cable', strengthReps: [10,12], hypertrophyReps: [12,15] },
  { id: 'dragon_flag', nameEN: 'Dragon Flag', nameZH: '龙旗', primaryMuscles: ['core'], secondaryMuscles: [], equipment: 'bodyweight', strengthReps: [3,5], hypertrophyReps: [5,10] },
];

const TEMPLATES = [
  { id: 'tpl_push_a', name: 'Push A', planId: 'plan_ppl', planOrder: 0, exerciseEntries: [
    { exerciseId: 'bench_press', sets: 4, order: 0 },
    { exerciseId: 'db_incline_bench', sets: 3, order: 1 },
    { exerciseId: 'cable_fly', sets: 3, order: 2 },
    { exerciseId: 'ohp', sets: 3, order: 3 },
    { exerciseId: 'lateral_raise', sets: 4, order: 4 },
    { exerciseId: 'tricep_pushdown', sets: 3, order: 5 },
  ]},
  { id: 'tpl_pull_a', name: 'Pull A', planId: 'plan_ppl', planOrder: 1, exerciseEntries: [
    { exerciseId: 'pullup', sets: 4, order: 0 },
    { exerciseId: 'barbell_row', sets: 3, order: 1 },
    { exerciseId: 'cable_row', sets: 3, order: 2 },
    { exerciseId: 'face_pull', sets: 3, order: 3 },
    { exerciseId: 'barbell_curl', sets: 3, order: 4 },
    { exerciseId: 'hammer_curl', sets: 3, order: 5 },
  ]},
  { id: 'tpl_legs', name: 'Legs', planId: 'plan_ppl', planOrder: 2, exerciseEntries: [
    { exerciseId: 'squat', sets: 4, order: 0 },
    { exerciseId: 'rdl', sets: 3, order: 1 },
    { exerciseId: 'leg_press', sets: 3, order: 2 },
    { exerciseId: 'leg_curl', sets: 3, order: 3 },
    { exerciseId: 'calf_raise', sets: 4, order: 4 },
    { exerciseId: 'cable_crunch', sets: 3, order: 5 },
  ]},
  { id: 'tpl_push_b', name: 'Push B', planId: 'plan_ppl', planOrder: 3, exerciseEntries: [
    { exerciseId: 'incline_bench', sets: 4, order: 0 },
    { exerciseId: 'db_bench', sets: 3, order: 1 },
    { exerciseId: 'pec_deck', sets: 3, order: 2 },
    { exerciseId: 'db_ohp', sets: 3, order: 3 },
    { exerciseId: 'cable_lateral', sets: 4, order: 4 },
    { exerciseId: 'skull_crusher', sets: 3, order: 5 },
  ]},
  { id: 'tpl_pull_b', name: 'Pull B', planId: 'plan_ppl', planOrder: 4, exerciseEntries: [
    { exerciseId: 'lat_pulldown', sets: 3, order: 0 },
    { exerciseId: 'db_row', sets: 3, order: 1 },
    { exerciseId: 'rear_delt_fly', sets: 3, order: 2 },
    { exerciseId: 'db_curl', sets: 3, order: 3 },
    { exerciseId: 'preacher_curl', sets: 3, order: 4 },
  ]},
];

export async function seedDatabase() {
  const count = await db.exercises.count();
  if (count > 0) return; // Already seeded

  // Seed exercises
  await db.exercises.bulkAdd(EXERCISES);

  // Seed PPL plan
  await db.trainingPlans.add({ id: 'plan_ppl', name: 'PPL Split', order: 0 });

  // Seed templates
  await db.workoutTemplates.bulkAdd(TEMPLATES);

  console.log('[Barpath] Seeded 75 exercises + 5 PPL templates');
}
