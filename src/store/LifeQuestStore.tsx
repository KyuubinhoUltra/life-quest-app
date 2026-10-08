import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { gerarCardapio } from '@/engines/dieta-engine';
import { gerarMissao } from '@/engines/treino-engine';

import { Celebration, conquistasPendentes } from './achievements';
import { levelFromXp } from './character';
import { createDefaultState } from './default-state';
import { diaDoPlano, planoVazio } from './forja-treino';
import { MissionDef } from './daily-missions';
import { currentWeekday, dateKeyOffset, todayStr } from './dates';
import {
  Counters,
  DietaConfig,
  DietaDia,
  DietaPerfil,
  LifeQuestState,
  NutritionLogEntry,
  TreinoMissaoConfig,
  TreinoMissaoDia,
  WEEKDAYS,
} from './types';

const STORE_KEY = 'lifequest_state_v1';

const ML_PER_KG = 35; // recomendação padrão: 35ml de água por kg de peso corporal
export const SLEEP_TARGET_H = 8;

export const XP_HABIT = 8;
export const XP_EXERCISE = 10;
export const XP_WATER_GOAL = 15;
export const XP_SLEEP_GOAL = 15;
export const XP_GOAL_DEPOSIT = 10;
export const XP_GOAL_COMPLETE = 50;

type Ctx = {
  state: LifeQuestState;
  ready: boolean;
  today: string;
  currentWeekdayKey: string;

  // derived
  latestBodyWeight: () => number | null;
  waterTargetMl: () => number | null;
  habitStreak: (id: string) => number;
  dayActive: (dateKey: string) => boolean;
  currentOfensiva: () => number;

  // actions
  toggleHabit: (id: string) => void;
  addHabit: (name: string) => void;
  deleteHabit: (id: string) => void;
  addWater: (deltaMl: number) => void;
  deleteWaterEntry: (date: string) => void;
  saveSleep: (bed: string, wake: string) => void;
  deleteSleepEntry: (date: string) => void;
  workoutDayKey: (weekdayKey: string) => string;
  toggleExercise: (weekdayKey: string, exId: string) => void;
  addExercise: (weekdayKey: string, name: string, target: string, weight: number, cat?: string) => void;
  deleteExercise: (weekdayKey: string, exId: string) => void;
  setExerciseWeight: (weekdayKey: string, exId: string, weight: number) => void;
  addWeightEntry: (date: string, weight: number) => void;
  deleteWeightEntry: (id: string) => void;
  startWorkoutTimer: () => void;
  pauseWorkoutTimer: () => void;
  finishWorkoutTimer: () => void;
  addGoal: (name: string, icon: string, target: number, deadline: string) => void;
  deleteGoal: (id: string) => void;
  depositToGoal: (id: string, amount: number) => void;
  withdrawFromGoal: (id: string, amount: number) => void;
  setGoalDeadline: (id: string, deadline: string) => void;
  setProfileName: (name: string) => void;
  setProfileAvatar: (avatar: string) => void;
  setBonecoSexo: (sexo: 'homem' | 'mulher') => void;
  setCharacterClass: (
    classe: LifeQuestState['character']['classe'],
    afinidade: LifeQuestState['character']['afinidade']
  ) => void;
  respecCharacter: () => void;
  resetAllData: () => Promise<void>;
  longestHabitStreak: () => number;
  avgSleepLast7d: () => number | null;
  isMissionDone: (mission: MissionDef) => boolean;
  claimDailyMission: (mission: MissionDef) => void;

  // Forja de Treinos (treino gerado)
  setTreinoMissaoConfig: (patch: Partial<TreinoMissaoConfig>) => void;
  gerarMissaoDoDiaTreino: (idx: number) => void;
  aplicarSemanaTreino: (split: { label: string; cat: string[]; tipo: string }[]) => void;

  // Cozinha do Alquimista (dieta gerada)
  setDietaPerfil: (patch: Partial<DietaPerfil>) => void;
  setDietaConfig: (patch: Partial<DietaConfig>) => void;
  setDietaSemana: (dias: DietaDia[]) => void;
  gerarCardapioDoDia: (idx: number) => void;
  registrarRefeicaoComida: (entry: Omit<NutritionLogEntry, 'registradoEm' | 'origem'>) => void;

  // Conquistas e nível da conta
  bumpCounter: (key: keyof Counters) => void;
  celebrations: Celebration[];
  dismissCelebration: () => void;
};

