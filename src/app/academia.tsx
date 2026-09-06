import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ExercisePickerModal } from '@/components/ExercisePickerModal';
import { BigFigure, Card, Eyebrow, PillButton, SectionTitle, SubText, XpBadge } from '@/components/ui';
import { WeightChart } from '@/components/WeightChart';
import { LQ } from '@/constants/life-quest-theme';
import {
  fetchTodayHealthMetrics,
  hasHealthPermissions,
  HealthMetrics,
  isHealthConnectSupported,
  openHealthConnectSettings,
  requestHealthPermissions,
} from '@/services/healthConnect';
import { fmtDuration } from '@/store/dates';
import { XP_EXERCISE, useLifeQuest } from '@/store/LifeQuestStore';
import { LibraryExercise } from '@/store/exercise-library';
import { WEEKDAY_FULL, WEEKDAYS } from '@/store/types';

type HealthStatus = 'checking' | 'unsupported' | 'need-permission' | 'ready';

function CheckIcon({ checked }: { checked: boolean }) {
  if (!checked) return null;
  return (
    <Svg width={13} height={13} viewBox="0 0 16 16" fill="none">
      <Path d="M3 8.5L6.2 11.5L13 4.5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function AcademiaScreen() {
  const {
    state,
    today,
    currentWeekdayKey,
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
  } = useLifeQuest();

  const [activeWeekday, setActiveWeekday] = useState<string>(currentWeekdayKey);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [, forceTick] = useState(0);

  const [healthStatus, setHealthStatus] = useState<HealthStatus>('checking');
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [healthSyncing, setHealthSyncing] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'android' || !(await isHealthConnectSupported())) {
        setHealthStatus('unsupported');
        return;
      }
      if (await hasHealthPermissions()) {
        setHealthStatus('ready');
        setHealthMetrics(await fetchTodayHealthMetrics());
      } else {
        setHealthStatus('need-permission');
      }
    })();
  }, []);

  const connectHealth = async () => {
    setHealthSyncing(true);
    const granted = await requestHealthPermissions();
    if (granted) {
      setHealthStatus('ready');
      setHealthMetrics(await fetchTodayHealthMetrics());
    }
    setHealthSyncing(false);
  };

  const syncHealth = async () => {
    setHealthSyncing(true);
    setHealthMetrics(await fetchTodayHealthMetrics());
    setHealthSyncing(false);
  };

  const plan = state.workoutPlan[activeWeekday];
  const dayKey = workoutDayKey(activeWeekday);
  const log = state.workoutLog[dayKey] || {};

  const timer = state.workoutTimer;
  const running = timer.date === today && !!timer.runningSince;
  const paused = timer.date === today && !running && timer.accumulatedSeconds > 0;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const elapsed =
    timer.date === today ? timer.accumulatedSeconds + (timer.runningSince ? (Date.now() - timer.runningSince) / 1000 : 0) : 0;

  const durationToday = state.workoutDurations[today];

  const sortedWeights = [...state.bodyWeightLog].sort((a, b) => a.date.localeCompare(b.date));
  const lastWeight = sortedWeights[sortedWeights.length - 1];
  const prevWeight = sortedWeights[sortedWeights.length - 2];
  const delta = lastWeight && prevWeight ? +(lastWeight.weight - prevWeight.weight).toFixed(1) : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.timerCard}>
        <Eyebrow>Tempo de treino</Eyebrow>
        <BigFigure style={styles.timerFigure}>{fmtDuration(elapsed)}</BigFigure>
        <SubText style={{ textAlign: 'center' }}>
          {running
            ? 'Treino em andamento'
            : paused
              ? 'Pausado — toque em iniciar para continuar'
              : durationToday
                ? `Treino de hoje: ${fmtDuration(durationToday)} registrados`
                : 'Toque em iniciar quando começar a treinar'}
        </SubText>
        <View style={styles.timerActions}>
          {!running && <PillButton label="Iniciar" variant="ghost" onPress={startWorkoutTimer} style={styles.timerBtn} />}
          {running && <PillButton label="Pausar" variant="ghost" onPress={pauseWorkoutTimer} style={styles.timerBtn} />}
          {(running || paused) && <PillButton label="Finalizar treino" onPress={finishWorkoutTimer} style={styles.timerBtn} />}
        </View>
      </Card>

      {healthStatus !== 'unsupported' && (
        <Card>
          <Eyebrow>Google Saúde</Eyebrow>
          {healthStatus === 'checking' && <SubText>Verificando Health Connect…</SubText>}
          {healthStatus === 'need-permission' && (
            <>
              <SubText style={{ marginBottom: 12 }}>
                Conecte para trazer passos, calorias e tempo de exercício de hoje direto do Health Connect.
              </SubText>
              <PillButton
                label={healthSyncing ? 'Conectando…' : 'Conectar'}
                variant="ghost"
                disabled={healthSyncing}
                onPress={connectHealth}
              />
            </>
          )}
          {healthStatus === 'ready' && (
            <>
              <View style={styles.healthRow}>
                <View style={styles.healthMetric}>
                  <Text style={styles.healthValue}>{healthMetrics?.steps ?? '—'}</Text>
                  <SubText>passos</SubText>
                </View>
                <View style={styles.healthMetric}>
                  <Text style={styles.healthValue}>{healthMetrics?.calories ?? '—'}</Text>
                  <SubText>kcal</SubText>
                </View>
                <View style={styles.healthMetric}>
                  <Text style={styles.healthValue}>{healthMetrics?.exerciseMinutes ?? '—'}</Text>
                  <SubText>min exercício</SubText>
                </View>
              </View>
              <View style={styles.healthLinksRow}>
                <Pressable onPress={syncHealth} hitSlop={8}>
                  <Text style={styles.healthLink}>{healthSyncing ? 'Sincronizando…' : 'Sincronizar'}</Text>
                </Pressable>
                <Pressable onPress={openHealthConnectSettings} hitSlop={8}>
                  <Text style={styles.healthLink}>Gerenciar permissões</Text>
                </Pressable>
              </View>
            </>
          )}
        </Card>
      )}

      <SectionTitle>Plano semanal</SectionTitle>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((wd) => (
          <Pressable
            key={wd}
            onPress={() => setActiveWeekday(wd)}
            style={[styles.weekdayPill, activeWeekday === wd && styles.weekdayPillActive]}>
            <Text style={[styles.weekdayText, activeWeekday === wd && styles.weekdayTextActive]}>
              {wd}
              {wd === currentWeekdayKey ? ' •' : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <Text style={styles.planTitle}>{plan?.title || 'Descanso'}</Text>
        {!plan || plan.exercises.length === 0 ? (
          <SubText>Dia de descanso. Sem exercícios programados.</SubText>
        ) : (
          plan.exercises.map((ex, i) => {
            const done = !!log[ex.id];
            return (
              <View key={ex.id} style={[styles.exRow, i > 0 && styles.exRowBorder]}>
                <Pressable
                  onPress={() => toggleExercise(activeWeekday, ex.id)}
                  style={[styles.checkbox, done && styles.checkboxDone]}>
                  <CheckIcon checked={done} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exName, done && styles.exNameDone]}>{ex.name}</Text>
                  <Text style={styles.exTarget}>{ex.target}</Text>
                </View>
                <TextInput
                  value={String(ex.weight || '')}
                  onChangeText={(v) => setExerciseWeight(activeWeekday, ex.id, Number(v) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={LQ.inkFaint}
                  style={styles.weightInput}
                />
                <Text style={styles.kgLabel}>kg</Text>
                <XpBadge amount={XP_EXERCISE} />
                <Pressable onPress={() => deleteExercise(activeWeekday, ex.id)} hitSlop={8}>
                  <Text style={{ color: LQ.inkFaint, fontSize: 16, marginLeft: 4 }}>✕</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </Card>
      <PillButton label="+ Adicionar exercício" onPress={() => setPickerOpen(true)} style={{ width: '100%' }} />

      <SectionTitle>Peso corporal — registro semanal</SectionTitle>
      {lastWeight && (
        <View style={styles.weightLatestRow}>
          <BigFigure>{lastWeight.weight.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg</BigFigure>
          {delta !== null && (
            <Text style={[styles.delta, delta < 0 ? styles.deltaDown : styles.deltaUp]}>
              {delta > 0 ? '+' : ''}
              {delta.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg desde o último
            </Text>
          )}
        </View>
      )}
      <WeightChart entries={state.bodyWeightLog} />
      <Card>
        {state.bodyWeightLog.length === 0 ? (
          <SubText>Registre seu peso semanalmente para ver a evolução.</SubText>
        ) : (
          [...state.bodyWeightLog]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((entry, i) => (
              <View key={entry.id} style={[styles.weightRow, i > 0 && styles.exRowBorder]}>
                <Text style={styles.weightRowDate}>
                  {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </Text>
                <Text style={styles.weightRowValue}>
                  {entry.weight.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg
                </Text>
                <Pressable onPress={() => deleteWeightEntry(entry.id)} hitSlop={8}>
                  <Text style={{ color: LQ.inkFaint, fontSize: 16 }}>✕</Text>
                </Pressable>
              </View>
            ))
        )}
      </Card>
      <View style={styles.addRow}>
        <TextInput
          value={weightInput}
          onChangeText={setWeightInput}
          placeholder="Peso (kg)"
          placeholderTextColor={LQ.inkFaint}
          keyboardType="numeric"
          style={styles.addInput}
        />
        <PillButton
          label="Registrar"
          onPress={() => {
            const val = Number(weightInput.replace(',', '.'));
            if (!val || val <= 0) return;
            addWeightEntry(today, val);
            setWeightInput('');
          }}
        />
      </View>

      <ExercisePickerModal
        visible={pickerOpen}
        weekdayLabel={WEEKDAY_FULL[WEEKDAYS.indexOf(activeWeekday as (typeof WEEKDAYS)[number])]}
        existingNames={plan?.exercises.map((e) => e.name) ?? []}
        onClose={() => setPickerOpen(false)}
        onAdd={(ex: LibraryExercise) => addExercise(activeWeekday, ex.name, ex.target, 0)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LQ.paper },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  timerCard: { alignItems: 'center' },
  timerFigure: { fontSize: 32, textAlign: 'center', marginVertical: 4 },
  timerActions: { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'center' },
  timerBtn: { minWidth: 110 },
  healthRow: { flexDirection: 'row' },
  healthMetric: { flex: 1, alignItems: 'center' },
  healthValue: { color: LQ.ink, fontFamily: LQ.fontMono, fontSize: 20 },
  healthLinksRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 14 },
  healthLink: { color: LQ.gold, fontSize: 12, fontFamily: LQ.fontBodySemiBold },
  weekdayRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  weekdayPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: LQ.line,
    backgroundColor: LQ.paperRaised,
  },
  weekdayPillActive: { backgroundColor: LQ.gold, borderColor: LQ.gold },
  weekdayText: { color: LQ.inkSoft, fontSize: 12, fontFamily: LQ.fontMono },
  weekdayTextActive: { color: '#fff' },
  planTitle: { color: LQ.ink, fontWeight: '700', fontSize: 15, textTransform: 'uppercase', marginBottom: 6 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  exRowBorder: { borderTopWidth: 1, borderTopColor: LQ.line },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: LQ.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: LQ.gold, borderColor: LQ.gold },
  exName: { color: LQ.ink, fontSize: 14 },
  exNameDone: { color: LQ.inkFaint, textDecorationLine: 'line-through' },
  exTarget: { color: LQ.inkSoft, fontSize: 11, fontFamily: LQ.fontMono, marginTop: 2 },
  weightInput: {
    width: 46,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: 8,
    color: LQ.ink,
    textAlign: 'center',
    paddingVertical: 4,
  },
  kgLabel: { color: LQ.inkSoft, fontSize: 11 },
  weightLatestRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  delta: { fontSize: 12, fontFamily: LQ.fontMono },
  deltaDown: { color: LQ.gold },
  deltaUp: { color: LQ.danger },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  weightRowDate: { color: LQ.ink, fontSize: 13, flex: 1 },
  weightRowValue: { color: LQ.ink, fontSize: 13, fontFamily: LQ.fontMono },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: {
    flex: 1,
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    color: LQ.ink,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
});
