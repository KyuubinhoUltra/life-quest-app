import { EXERCICIOS } from '@/engines/treino-engine';

import { TreinoMissaoExercicio, WEEKDAYS, WorkoutDayPlan } from './types';

// O gerador monta de 2 a 6 treinos por semana.
export const MIN_DIAS_TREINO = 2;
export const MAX_DIAS_TREINO = 6;

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