const LifeQuestContext = createContext<Ctx | null>(null);

export function LifeQuestProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LifeQuestState>(createDefaultState);
  const [ready, setReady] = useState(false);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const today = todayStr();
  const weekday = currentWeekday();
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setState((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        // mantém o estado padrão se a leitura falhar
      } finally {
        loaded.current = true;
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const dayFlags = useCallback((s: LifeQuestState, dateKey: string) => {
    if (!s.character.dayFlags[dateKey]) s.character.dayFlags[dateKey] = {};
    return s.character.dayFlags[dateKey];
  }, []);

  const gainAttrXp = useCallback((s: LifeQuestState, attr: keyof LifeQuestState['character']['xp'], amount: number) => {
    s.character.xp[attr] = Math.max(0, s.character.xp[attr] + amount);
    const geralGain = Math.round(amount * 0.3);
    s.character.xpGeral = Math.max(0, s.character.xpGeral + geralGain);
  }, []);

  const dayActive = useCallback(
    (dateKey: string) => {
      const habitsDone = (state.habitHistory[dateKey] || []).length > 0;
      const waterDone = (state.waterLog[dateKey] || 0) > 0;
      const sleepEntry = state.sleepLog[dateKey];
      const sleepDone = !!(sleepEntry && sleepEntry.bed && sleepEntry.wake);
      const workoutLogForDay = state.workoutLog[dateKey];
      const workoutDone = !!(workoutLogForDay && Object.values(workoutLogForDay).some(Boolean));
      return habitsDone || waterDone || sleepDone || workoutDone;
    },
    [state.habitHistory, state.waterLog, state.sleepLog, state.workoutLog]
  );

  const currentOfensiva = useCallback(() => {
    let streak = 0;
    const d = new Date();
    if (!dayActive(today)) d.setDate(d.getDate() - 1);
    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (dayActive(key)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  }, [dayActive, today]);

  const habitStreak = useCallback(
    (id: string) => {
      let streak = 0;
      const d = new Date();
      const doneToday = (state.habitHistory[today] || []).includes(id);
      if (!doneToday) d.setDate(d.getDate() - 1);
      while (true) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
        const list = state.habitHistory[key] || [];
        if (list.includes(id)) {
          streak++;
          d.setDate(d.getDate() - 1);
        } else break;
      }
      return streak;
    },
    [state.habitHistory, today]
  );

  const latestBodyWeight = useCallback(() => {
    if (state.bodyWeightLog.length === 0) return null;
    const sorted = [...state.bodyWeightLog].sort((a, b) => a.date.localeCompare(b.date));
    return sorted[sorted.length - 1].weight;
  }, [state.bodyWeightLog]);

  const waterTargetMl = useCallback(() => {
    const w = latestBodyWeight();
    if (!w) return null;
    return Math.round((w * ML_PER_KG) / 50) * 50;
  }, [latestBodyWeight]);

  const checkDailyBonuses = useCallback(
    (s: LifeQuestState) => {
      const flags = dayFlags(s, today);
      const target = (() => {
        if (s.bodyWeightLog.length === 0) return null;
        const w = [...s.bodyWeightLog].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0].weight;
        return Math.round((w * ML_PER_KG) / 50) * 50;
      })();
      const consumed = s.waterLog[today] || 0;
      if (target && consumed >= target && !flags.water) {
        flags.water = true;
        gainAttrXp(s, 'vitalidade', XP_WATER_GOAL);
      }
      const sleepEntry = s.sleepLog[today];
      if (sleepEntry?.bed && sleepEntry?.wake && !flags.sleep) {
        const [bh, bm] = sleepEntry.bed.split(':').map(Number);
        const [wh, wm] = sleepEntry.wake.split(':').map(Number);
        let diff = wh * 60 + wm - (bh * 60 + bm);
        if (diff <= 0) diff += 24 * 60;
        const hours = Math.round((diff / 60) * 10) / 10;
        if (hours >= SLEEP_TARGET_H) {
          flags.sleep = true;
          gainAttrXp(s, 'vitalidade', XP_SLEEP_GOAL);
        }
      }
    },
    [dayFlags, gainAttrXp, today]
  );

  const toggleHabit = useCallback(
    (id: string) => {
      setState((prev) => {
        const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
        const list = next.habitHistory[today] || [];
        const idx = list.indexOf(id);
        if (idx === -1) {
          list.push(id);
          gainAttrXp(next, 'foco', XP_HABIT);
        } else {
          list.splice(idx, 1);
          gainAttrXp(next, 'foco', -XP_HABIT);
        }
        next.habitHistory[today] = list;
        checkDailyBonuses(next);
        return next;
      });
    },
    [checkDailyBonuses, gainAttrXp, today]
  );

  const addHabit = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      habits: [...prev.habits, { id: Math.random().toString(36).slice(2, 9), name: trimmed }],
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
  }, []);

  const addWater = useCallback(
    (deltaMl: number) => {
      setState((prev) => {
        const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
        const cur = next.waterLog[today] || 0;
        next.waterLog[today] = Math.max(0, cur + deltaMl);
        checkDailyBonuses(next);
        return next;
      });
    },
    [checkDailyBonuses, today]
  );

  const saveSleep = useCallback(
    (bed: string, wake: string) => {
      if (!bed || !wake) return;
      setState((prev) => {
        const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
        next.sleepLog[today] = { bed, wake };
        checkDailyBonuses(next);
        return next;
      });
    },
    [checkDailyBonuses, today]
  );

  const deleteSleepEntry = useCallback((date: string) => {
    setState((prev) => {
      if (!prev.sleepLog[date]) return prev;
      const next = { ...prev.sleepLog };
      delete next[date];
      return { ...prev, sleepLog: next };
    });
  }, []);

  const deleteWaterEntry = useCallback((date: string) => {
    setState((prev) => {
      if (!(date in prev.waterLog)) return prev;
      const next = { ...prev.waterLog };
      delete next[date];
      return { ...prev, waterLog: next };
    });
  }, []);

  // dia real (hoje) para o dia da semana selecionado, ou uma chave fixa de "modelo" para outros dias
  const workoutDayKey = useCallback(
    (weekdayKey: string) => (weekdayKey === weekday ? today : `${weekdayKey}-plan`),
    [today, weekday]
  );

  const toggleExercise = useCallback(
    (weekdayKey: string, exId: string) => {
      setState((prev) => {
        const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
        const dayKey = weekdayKey === weekday ? today : `${weekdayKey}-plan`;
        const log = next.workoutLog[dayKey] || {};
        log[exId] = !log[exId];
        next.workoutLog[dayKey] = log;
        gainAttrXp(next, 'forca', log[exId] ? XP_EXERCISE : -XP_EXERCISE);
        checkDailyBonuses(next);
        return next;
      });
    },
    [checkDailyBonuses, gainAttrXp, today, weekday]
  );

  const addExercise = useCallback((weekdayKey: string, name: string, target: string, weight: number, cat?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState((prev) => {
      const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
      const plan = next.workoutPlan[weekdayKey] || { title: 'Treino', exercises: [] };
      plan.exercises.push({
        id: Math.random().toString(36).slice(2, 9),
        name: trimmed,
        target: target.trim() || '—',
        weight: weight || 0,
        cat,
      });
      next.workoutPlan[weekdayKey] = plan;
      return next;
    });
  }, []);

  const deleteExercise = useCallback((weekdayKey: string, exId: string) => {
    setState((prev) => {
      const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
      const plan = next.workoutPlan[weekdayKey];
      if (plan) plan.exercises = plan.exercises.filter((e) => e.id !== exId);
      return next;
    });
  }, []);

  const setExerciseWeight = useCallback((weekdayKey: string, exId: string, weight: number) => {
    setState((prev) => {
      const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
      const plan = next.workoutPlan[weekdayKey];
      const ex = plan?.exercises.find((e) => e.id === exId);
      if (ex) ex.weight = weight || 0;
      return next;
    });
  }, []);

  const addWeightEntry = useCallback((date: string, weight: number) => {
    setState((prev) => ({
      ...prev,
      bodyWeightLog: [...prev.bodyWeightLog, { id: Math.random().toString(36).slice(2, 9), date, weight }].sort(
        (a, b) => a.date.localeCompare(b.date)
      ),
    }));
  }, []);

  const deleteWeightEntry = useCallback((id: string) => {
    setState((prev) => ({ ...prev, bodyWeightLog: prev.bodyWeightLog.filter((w) => w.id !== id) }));
  }, []);

  const startWorkoutTimer = useCallback(() => {
    setState((prev) => {
      const t = { ...prev.workoutTimer };
      if (t.date !== today) {
        t.date = today;
        t.accumulatedSeconds = 0;
      }
      t.runningSince = Date.now();
      return { ...prev, workoutTimer: t };
    });
  }, [today]);

  const pauseWorkoutTimer = useCallback(() => {
    setState((prev) => {
      const t = { ...prev.workoutTimer };
      if (t.runningSince) {
        t.accumulatedSeconds += (Date.now() - t.runningSince) / 1000;
        t.runningSince = null;
      }
      return { ...prev, workoutTimer: t };
    });
  }, []);

  const finishWorkoutTimer = useCallback(() => {
    setState((prev) => {
      const t = { ...prev.workoutTimer };
      const extra = t.runningSince ? (Date.now() - t.runningSince) / 1000 : 0;
      const total = t.date === today ? t.accumulatedSeconds + extra : 0;
      return {
        ...prev,
        workoutDurations: { ...prev.workoutDurations, [today]: (prev.workoutDurations[today] || 0) + Math.round(total) },
        workoutTimer: { date: today, accumulatedSeconds: 0, runningSince: null },
      };
    });
  }, [today]);

  const addGoal = useCallback((name: string, icon: string, target: number, deadline: string) => {
    const trimmed = name.trim();
    if (!trimmed || !target || target <= 0) return;
    setState((prev) => ({
      ...prev,
      goals: [
        ...prev.goals,
        { id: Math.random().toString(36).slice(2, 9), name: trimmed, icon, target, saved: 0, deadline },
      ],
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState((prev) => ({ ...prev, goals: prev.goals.filter((g) => g.id !== id) }));
  }, []);

  const depositToGoal = useCallback(
    (id: string, amount: number) => {
      if (!amount || amount <= 0) return;
      setState((prev) => {
        const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
        const goal = next.goals.find((g) => g.id === id);
        if (!goal) return prev;
        goal.saved += amount;
        next.financeActivity.unshift({
          id: Math.random().toString(36).slice(2, 9),
          goalId: goal.id,
          goalName: goal.name,
          goalIcon: goal.icon,
          type: 'deposit',
          amount,
          date: today,
        });
        gainAttrXp(next, 'riqueza', XP_GOAL_DEPOSIT);
        const pct = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
        if (pct >= 100 && !next.character.goalsCompleted[id]) {
          next.character.goalsCompleted[id] = true;
          gainAttrXp(next, 'riqueza', XP_GOAL_COMPLETE);
        }
        return next;
      });
    },
    [gainAttrXp, today]
  );

  const withdrawFromGoal = useCallback(
    (id: string, amount: number) => {
      if (!amount || amount <= 0) return;
      setState((prev) => {
        const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
        const goal = next.goals.find((g) => g.id === id);
        if (!goal) return prev;
        goal.saved = Math.max(0, goal.saved - amount);
        next.financeActivity.unshift({
          id: Math.random().toString(36).slice(2, 9),
          goalId: goal.id,
          goalName: goal.name,
          goalIcon: goal.icon,
          type: 'withdraw',
          amount,
          date: today,
        });
        return next;
      });
    },
    [today]
  );

  const setGoalDeadline = useCallback((id: string, deadline: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, deadline } : g)),
    }));
  }, []);

  const setProfileName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, name: name.trim() || 'Seu nome' } }));
  }, []);

  const setProfileAvatar = useCallback((avatar: string) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, avatar } }));
  }, []);

  const setBonecoSexo = useCallback((bonecoSexo: 'homem' | 'mulher') => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, bonecoSexo } }));
  }, []);

  const setCharacterClass = useCallback(
    (classe: LifeQuestState['character']['classe'], afinidade: LifeQuestState['character']['afinidade']) => {
      setState((prev) => ({ ...prev, character: { ...prev.character, classe, afinidade } }));
    },
    []
  );

  const respecCharacter = useCallback(() => {
    setState((prev) => ({ ...prev, character: { ...prev.character, classe: null, afinidade: null } }));
  }, []);

  const resetAllData = useCallback(async () => {
    await AsyncStorage.removeItem(STORE_KEY);
    setState(createDefaultState());
    setCelebrations([]);
  }, []);

  const longestHabitStreak = useCallback(() => {
    let best = 0;
    for (const h of state.habits) {
      const s = habitStreak(h.id);
      if (s > best) best = s;
    }
    return best;
  }, [state.habits, habitStreak]);

  const avgSleepLast7d = useCallback(() => {
    let total = 0;
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const key = dateKeyOffset(i);
      const entry = state.sleepLog[key];
      if (entry?.bed && entry?.wake) {
        const [bh, bm] = entry.bed.split(':').map(Number);
        const [wh, wm] = entry.wake.split(':').map(Number);
        let diff = wh * 60 + wm - (bh * 60 + bm);
        if (diff <= 0) diff += 24 * 60;
        total += Math.round((diff / 60) * 10) / 10;
        count++;
      }
    }
    return count ? total / count : null;
  }, [state.sleepLog]);

  const isMissionDone = useCallback(
    (mission: MissionDef) => {
      switch (mission.check) {
        case 'water': {
          const target = waterTargetMl();
          return !!target && (state.waterLog[today] || 0) >= target;
        }
        case 'sleep': {
          const entry = state.sleepLog[today];
          if (!entry?.bed || !entry?.wake) return false;
          const [bh, bm] = entry.bed.split(':').map(Number);
          const [wh, wm] = entry.wake.split(':').map(Number);
          let diff = wh * 60 + wm - (bh * 60 + bm);
          if (diff <= 0) diff += 24 * 60;
          return diff / 60 >= SLEEP_TARGET_H;
        }
        case 'workout':
          return (state.workoutDurations[today] || 0) > 0;
        case 'habits':
          return state.habits.length > 0 && (state.habitHistory[today] || []).length === state.habits.length;
        case 'goalDeposit':
          return state.financeActivity.some((a) => a.date === today && a.type === 'deposit');
        default:
          return false;
      }
    },
    [
      waterTargetMl,
      state.waterLog,
      state.sleepLog,
      state.workoutDurations,
      state.habits,
      state.habitHistory,
      state.financeActivity,
      today,
    ]
  );

  const claimDailyMission = useCallback(
    (mission: MissionDef) => {
      setState((prev) => {
        const claimed = prev.dailyMissionsClaimed[today] || [];
        if (claimed.includes(mission.id)) return prev;
        const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
        next.dailyMissionsClaimed[today] = [...claimed, mission.id];
        gainAttrXp(next, mission.attr, mission.xp);
        return next;
      });
    },
    [gainAttrXp, today]
  );

  const setTreinoMissaoConfig = useCallback((patch: Partial<TreinoMissaoConfig>) => {
    setState((prev) => ({ ...prev, treinoMissaoConfig: { ...prev.treinoMissaoConfig, ...patch } }));
  }, []);

  const gerarMissaoDoDiaTreino = useCallback(
    (idx: number) => {
      setState((prev) => {
        const dia = prev.treinoMissaoSemana[idx];
        const classe = prev.treinoMissaoConfig.classe;
        if (!dia || !classe) return prev;
        const resposta = gerarMissao({ dia, classeKey: classe, config: prev.treinoMissaoConfig });
        const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
        if (resposta.ok) {
          next.treinoMissaoSemana[idx] = { ...next.treinoMissaoSemana[idx], error: null, resultado: resposta.dados };
          if (dia.weekday) next.workoutPlan[dia.weekday] = diaDoPlano(dia.label, resposta.dados.exercicios);
        } else {
          next.treinoMissaoSemana[idx] = { ...next.treinoMissaoSemana[idx], error: resposta.erro };
        }
        return next;
      });
    },
    []
  );

  // Gera a missão de cada treino da semana e substitui o Plano semanal por ela.
  // O XP vem de marcar os exercícios no plano (não de gerar), senão gerar a
  // semana inteira de uma vez renderia XP de graça.
  const aplicarSemanaTreino = useCallback((split: { label: string; cat: string[]; tipo: string }[]) => {
    setState((prev) => {
      const classe = prev.treinoMissaoConfig.classe;
      if (!classe || split.length === 0) return prev;
      // cada treino cai num dos dias que a pessoa marcou, na ordem da semana
      const diasEscolhidos = WEEKDAYS.filter((wd) => prev.treinoMissaoConfig.diasSemana?.includes(wd));
      const semana: TreinoMissaoDia[] = [];
      const plano = planoVazio();
      split.forEach((d, i) => {
        const weekday = diasEscolhidos[i] ?? WEEKDAYS[i];
        const resposta = gerarMissao({ dia: d, classeKey: classe, config: prev.treinoMissaoConfig });
        if (resposta.ok) {
          semana.push({ ...d, weekday, resultado: resposta.dados, error: null });
          plano[weekday] = diaDoPlano(d.label, resposta.dados.exercicios);
        } else {
          semana.push({ ...d, weekday, resultado: null, error: resposta.erro });
          plano[weekday] = { title: d.label, exercises: [] };
        }
      });
      return { ...prev, treinoMissaoSemana: semana, workoutPlan: plano };
    });
  }, []);

  const setDietaPerfil = useCallback((patch: Partial<DietaPerfil>) => {
    setState((prev) => ({ ...prev, dietaPerfil: { ...prev.dietaPerfil, ...patch } }));
  }, []);

  const setDietaConfig = useCallback((patch: Partial<DietaConfig>) => {
    setState((prev) => ({ ...prev, dietaConfig: { ...prev.dietaConfig, ...patch } }));
  }, []);

  const setDietaSemana = useCallback((dias: DietaDia[]) => {
    setState((prev) => ({ ...prev, dietaSemana: dias, dietaUsadasNaSemana: [] }));
  }, []);

  const gerarCardapioDoDia = useCallback(
    (idx: number) => {
      setState((prev) => {
        const dia = prev.dietaSemana[idx];
        if (!dia) return prev;
        const peso = prev.bodyWeightLog.length
          ? [...prev.bodyWeightLog].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0].weight
          : null;
        const { altura, idade, sexo, atividade } = prev.dietaPerfil;
        const { objetivo, restricoes } = prev.dietaConfig;
        if (!peso || !altura || !idade || !sexo || !atividade || !objetivo) return prev;

        // Se esse dia já tinha um resultado (reroll), tira as receitas antigas dele
        // do rastreamento antes de gerar de novo, senão ele nunca poderia repetir
        // nem a própria escolha anterior.
        const baseSemana = new Set(prev.dietaUsadasNaSemana);
        dia.resultado?.refeicoes.forEach((r) => baseSemana.delete(r.nome));

        const resposta = gerarCardapio({
          dia,
          config: {
            perfil: { peso, altura, idade, sexo, atividade },
            objetivo,
            restricoesAlimentares: restricoes,
          },
          usadasNaSemana: baseSemana,
        });

        const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
        if (resposta.ok) {
          next.dietaSemana[idx] = { ...next.dietaSemana[idx], error: null, resultado: resposta.dados };
          next.dietaUsadasNaSemana = [...baseSemana, ...resposta.dados.refeicoes.map((r) => r.nome)];
          gainAttrXp(next, 'vitalidade', resposta.dados.xp);
        } else {
          next.dietaSemana[idx] = { ...next.dietaSemana[idx], error: resposta.erro };
        }
        return next;
      });
    },
    [gainAttrXp]
  );

  const registrarRefeicaoComida = useCallback(
    (entry: Omit<NutritionLogEntry, 'registradoEm' | 'origem'>) => {
      setState((prev) => {
        const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
        const log = next.nutritionLog[today] || [];
        log.push({ ...entry, registradoEm: new Date().toISOString(), origem: 'plano' });
        next.nutritionLog[today] = log;
        return next;
      });
    },
    [today]
  );

  const bumpCounter = useCallback((key: keyof Counters) => {
    setState((prev) => ({ ...prev, counters: { ...prev.counters, [key]: (prev.counters?.[key] ?? 0) + 1 } }));
  }, []);

  const dismissCelebration = useCallback(() => setCelebrations((q) => q.slice(1)), []);

  // Desbloqueia conquistas assim que o estado cumpre os requisitos. O XP de bônus
  // entra inteiro no nível da conta (e no atributo da área, quando há um).
  useEffect(() => {
    if (!ready) return;
    const novas = conquistasPendentes(state);
    if (novas.length === 0) return;
    setState((prev) => {
      const pendentes = conquistasPendentes(prev);
      if (pendentes.length === 0) return prev;
      const next: LifeQuestState = JSON.parse(JSON.stringify(prev));
      for (const a of pendentes) {
        next.achievements.unlocked[a.id] = today;
        if (a.attr) next.character.xp[a.attr] += a.xp;
        next.character.xpGeral += a.xp;
      }
      return next;
    });
    setCelebrations((q) => [
      ...q,
      { kind: 'achievements', ids: novas.map((a) => a.id), xp: novas.reduce((t, a) => t + a.xp, 0) },
    ]);
  }, [ready, state, today]);

  // Comemora subir de nível (a primeira leitura só grava o nível atual, sem festa).
  useEffect(() => {
    if (!ready) return;
    const nivel = levelFromXp(state.character.xpGeral).level;
    const maior = state.character.highestLevel;
    if (maior !== undefined && nivel <= maior) return;
    setState((prev) => ({ ...prev, character: { ...prev.character, highestLevel: nivel } }));
    if (maior !== undefined) setCelebrations((q) => [...q, { kind: 'level', level: nivel }]);
  }, [ready, state.character.xpGeral, state.character.highestLevel]);

  // atualiza o recorde de ofensiva sempre que o estado relevante muda
  useEffect(() => {
    if (!ready) return;
    const cur = currentOfensiva();
    if (cur > (state.stats.bestStreak || 0)) {
      setState((prev) => ({ ...prev, stats: { ...prev.stats, bestStreak: cur } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, state.habitHistory, state.waterLog, state.sleepLog, state.workoutLog]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      today,
      currentWeekdayKey: weekday,
      latestBodyWeight,
      waterTargetMl,
      habitStreak,
      dayActive,
      currentOfensiva,
      toggleHabit,
      addHabit,
      deleteHabit,
      addWater,
      deleteWaterEntry,
      saveSleep,
      deleteSleepEntry,
      workoutDayKey,
      toggleExercise,
      addExercise,
      deleteExercise,
      setExerciseWeight,
      addWeightEntry,
      deleteWeightEntry,
      startWorkoutTimer,
      pauseWorkoutTimer,
      finishWorkoutTimer,
      addGoal,
      deleteGoal,
      depositToGoal,
      withdrawFromGoal,
      setGoalDeadline,
      setProfileName,
      setProfileAvatar,
      setBonecoSexo,
      setCharacterClass,
      respecCharacter,
      resetAllData,
      longestHabitStreak,
      avgSleepLast7d,
      isMissionDone,
      claimDailyMission,
      setTreinoMissaoConfig,
      gerarMissaoDoDiaTreino,
      aplicarSemanaTreino,
      setDietaPerfil,
      setDietaConfig,
      setDietaSemana,
      gerarCardapioDoDia,
      registrarRefeicaoComida,
      bumpCounter,
      celebrations,
      dismissCelebration,
    }),
    [
      state,
      ready,
      today,
      weekday,
      latestBodyWeight,
      waterTargetMl,
      habitStreak,
      dayActive,
      currentOfensiva,
      toggleHabit,
      addHabit,
      deleteHabit,
      addWater,
      deleteWaterEntry,
      saveSleep,
      deleteSleepEntry,
      workoutDayKey,
      toggleExercise,
      addExercise,
      deleteExercise,
      setExerciseWeight,
      addWeightEntry,
      deleteWeightEntry,
      startWorkoutTimer,
      pauseWorkoutTimer,
      finishWorkoutTimer,
      addGoal,
      deleteGoal,
      depositToGoal,
      withdrawFromGoal,
      setGoalDeadline,
      setProfileName,
      setProfileAvatar,
      setBonecoSexo,
      setCharacterClass,
      respecCharacter,
      resetAllData,
      longestHabitStreak,
      avgSleepLast7d,
      isMissionDone,
      claimDailyMission,
      setTreinoMissaoConfig,
      gerarMissaoDoDiaTreino,
      aplicarSemanaTreino,
      setDietaPerfil,
      setDietaConfig,
      setDietaSemana,
      gerarCardapioDoDia,
      registrarRefeicaoComida,
      bumpCounter,
      celebrations,
      dismissCelebration,
    ]
  );

  return <LifeQuestContext.Provider value={value}>{children}</LifeQuestContext.Provider>;
}

export function useLifeQuest(): Ctx {
  const ctx = useContext(LifeQuestContext);
  if (!ctx) throw new Error('useLifeQuest deve ser usado dentro de LifeQuestProvider');
  return ctx;
}

export { dateKeyOffset };
