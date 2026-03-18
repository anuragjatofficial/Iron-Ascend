import { WorkoutType, WorkoutPlan, WorkoutDayPlan } from './types';

export const EXERCISES: Record<string, string[]> = {
  Push: [
    'Bench Press',
    'Incline DB Press',
    'Overhead Press',
    'Lateral Raise',
    'Triceps Pushdown'
  ],
  Pull: [
    'Deadlift',
    'Pullups',
    'Barbell Row',
    'Lat Pulldown',
    'Bicep Curl'
  ],
  Legs: [
    'Squat',
    'Leg Press',
    'Romanian Deadlift',
    'Hamstring Curl',
    'Calf Raises'
  ]
};

export const DEFAULT_PLAN: Omit<WorkoutPlan, 'uid'> = {
  name: "PPL_EXTREME_V1",
  isActive: true,
  days: {
    1: {
      type: 'Push',
      dayType: 'Strength',
      exercises: [
        { name: 'Bench Press', sets: 5, reps: '5', startWeight: 60, progression: '+2.5kg/week', levelGoal: '80x5' },
        { name: 'Incline DB Press', sets: 4, reps: '8', startWeight: 25, progression: '+1-2 reps -> 30kg', levelGoal: '30x8' },
        { name: 'Overhead Press', sets: 4, reps: '6-8', startWeight: 22, progression: 'reps -> weight', levelGoal: '30x6' },
        { name: 'Weighted Dips', sets: 4, reps: '6-8', startWeight: 0, progression: 'add weight', levelGoal: '+20kg' },
        { name: 'Lateral Raise', sets: 5, reps: '12-15', startWeight: 7, progression: 'strict form', note: 'no swinging' },
        { name: 'Tricep Pushdown', sets: 3, reps: '10-12', startWeight: 20, progression: 'plate increase' }
      ]
    },
    2: {
      type: 'Pull',
      dayType: 'Strength',
      exercises: [
        { name: 'Deadlift', sets: 5, reps: '3', startWeight: 90, progression: '+5kg/week', levelGoal: '120x3' },
        { name: 'Pullups', sets: 4, reps: 'max', progression: 'reps -> weight', levelGoal: '15 reps' },
        { name: 'Barbell Row', sets: 4, reps: '8', startWeight: 60, progression: '+2.5kg', levelGoal: '80x8' },
        { name: 'Lat Pulldown', sets: 3, reps: '10', progression: '+1 plate' },
        { name: 'Face Pull', sets: 3, reps: '15' },
        { name: 'Barbell Curl', sets: 4, reps: '8' },
        { name: 'Hammer Curl', sets: 3, reps: '10' }
      ]
    },
    3: {
      type: 'Legs',
      dayType: 'Strength',
      exercises: [
        { name: 'Squat', sets: 5, reps: '5', startWeight: 75, progression: '+2.5kg/week', levelGoal: '100x5' },
        { name: 'Romanian Deadlift', sets: 4, reps: '8', startWeight: 50, progression: '+5kg' },
        { name: 'Leg Press', sets: 4, reps: '10', startWeight: 150, progression: '+10kg' },
        { name: 'Hamstring Curl', sets: 3, reps: '12' },
        { name: 'Calf Raises', sets: 5, reps: '15-20' }
      ]
    },
    4: {
      type: 'Push',
      dayType: 'Volume',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: '8' },
        { name: 'Incline DB Press', sets: 4, reps: '10' },
        { name: 'Machine Chest Press', sets: 3, reps: '12' },
        { name: 'Cable Fly', sets: 3, reps: '15' },
        { name: 'Lateral Raise', sets: 5, reps: '15' },
        { name: 'Triceps (any)', sets: 4, reps: '12' }
      ]
    },
    5: {
      type: 'Pull',
      dayType: 'Volume',
      exercises: [
        { name: 'Pullups', sets: 4, reps: 'max' },
        { name: 'Cable Row', sets: 4, reps: '10' },
        { name: 'Lat Pulldown', sets: 3, reps: '12' },
        { name: 'Face Pull', sets: 3, reps: '15' },
        { name: 'Bicep Curl', sets: 4, reps: '12' },
        { name: 'Hammer Curl', sets: 3, reps: '12' }
      ]
    },
    6: {
      type: 'Legs',
      dayType: 'Volume',
      exercises: [
        { name: 'Squat', sets: 4, reps: '8' },
        { name: 'Leg Press', sets: 4, reps: '12' },
        { name: 'Romanian Deadlift', sets: 3, reps: '10' },
        { name: 'Lunges', sets: 3, reps: '12 each leg' },
        { name: 'Hamstring Curl', sets: 3, reps: '12' },
        { name: 'Calf Raises', sets: 5, reps: '20' }
      ]
    },
    7: {
      type: 'Rest',
      dayType: 'Volume',
      exercises: []
    }
  }
};

// Leveling logic: Each exercise has levels based on 1RM or weight x reps
// For simplicity, we'll define levels based on a weight threshold for 5 reps
export const EXERCISE_LEVELS: Record<string, number[]> = {
  'Bench Press': [40, 60, 80, 100, 120, 140],
  'Deadlift': [60, 100, 140, 180, 220, 260],
  'Squat': [50, 80, 110, 140, 170, 200],
  'Incline DB Press': [15, 25, 35, 45, 55],
  'Overhead Press': [30, 45, 60, 75, 90],
  'Lateral Raise': [5, 10, 15, 20, 25],
  'Triceps Pushdown': [10, 20, 30, 40, 50],
  'Pullups': [0, 10, 20, 30, 40], // Added weight
  'Barbell Row': [40, 60, 80, 100, 120],
  'Lat Pulldown': [30, 50, 70, 90, 110],
  'Bicep Curl': [10, 20, 30, 40, 50],
  'Leg Press': [100, 200, 300, 400, 500],
  'Romanian Deadlift': [40, 70, 100, 130, 160],
  'Hamstring Curl': [20, 40, 60, 80, 100],
  'Calf Raises': [30, 60, 90, 120, 150]
};

export const getLevel = (exercise: string, weight: number): number => {
  const levels = EXERCISE_LEVELS[exercise] || [];
  let currentLevel = 0;
  for (let i = 0; i < levels.length; i++) {
    if (weight >= levels[i]) {
      currentLevel = i + 1;
    } else {
      break;
    }
  }
  return currentLevel;
};
