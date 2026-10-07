import { EXERCICIOS } from '@/engines/treino-engine';

import { TreinoMissaoExercicio, WEEKDAYS, WorkoutDayPlan } from './types';

// Em que dias da semana (índices de WEEKDAYS) cada quantidade de treinos cai.
export const DIAS_DO_PLANO: Record<number, number[]> = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
};

// categoria do engine -> nome de categoria usado no Plano semanal
const CAT_DO_PLANO: Record<string, string> = {
  peito: 'Peito',
  costas: 'Costas',
  pernas: 'Pernas',
  panturrilha: 'Panturrilha',
  ombros: 'Ombro',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  core: 'Abdômen',
  cardio: 'Cardio',
  mobilidade: 'Mobilidade',
};

export function planoVazio(): Record<string, WorkoutDayPlan> {
  const plano: Record<string, WorkoutDayPlan> = {};
  WEEKDAYS.forEach((wd) => (plano[wd] = { title: 'Descanso', exercises: [] }));
  return plano;
}

export function diaDoPlano(titulo: string, exercicios: TreinoMissaoExercicio[]): WorkoutDayPlan {
  return {
    title: titulo,
    exercises: exercicios.map((ex) => {
      const categoria = EXERCICIOS.find((e) => e.nome === ex.nome)?.categoria;
      return {
        id: Math.random().toString(36).slice(2, 9),
        name: ex.nome,
        target: `${ex.series}x${ex.repeticoes} · ${ex.descanso}`,
        weight: 0,
        cat: categoria ? CAT_DO_PLANO[categoria] : undefined,
      };
    }),
  };
}
