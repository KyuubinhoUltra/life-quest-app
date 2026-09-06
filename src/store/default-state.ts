import { dateKeyOffset } from './dates';
import { LifeQuestState } from './types';

export function createDefaultState(): LifeQuestState {
  const waterLog: Record<string, number> = {};
  waterLog[dateKeyOffset(0)] = 750;

  const sleepLog: Record<string, { bed: string; wake: string }> = {};
  sleepLog[dateKeyOffset(0)] = { bed: '00:15', wake: '06:45' };

  return {
    habits: [
      { id: 'h1', name: 'Alongar 5 minutos' },
      { id: 'h2', name: 'Ler 10 páginas' },
      { id: 'h3', name: 'Meditar 10 minutos' },
      { id: 'h4', name: 'Dormir antes das 23h' },
    ],
    habitHistory: {},
    waterLog,
    sleepLog,
    workoutPlan: {
      Seg: {
        title: 'Peito & Tríceps',
        exercises: [
          { id: 'e1', name: 'Supino reto', target: '4x10', weight: 0, cat: 'Peito' },
          { id: 'e2', name: 'Supino inclinado halteres', target: '3x12', weight: 0, cat: 'Peito' },
          { id: 'e3', name: 'Tríceps corda', target: '3x15', weight: 0, cat: 'Tríceps' },
        ],
      },
      Ter: {
        title: 'Costas & Bíceps',
        exercises: [
          { id: 'e4', name: 'Puxada frente', target: '4x10', weight: 0, cat: 'Costas' },
          { id: 'e5', name: 'Remada curvada', target: '3x12', weight: 0, cat: 'Costas' },
          { id: 'e6', name: 'Rosca direta', target: '3x15', weight: 0, cat: 'Bíceps' },
        ],
      },
      Qua: {
        title: 'Descanso ativo',
        exercises: [{ id: 'e7', name: 'Caminhada 30min', target: '1x', weight: 0, cat: 'Cardio' }],
      },
      Qui: {
        title: 'Pernas',
        exercises: [
          { id: 'e8', name: 'Agachamento livre', target: '4x10', weight: 0, cat: 'Pernas' },
          { id: 'e9', name: 'Leg press', target: '3x12', weight: 0, cat: 'Pernas' },
          { id: 'e10', name: 'Panturrilha em pé', target: '4x15', weight: 0, cat: 'Panturrilha' },
        ],
      },
      Sex: {
        title: 'Ombro & Abdômen',
        exercises: [
          { id: 'e11', name: 'Desenvolvimento militar', target: '4x10', weight: 0, cat: 'Ombro' },
          { id: 'e12', name: 'Elevação lateral', target: '3x15', weight: 0, cat: 'Ombro' },
          { id: 'e13', name: 'Prancha', target: '3x45s', weight: 0, cat: 'Abdômen' },
        ],
      },
      Sáb: {
        title: 'Cardio livre',
        exercises: [{ id: 'e14', name: 'Corrida ou bike 40min', target: '1x', weight: 0, cat: 'Cardio' }],
      },
      Dom: { title: 'Descanso', exercises: [] },
    },
    workoutLog: {},
    bodyWeightLog: [
      { id: 'w1', date: dateKeyOffset(21), weight: 83.4 },
      { id: 'w2', date: dateKeyOffset(14), weight: 82.6 },
      { id: 'w3', date: dateKeyOffset(7), weight: 82.1 },
      { id: 'w4', date: dateKeyOffset(0), weight: 81.5 },
    ],
    goals: [
      { id: 'g1', name: 'Reserva de emergência', icon: '🛟', target: 10000, saved: 3200, deadline: '' },
      { id: 'g2', name: 'Viagem de fim de ano', icon: '✈️', target: 5000, saved: 800, deadline: '' },
    ],
    financeActivity: [],
    profile: { name: 'Seu nome', avatar: '🙂', createdAt: dateKeyOffset(0) },
    stats: { bestStreak: 0 },
    character: {
      classe: null,
      afinidade: null,
      xpGeral: 0,
      xp: { forca: 0, vitalidade: 0, riqueza: 0, foco: 0 },
      goalsCompleted: {},
      dayFlags: {},
    },
    workoutTimer: { date: null, accumulatedSeconds: 0, runningSince: null },
    workoutDurations: {},
  };
}
