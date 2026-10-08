export type Habit = { id: string; name: string };

export type WorkoutExercise = { id: string; name: string; target: string; weight: number; cat?: string };
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

// Ações da Comunidade/compartilhamento acontecem fora do estado local (Supabase,
// menu nativo), então contamos aqui pra alimentar as conquistas.
export type Counters = { posts: number; shares: number; follows: number; clubs: number };
// id da conquista -> data (YYYY-MM-DD) em que foi desbloqueada
export type AchievementsState = { unlocked: Record<string, string> };

// ---- Forja de Treinos (treino gerado) ----
export type TreinoMissaoExercicio = { nome: string; series: number; repeticoes: string; descanso: string };
export type TreinoMissaoResultado = {
  missao: string;
  narrativa: string;
  exercicios: TreinoMissaoExercicio[];
  xp: number;
  dica_progressao: string;
};
export type TreinoMissaoDia = {
  label: string;
  cat: string[];
  tipo: string;
  /** dia do Plano semanal onde esse treino foi colocado (ex.: 'Seg') */
  weekday?: string;
  resultado: TreinoMissaoResultado | null;
  error: string | null;
};
export type TreinoMissaoConfig = {
  classe: 'guerreiro' | 'ranger' | 'monge' | null;
  foco: string | null;
  diasSemana: string[];
  equipamento: string | null;
  nivel: string | null;
  gruposExcluidos: string[];
};

// ---- Cozinha do Alquimista (dieta gerada) ----
export type DietaSexo = 'masculino' | 'feminino' | 'neutro';
export type DietaAtividade = 'sedentario' | 'leve' | 'moderado' | 'ativo';
export type DietaObjetivo = 'perder' | 'manter' | 'ganhar';
export type DietaRestricao = 'vegetariano' | 'vegano' | 'sem_lactose' | 'sem_gluten';

export type DietaPerfil = {
  altura: number | null;
  idade: number | null;
  sexo: DietaSexo | null;
  atividade: DietaAtividade | null;
};
export type DietaConfig = {
  objetivo: DietaObjetivo | null;
  restricoes: DietaRestricao[];
  refeicoesPorDia: number | null;
};
export type DietaRefeicao = {
  slot: string;
  nome: string;
  porcao: string;
  calorias: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
};
export type DietaDiaResultado = {
  titulo: string;
  narrativa: string;
  dica: string;
  refeicoes: DietaRefeicao[];
  caloriasTotais: number;
  proteinaTotal: number;
  carboTotal: number;
  gorduraTotal: number;
  metaCalorica: number;
  xp: number;
};
export type DietaDiaSlot = { slot: string; tipoPool: string; pct: number };
export type DietaDia = {
  diaLabel: string;
  slots: DietaDiaSlot[];
  resultado: DietaDiaResultado | null;
  error: string | null;
};

// Pensado pra futura câmera de calorias: entradas manuais (do cardápio gerado)
// e, mais adiante, entradas fotografadas caem no mesmo formato aqui.
export type NutritionLogEntry = {
  slot: string;
  nome: string;
  calorias: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  registradoEm: string;
  origem: 'plano' | 'camera';
};

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
  profile: { name: string; avatar: string; createdAt: string; bonecoSexo?: 'homem' | 'mulher' };
  stats: { bestStreak: number };
  character: {
    classe: CharacterClass | null;
    afinidade: CharacterClass | null;
    xpGeral: number;
    xp: { forca: number; vitalidade: number; riqueza: number; foco: number };
    goalsCompleted: Record<string, boolean>;
    dayFlags: Record<string, { water?: boolean; sleep?: boolean; diaPerfeito?: boolean }>;
    /** maior nível da conta já comemorado (evita repetir a festa ao perder e recuperar XP) */
    highestLevel?: number;
  };
  workoutTimer: { date: string | null; accumulatedSeconds: number; runningSince: number | null };
  workoutDurations: Record<string, number>;
  dailyMissionsClaimed: Record<string, string[]>;
  treinoMissaoConfig: TreinoMissaoConfig;
  treinoMissaoSemana: TreinoMissaoDia[];
  dietaPerfil: DietaPerfil;
  dietaConfig: DietaConfig;
  dietaSemana: DietaDia[];
  dietaUsadasNaSemana: string[];
  nutritionLog: Record<string, NutritionLogEntry[]>;
  counters: Counters;
  achievements: AchievementsState;
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
