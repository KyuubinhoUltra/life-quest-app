import { CharacterClass } from './types';

export const CLASSES: Record<CharacterClass, { nome: string; icon: string; atributo: string; lore: string }> = {
  guerreiro: {
    nome: 'Guerreiro',
    icon: '⚔️',
    atributo: 'Força',
    lore: 'Você forja força na disciplina do ferro. Cada treino é uma vitória silenciosa.',
  },
  ranger: {
    nome: 'Ranger',
    icon: '🏹',
    atributo: 'Resistência',
    lore: 'Fôlego e resistência são suas armas. Você não para — você persiste.',
  },
  monge: {
    nome: 'Monge',
    icon: '🧘',
    atributo: 'Equilíbrio',
    lore: 'Equilíbrio é sua busca. Corpo e mente avançam juntos, um passo de cada vez.',
  },
  alquimista: {
    nome: 'Alquimista',
    icon: '⚗️',
    atributo: 'Vitalidade',
    lore: 'Você transforma hábitos em resultado. Cada escolha é uma fórmula para evoluir.',
  },
};

export const ATTR_META = {
  forca: { label: 'Força', icon: '⚔️' },
  vitalidade: { label: 'Vitalidade', icon: '❤️' },
  riqueza: { label: 'Riqueza', icon: '💰' },
  foco: { label: 'Foco', icon: '🎯' },
} as const;

export type QuizOption = { label: string; classes: Partial<Record<CharacterClass, number>> };
export type QuizQuestion = { q: string; options: QuizOption[] };

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    q: 'Qual é o seu objetivo principal agora?',
    options: [
      { label: 'Força e massa muscular', classes: { guerreiro: 2 } },
      { label: 'Perder peso e ganhar resistência', classes: { ranger: 2 } },
      { label: 'Equilíbrio mental', classes: { monge: 2 } },
      { label: 'Organizar a alimentação', classes: { alquimista: 2 } },
    ],
  },
  {
    q: 'O que te dá mais prazer na prática?',
    options: [
      { label: 'Levantar peso', classes: { guerreiro: 1 } },
      { label: 'Correr ou pedalar', classes: { ranger: 1 } },
      { label: 'Yoga ou alongar', classes: { monge: 1 } },
      { label: 'Cozinhar e planejar refeições', classes: { alquimista: 1 } },
    ],
  },
  {
    q: 'Como você se motiva mais?',
    options: [
      { label: 'Bater recordes', classes: { guerreiro: 1 } },
      { label: 'Superar limites de fôlego', classes: { ranger: 1 } },
      { label: 'Consistência e calma', classes: { monge: 1 } },
      { label: 'Ver dados e resultado', classes: { alquimista: 1 } },
    ],
  },
  {
    q: 'O que mais te atrapalha hoje?',
    options: [
      { label: 'Falta de força ou disposição', classes: { guerreiro: 1 } },
      { label: 'Falta de fôlego', classes: { ranger: 1 } },
      { label: 'Estresse e ansiedade', classes: { monge: 1 } },
      { label: 'Alimentação desorganizada', classes: { alquimista: 1 } },
    ],
  },
];

export function xpToNext(level: number): number {
  return 100 + (level - 1) * 40;
}

export function levelFromXp(xp: number): { level: number; xpInLevel: number; xpNeeded: number } {
  let level = 1;
  let remaining = xp;
  let need = xpToNext(1);
  while (remaining >= need) {
    remaining -= need;
    level++;
    need = xpToNext(level);
  }
  return { level, xpInLevel: remaining, xpNeeded: need };
}

export function titleForLevel(level: number): string {
  if (level >= 30) return 'Lenda';
  if (level >= 20) return 'Mestre';
  if (level >= 10) return 'Veterano';
  if (level >= 5) return 'Aventureiro';
  return 'Novato';
}
