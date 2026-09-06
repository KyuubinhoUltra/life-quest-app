export type MissionCheck = 'water' | 'sleep' | 'workout' | 'habits' | 'goalDeposit';
export type MissionAttr = 'forca' | 'vitalidade' | 'riqueza' | 'foco';

export type MissionDef = {
  id: string;
  label: string;
  xp: number;
  attr: MissionAttr;
  check: MissionCheck;
};

// 3 missões por dia da semana, variando o foco (água/sono/treino/hábitos/metas)
// para condizer com o plano de treino padrão (Domingo é dia de descanso, por isso
// não tem missão de treino nesse dia).
export const WEEKLY_MISSIONS: Record<string, MissionDef[]> = {
  Seg: [
    { id: 'seg-water', label: 'Beba toda a água do dia', xp: 15, attr: 'vitalidade', check: 'water' },
    { id: 'seg-workout', label: 'Complete o treino de hoje', xp: 20, attr: 'forca', check: 'workout' },
    { id: 'seg-habits', label: 'Conclua todas as missões da rotina', xp: 15, attr: 'foco', check: 'habits' },
  ],
  Ter: [
    { id: 'ter-sleep', label: 'Durma o recomendado', xp: 15, attr: 'vitalidade', check: 'sleep' },
    { id: 'ter-workout', label: 'Complete o treino de hoje', xp: 20, attr: 'forca', check: 'workout' },
    { id: 'ter-habits', label: 'Conclua todas as missões da rotina', xp: 15, attr: 'foco', check: 'habits' },
  ],
  Qua: [
    { id: 'qua-water', label: 'Beba toda a água do dia', xp: 15, attr: 'vitalidade', check: 'water' },
    { id: 'qua-workout', label: 'Complete a atividade de hoje', xp: 20, attr: 'forca', check: 'workout' },
    { id: 'qua-habits', label: 'Conclua todas as missões da rotina', xp: 15, attr: 'foco', check: 'habits' },
  ],
  Qui: [
    { id: 'qui-water', label: 'Beba toda a água do dia', xp: 15, attr: 'vitalidade', check: 'water' },
    { id: 'qui-workout', label: 'Complete o treino de hoje', xp: 20, attr: 'forca', check: 'workout' },
    { id: 'qui-goal', label: 'Deposite em uma meta financeira', xp: 10, attr: 'riqueza', check: 'goalDeposit' },
  ],
  Sex: [
    { id: 'sex-sleep', label: 'Durma o recomendado', xp: 15, attr: 'vitalidade', check: 'sleep' },
    { id: 'sex-workout', label: 'Complete o treino de hoje', xp: 20, attr: 'forca', check: 'workout' },
    { id: 'sex-habits', label: 'Conclua todas as missões da rotina', xp: 15, attr: 'foco', check: 'habits' },
  ],
  Sáb: [
    { id: 'sab-water', label: 'Beba toda a água do dia', xp: 15, attr: 'vitalidade', check: 'water' },
    { id: 'sab-workout', label: 'Complete a atividade de hoje', xp: 20, attr: 'forca', check: 'workout' },
    { id: 'sab-goal', label: 'Deposite em uma meta financeira', xp: 10, attr: 'riqueza', check: 'goalDeposit' },
  ],
  Dom: [
    { id: 'dom-water', label: 'Beba toda a água do dia', xp: 15, attr: 'vitalidade', check: 'water' },
    { id: 'dom-sleep', label: 'Durma o recomendado', xp: 15, attr: 'vitalidade', check: 'sleep' },
    { id: 'dom-habits', label: 'Conclua todas as missões da rotina', xp: 15, attr: 'foco', check: 'habits' },
  ],
};
