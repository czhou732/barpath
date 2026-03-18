// Barpath Database — Dexie.js (IndexedDB wrapper)
// Ported from Models.swift (SwiftData)

import Dexie from 'dexie';

export const db = new Dexie('BarPathDB');

db.version(1).stores({
  exercises:        'id, nameEN, equipment',
  workoutSessions:  '++id, date, templateId, isActive',
  workoutExercises: '++id, sessionId, exerciseId, order',
  workoutSets:      '++id, exerciseId, order',
  trainingPlans:    'id, order',
  workoutTemplates: 'id, planId, planOrder',
});

db.version(2).stores({
  exercises:        'id, nameEN, equipment',
  workoutSessions:  '++id, date, templateId, isActive',
  workoutExercises: '++id, sessionId, exerciseId, order',
  workoutSets:      '++id, exerciseId, order',
  trainingPlans:    'id, order',
  workoutTemplates: 'id, planId, planOrder',
  healthRecords:    'id',
});

// ── Helper Functions ──

/** Get all exercises */
export async function getExercises() {
  return db.exercises.toArray();
}

/** Get exercise by ID */
export async function getExercise(id) {
  return db.exercises.get(id);
}

/** Get active workout (if any) */
export async function getActiveWorkout() {
  return db.workoutSessions.where('isActive').equals(1).first();
}

/** Get workout exercises for a session */
export async function getWorkoutExercises(sessionId) {
  return db.workoutExercises.where('sessionId').equals(sessionId).sortBy('order');
}

/** Get sets for a workout exercise */
export async function getSets(exerciseId) {
  return db.workoutSets.where('exerciseId').equals(exerciseId).sortBy('order');
}

/** Start a new workout session */
export async function startWorkout(label = 'Workout', templateId = null) {
  const now = new Date();
  const id = await db.workoutSessions.add({
    date: now.toISOString(),
    startTime: now.toISOString(),
    endTime: null,
    label,
    templateId,
    notes: '',
    isActive: 1,
    sessionRPE: 0,
    sessionMood: '',
    sessionNotes: '',
  });

  // If starting from template, populate exercises
  if (templateId) {
    const template = await db.workoutTemplates.get(templateId);
    if (template?.exerciseEntries) {
      for (const entry of template.exerciseEntries) {
        const exercise = await db.exercises.get(entry.exerciseId);
        const wExId = await db.workoutExercises.add({
          sessionId: id,
          exerciseId: entry.exerciseId,
          name: exercise?.nameEN || entry.exerciseId,
          order: entry.order,
        });
        // Create empty sets
        for (let i = 0; i < entry.sets; i++) {
          await db.workoutSets.add({
            exerciseId: wExId,
            order: i,
            weight: 0,
            reps: 0,
            rpe: 0,
            isDone: 0,
          });
        }
      }
    }
  }
  return id;
}

/** Add an exercise to an active workout */
export async function addExerciseToWorkout(sessionId, exerciseId, setsCount = 3) {
  const exercise = await db.exercises.get(exerciseId);
  const existing = await db.workoutExercises.where('sessionId').equals(sessionId).toArray();
  const order = existing.length;

  const wExId = await db.workoutExercises.add({
    sessionId,
    exerciseId,
    name: exercise?.nameEN || exerciseId,
    order,
  });

  for (let i = 0; i < setsCount; i++) {
    await db.workoutSets.add({
      exerciseId: wExId,
      order: i,
      weight: 0,
      reps: 0,
      rpe: 0,
      isDone: 0,
    });
  }
  return wExId;
}

/** Add a set to a workout exercise */
export async function addSet(workoutExerciseId) {
  const existing = await db.workoutSets.where('exerciseId').equals(workoutExerciseId).toArray();
  return db.workoutSets.add({
    exerciseId: workoutExerciseId,
    order: existing.length,
    weight: 0,
    reps: 0,
    rpe: 0,
    isDone: 0,
  });
}

/** Update a set */
export async function updateSet(setId, data) {
  return db.workoutSets.update(setId, data);
}

/** Toggle set done */
export async function toggleSetDone(setId) {
  const set = await db.workoutSets.get(setId);
  return db.workoutSets.update(setId, { isDone: set.isDone ? 0 : 1 });
}

/** Finish a workout */
export async function finishWorkout(sessionId, rpe = 0, mood = '', notes = '') {
  return db.workoutSessions.update(sessionId, {
    isActive: 0,
    endTime: new Date().toISOString(),
    sessionRPE: rpe,
    sessionMood: mood,
    sessionNotes: notes,
  });
}

/** Delete a workout and its exercises/sets */
export async function deleteWorkout(sessionId) {
  const exercises = await db.workoutExercises.where('sessionId').equals(sessionId).toArray();
  for (const ex of exercises) {
    await db.workoutSets.where('exerciseId').equals(ex.id).delete();
  }
  await db.workoutExercises.where('sessionId').equals(sessionId).delete();
  await db.workoutSessions.delete(sessionId);
}

/** Get past workouts (most recent first) */
export async function getPastWorkouts(limit = 50) {
  return db.workoutSessions
    .where('isActive').equals(0)
    .reverse()
    .sortBy('date')
    .then(arr => arr.slice(0, limit));
}

/** Get full workout detail with exercises and sets */
export async function getWorkoutDetail(sessionId) {
  const session = await db.workoutSessions.get(sessionId);
  const exercises = await getWorkoutExercises(sessionId);
  const detailed = await Promise.all(exercises.map(async ex => {
    const sets = await getSets(ex.id);
    const exercise = await db.exercises.get(ex.exerciseId);
    return { ...ex, sets, exercise };
  }));
  return { ...session, exercises: detailed };
}

/** Compute total volume for a session */
export async function getSessionVolume(sessionId) {
  const exercises = await getWorkoutExercises(sessionId);
  let total = 0;
  for (const ex of exercises) {
    const sets = await getSets(ex.id);
    for (const s of sets) {
      if (s.isDone) total += s.weight * s.reps;
    }
  }
  return total;
}

/** Get all templates grouped by plan */
export async function getTemplates() {
  const plans = await db.trainingPlans.orderBy('order').toArray();
  const templates = await db.workoutTemplates.toArray();
  return plans.map(plan => ({
    ...plan,
    templates: templates
      .filter(t => t.planId === plan.id)
      .sort((a, b) => a.planOrder - b.planOrder),
  }));
}

/** Get all templates flat */
export async function getAllTemplates() {
  return db.workoutTemplates.toArray();
}
