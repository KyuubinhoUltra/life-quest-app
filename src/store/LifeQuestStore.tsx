import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { createDefaultState } from './default-state';
import { currentWeekday, dateKeyOffset, todayStr } from './dates';
import { LifeQuestState } from './types';

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
  saveSleep: (bed: string, wake: string) => void;
  deleteSleepEntry: () => void;
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
  setCharacterClass: (
    classe: LifeQuestState['character']['classe'],
    afinidade: LifeQuestState['character']['afinidade']
  ) => void;
  respecCharacter: () => void;
  resetAllData: () => Promise<void>;
  longestHabitStreak: () => number;
  avgSleepLast7d: () => number | null;
};

const LifeQuestContext = createContext<Ctx | null>(null);

export function LifeQuestProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LifeQuestState>(createDefaultState);
  const [ready, setReady] = useState(false);
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

  const deleteSleepEntry = useCallback(() => {
    setState((prev) => {
      if (!prev.sleepLog[today]) return prev;
      const next = { ...prev.sleepLog };
      delete next[today];
      return { ...prev, sleepLog: next };
    });
  }, [today]);

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
      setCharacterClass,
      respecCharacter,
      resetAllData,
      longestHabitStreak,
      avgSleepLast7d,
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
      setCharacterClass,
      respecCharacter,
      resetAllData,
      longestHabitStreak,
      avgSleepLast7d,
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
