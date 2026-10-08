import { levelFromXp } from './character';
import { LifeQuestState } from './types';

export type AchievementArea = 'treino' | 'habitos' | 'saude' | 'financas' | 'comunidade' | 'geral';

export const AREA_ORDER: AchievementArea[] = ['treino', 'habitos', 'saude', 'financas', 'comunidade', 'geral'];
export const AREA_LABEL: Record<AchievementArea, string> = {
  treino: 'Treino',
  habitos: 'Hábitos e ofensiva',
  saude: 'Saúde e alimentação',
  financas: 'Finanças',
  comunidade: 'Comunidade',
  geral: 'Jornada',
};

export type Stats = {
  diasTreino: number;
  exerciciosFeitos: number;
  minutosTreino: number;
  forjaGerada: number;
  habitosFeitos: number;
  ofensivaRecorde: number;
  missoesResgatadas: number;
  diasAgua: number;
  diasSono: number;
  refeicoesRegistradas: number;
  cardapioGerado: number;
  pesagens: number;
  depositos: number;
  metasBatidas: number;
  posts: number;
  shares: number;
  follows: number;
  clubs: number;
  classe: number;
  nivel: number;
};

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

// Números de sempre da conta, calculados a partir do estado salvo.
export function estatisticas(s: LifeQuestState): Stats {
  const logsDeTreino = Object.entries(s.workoutLog).filter(([k]) => DATE_KEY.test(k));
  const flags = Object.values(s.character.dayFlags);
  return {
    diasTreino: logsDeTreino.filter(([, log]) => Object.values(log).some(Boolean)).length,
    exerciciosFeitos: sum(logsDeTreino.map(([, log]) => Object.values(log).filter(Boolean).length)),
    minutosTreino: Math.floor(sum(Object.values(s.workoutDurations)) / 60),
    forjaGerada: s.treinoMissaoSemana.some((d) => d.resultado) ? 1 : 0,
    habitosFeitos: sum(Object.values(s.habitHistory).map((l) => l.length)),
    ofensivaRecorde: s.stats.bestStreak || 0,
    missoesResgatadas: sum(Object.values(s.dailyMissionsClaimed).map((l) => l.length)),
    diasAgua: flags.filter((f) => f.water).length,
    diasSono: flags.filter((f) => f.sleep).length,
    refeicoesRegistradas: sum(Object.values(s.nutritionLog).map((l) => l.length)),
    cardapioGerado: s.dietaSemana.some((d) => d.resultado) ? 1 : 0,
    pesagens: s.bodyWeightLog.length,
    depositos: s.financeActivity.filter((a) => a.type === 'deposit').length,
    metasBatidas: Object.values(s.character.goalsCompleted).filter(Boolean).length,
    posts: s.counters?.posts ?? 0,
    shares: s.counters?.shares ?? 0,
    follows: s.counters?.follows ?? 0,
    clubs: s.counters?.clubs ?? 0,
    classe: s.character.classe ? 1 : 0,
    nivel: levelFromXp(s.character.xpGeral).level,
  };
}

