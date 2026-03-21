export type WorkoutType = 'Push' | 'Pull' | 'Legs' | 'Rest';
export type DayType = 'Strength' | 'Volume';

export interface ExercisePlan {
  name: string;
  sets: number;
  reps: string; // e.g. "5", "8-10", "max"
  startWeight?: number;
  progression?: string;
  levelGoal?: string;
  note?: string;
}

export interface WorkoutDayPlan {
  type: WorkoutType;
  dayType: DayType;
  exercises: ExercisePlan[];
}

export interface WorkoutPlan {
  id?: string;
  uid: string;
  name: string;
  days: {
    [dayNumber: number]: WorkoutDayPlan; // 1-7
  };
  isActive: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  height?: number;
  goalWeight?: number;
  currentWeight?: number;
  streak: number;
  xp: number;
  level: number;
  lastWorkoutDate?: string;
  activePlanId?: string;
  lastSessionDate?: string;
  lastSessionDay?: number;
}

export interface Set {
  weight: number;
  reps: number;
}

export interface ExerciseLog {
  id?: string;
  uid: string;
  workoutId?: string;
  exerciseName: string;
  date: string;
  sets: Set[];
  level: number;
  progression: 'LEVEL UP' | 'PROGRESS' | 'STAGNANT' | 'REGRESSION';
}

export interface Workout {
  id?: string;
  uid: string;
  date: string;
  type: WorkoutType;
  duration: number;
  volume: number;
}

export interface BodyMetric {
  id?: string;
  uid: string;
  date: string;
  weight: number;
  chest?: number;
  arms?: number;
  waist?: number;
}
