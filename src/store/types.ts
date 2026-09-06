export type Habit = { id: string; name: string };

export type WorkoutExercise = { id: string; name: string; target: string; weight: number };
export type WorkoutDayPlan = { title: string; exercises: WorkoutExercise[] };

export type Goal = {
  id: string;
  name: string;
  icon: string;
  target: number;
  saved: number;
  deadline: string;
};

export type FinanceActivity = {
  id: string;
  goalId: string;
  goalName: string;
  goalIcon: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  date: string;
};

export type SleepEntry = { bed: string; wake: string };

export type BodyWeightEntry = { id: string; date: string; weight: number };

export type CharacterClass = 'guerreiro' | 'ranger' | 'monge' | 'alquimista';

export type LifeQuestState = {
  habits: Habit[];
  habitHistory: Record<string, string[]>;
  waterLog: Record<string, number>;
  sleepLog: Record<string, SleepEntry>;
  workoutPlan: Record<string, WorkoutDayPlan>;
  workoutLog: Record<string, Record<string, boolean>>;
  bodyWeightLog: BodyWeightEntry[];
  goals: Goal[];
  financeActivity: FinanceActivity[];
  profile: { name: string; avatar: string; createdAt: string };
  stats: { bestStreak: number };
  character: {
    classe: CharacterClass | null;
    afinidade: CharacterClass | null;
    xpGeral: number;
    xp: { forca: number; vitalidade: number; riqueza: number; foco: number };
    goalsCompleted: Record<string, boolean>;
    dayFlags: Record<string, { water?: boolean; sleep?: boolean; diaPerfeito?: boolean }>;
  };
  workoutTimer: { date: string | null; accumulatedSeconds: number; runningSince: number | null };
  workoutDurations: Record<string, number>;
};

export const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;
export const WEEKDAY_FULL = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
] as const;