export type AchievementDef = {
  id: string;
  icon: string;
  nome: string;
  descricao: string;
  area: AchievementArea;
  /** XP de bônus (vai pro atributo e inteiro pro nível da conta) */
  xp: number;
  attr: 'forca' | 'vitalidade' | 'riqueza' | 'foco' | null;
  stat: keyof Stats;
  meta: number;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // Treino
  { id: 'primeiro-treino', icon: '🏋️', nome: 'Primeiro treino', descricao: 'Conclua exercícios em 1 dia de treino', area: 'treino', xp: 30, attr: 'forca', stat: 'diasTreino', meta: 1 },
  { id: 'rotina-de-ferro', icon: '🔩', nome: 'Rotina de ferro', descricao: 'Treine em 10 dias', area: 'treino', xp: 80, attr: 'forca', stat: 'diasTreino', meta: 10 },
  { id: 'maquina', icon: '⚙️', nome: 'Máquina', descricao: 'Treine em 50 dias', area: 'treino', xp: 250, attr: 'forca', stat: 'diasTreino', meta: 50 },
  { id: 'centuriao', icon: '💯', nome: 'Centurião', descricao: 'Conclua 100 exercícios', area: 'treino', xp: 120, attr: 'forca', stat: 'exerciciosFeitos', meta: 100 },
  { id: 'maratonista', icon: '⏱️', nome: 'Maratonista', descricao: 'Acumule 10 horas de treino cronometrado', area: 'treino', xp: 150, attr: 'forca', stat: 'minutosTreino', meta: 600 },
  { id: 'forjador', icon: '⚒️', nome: 'Forjador', descricao: 'Gere uma semana na Forja de Treinos', area: 'treino', xp: 40, attr: 'forca', stat: 'forjaGerada', meta: 1 },

  // Hábitos e ofensiva
  { id: 'primeiro-passo', icon: '✅', nome: 'Primeiro passo', descricao: 'Conclua um hábito', area: 'habitos', xp: 20, attr: 'foco', stat: 'habitosFeitos', meta: 1 },
  { id: 'disciplina', icon: '🧠', nome: 'Disciplina', descricao: 'Conclua 50 hábitos', area: 'habitos', xp: 120, attr: 'foco', stat: 'habitosFeitos', meta: 50 },
  { id: 'ritmo', icon: '🔥', nome: 'Pegando o ritmo', descricao: 'Chegue a 3 dias de ofensiva', area: 'habitos', xp: 40, attr: 'foco', stat: 'ofensivaRecorde', meta: 3 },
  { id: 'semana-perfeita', icon: '🔥', nome: 'Semana perfeita', descricao: 'Chegue a 7 dias de ofensiva', area: 'habitos', xp: 100, attr: 'foco', stat: 'ofensivaRecorde', meta: 7 },
  { id: 'mes-de-fogo', icon: '🔥', nome: 'Mês de fogo', descricao: 'Chegue a 30 dias de ofensiva', area: 'habitos', xp: 400, attr: 'foco', stat: 'ofensivaRecorde', meta: 30 },
  { id: 'cacador', icon: '🎯', nome: 'Caçador de missões', descricao: 'Resgate 10 missões diárias', area: 'habitos', xp: 80, attr: 'foco', stat: 'missoesResgatadas', meta: 10 },

  // Saúde e alimentação
  { id: 'hidratado', icon: '💧', nome: 'Hidratado', descricao: 'Bata a meta de água em 1 dia', area: 'saude', xp: 30, attr: 'vitalidade', stat: 'diasAgua', meta: 1 },
  { id: 'fonte-viva', icon: '🌊', nome: 'Fonte viva', descricao: 'Bata a meta de água em 7 dias', area: 'saude', xp: 120, attr: 'vitalidade', stat: 'diasAgua', meta: 7 },
  { id: 'boa-noite', icon: '😴', nome: 'Boa noite', descricao: 'Durma o recomendado em 1 noite', area: 'saude', xp: 30, attr: 'vitalidade', stat: 'diasSono', meta: 1 },
  { id: 'sono-de-campeao', icon: '🌙', nome: 'Sono de campeão', descricao: 'Durma o recomendado em 7 noites', area: 'saude', xp: 120, attr: 'vitalidade', stat: 'diasSono', meta: 7 },
  { id: 'mesa-posta', icon: '🍽️', nome: 'Mesa posta', descricao: 'Registre 1 refeição', area: 'saude', xp: 30, attr: 'vitalidade', stat: 'refeicoesRegistradas', meta: 1 },
  { id: 'alquimista-de-verdade', icon: '⚗️', nome: 'Alquimista de verdade', descricao: 'Registre 30 refeições', area: 'saude', xp: 150, attr: 'vitalidade', stat: 'refeicoesRegistradas', meta: 30 },
  { id: 'cardapio-pronto', icon: '📋', nome: 'Cardápio pronto', descricao: 'Gere um cardápio na Cozinha do Alquimista', area: 'saude', xp: 40, attr: 'vitalidade', stat: 'cardapioGerado', meta: 1 },
  { id: 'constancia-na-balanca', icon: '⚖️', nome: 'Constância na balança', descricao: 'Registre seu peso 10 vezes', area: 'saude', xp: 80, attr: 'vitalidade', stat: 'pesagens', meta: 10 },

  // Finanças
  { id: 'primeiro-aporte', icon: '💰', nome: 'Primeiro aporte', descricao: 'Deposite em uma meta', area: 'financas', xp: 30, attr: 'riqueza', stat: 'depositos', meta: 1 },
  { id: 'poupador', icon: '🏦', nome: 'Poupador', descricao: 'Faça 10 depósitos em metas', area: 'financas', xp: 100, attr: 'riqueza', stat: 'depositos', meta: 10 },
  { id: 'meta-batida', icon: '🏆', nome: 'Meta batida', descricao: 'Complete uma meta financeira', area: 'financas', xp: 150, attr: 'riqueza', stat: 'metasBatidas', meta: 1 },
  { id: 'realizador', icon: '👑', nome: 'Realizador', descricao: 'Complete 3 metas financeiras', area: 'financas', xp: 400, attr: 'riqueza', stat: 'metasBatidas', meta: 3 },

  // Comunidade
  { id: 'primeiro-post', icon: '📸', nome: 'Primeiro post', descricao: 'Publique na Comunidade', area: 'comunidade', xp: 40, attr: null, stat: 'posts', meta: 1 },
  { id: 'voz-da-comunidade', icon: '📣', nome: 'Voz da comunidade', descricao: 'Publique 10 posts', area: 'comunidade', xp: 150, attr: null, stat: 'posts', meta: 10 },
  { id: 'divulgador', icon: '🔗', nome: 'Divulgador', descricao: 'Compartilhe um treino em outra rede', area: 'comunidade', xp: 40, attr: null, stat: 'shares', meta: 1 },
  { id: 'sociavel', icon: '🤝', nome: 'Sociável', descricao: 'Siga alguém na Comunidade', area: 'comunidade', xp: 30, attr: null, stat: 'follows', meta: 1 },
  { id: 'de-clube', icon: '🛡️', nome: 'De clube', descricao: 'Entre ou crie um clube', area: 'comunidade', xp: 40, attr: null, stat: 'clubs', meta: 1 },

  // Jornada
  { id: 'destino-revelado', icon: '🎭', nome: 'Destino revelado', descricao: 'Descubra sua classe no quiz', area: 'geral', xp: 30, attr: null, stat: 'classe', meta: 1 },
  { id: 'nivel-5', icon: '⭐', nome: 'Aventureiro', descricao: 'Chegue ao nível 5 da conta', area: 'geral', xp: 100, attr: null, stat: 'nivel', meta: 5 },
  { id: 'nivel-10', icon: '🌟', nome: 'Veterano', descricao: 'Chegue ao nível 10 da conta', area: 'geral', xp: 250, attr: null, stat: 'nivel', meta: 10 },
  { id: 'nivel-20', icon: '💫', nome: 'Mestre', descricao: 'Chegue ao nível 20 da conta', area: 'geral', xp: 600, attr: null, stat: 'nivel', meta: 20 },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

export function conquistasPendentes(s: LifeQuestState): AchievementDef[] {
  const st = estatisticas(s);
  return ACHIEVEMENTS.filter((a) => !s.achievements.unlocked[a.id] && st[a.stat] >= a.meta);
}

export type Celebration =
  | { kind: 'level'; level: number }
  | { kind: 'achievements'; ids: string[]; xp: number };
