import { GrupoMuscular, gruposDoTreino } from '@/mapa-muscular/bodyMap';
import { LifeQuestState } from '@/store/types';

export type ResumoTreino = {
  titulo: string;
  exercicios: number;
  volumeKg: number;
  duracaoSeg: number;
  principais: GrupoMuscular[];
  secundarios: GrupoMuscular[];
};

// Resume o que foi concluído hoje no plano semanal: exercícios marcados, volume
// (séries × reps × carga, só quando o alvo é "NxM" e há carga) e músculos.
export function resumirTreinoDeHoje(state: LifeQuestState, today: string, weekdayKey: string): ResumoTreino {
  const plan = state.workoutPlan[weekdayKey];
  const log = state.workoutLog[today] || {};
  const feitos = plan?.exercises.filter((e) => log[e.id]) ?? [];

  let volumeKg = 0;
  for (const e of feitos) {
    if (e.cat === 'Cardio' || !(e.weight > 0)) continue;
    const m = /^(\d+)\s*x\s*(\d+)(?:\s*·.*)?$/i.exec(e.target.trim());
    if (m) volumeKg += Number(m[1]) * Number(m[2]) * e.weight;
  }

  const { principais, secundarios } = gruposDoTreino(feitos.map((e) => ({ grupo: e.cat })));

  return {
    titulo: plan?.title || 'Treino',
    exercicios: feitos.length,
    volumeKg: Math.round(volumeKg),
    duracaoSeg: state.workoutDurations[today] || 0,
    principais,
    secundarios,
  };
}

export function fmtDuracaoCurta(seg: number): string {
  if (seg <= 0) return '—';
  const min = Math.round(seg / 60);
  if (min < 60) return `${Math.max(1, min)}min`;
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
}
