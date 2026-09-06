import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BigFigure, Card, Eyebrow, ProgressBar, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { dateKeyOffset } from '@/store/dates';
import { useLifeQuest } from '@/store/LifeQuestStore';
import { WEEKDAYS } from '@/store/types';

export default function DashboardScreen() {
  const { state, today, currentWeekdayKey, dayActive, currentOfensiva } = useLifeQuest();

  const doneToday = state.habitHistory[today] || [];
  const totalHabits = state.habits.length;
  const doneHabits = state.habits.filter((h) => doneToday.includes(h.id)).length;

  const plan = state.workoutPlan[currentWeekdayKey];
  const workoutLog = state.workoutLog[today] || {};
  const exDone = plan ? plan.exercises.filter((e) => workoutLog[e.id]).length : 0;
  const exTotal = plan ? plan.exercises.length : 0;

  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);
  const totalSaved = state.goals.reduce((s, g) => s + g.saved, 0);

  const ofensiva = currentOfensiva();
  const lit = ofensiva > 0;

  const last7 = Array.from({ length: 7 }, (_, i) => 6 - i).map((i) => {
    const key = dateKeyOffset(i);
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = WEEKDAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
    return { key, label, active: dayActive(key), isToday: key === today };
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.ofensivaCard}>
        <View style={styles.ofensivaTopRow}>
          <Text style={[styles.flame, !lit && styles.flameOff]}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.ofensivaCount} numberOfLines={1} adjustsFontSizeToFit>
              <Text style={styles.ofensivaCountStrong}>{ofensiva}</Text>{' '}
              {ofensiva === 1 ? 'dia de ofensiva' : 'dias de ofensiva'}
            </Text>
            <SubText>Recorde: {state.stats.bestStreak} {state.stats.bestStreak === 1 ? 'dia' : 'dias'}</SubText>
          </View>
        </View>
        <View style={styles.ofensivaDays}>
          {last7.map((d) => (
            <View
              key={d.key}
              style={[
                styles.ofensivaDay,
                d.active && styles.ofensivaDayActive,
                d.isToday && styles.ofensivaDayToday,
              ]}>
              <Text style={{ fontSize: d.active ? 20 : 12 }}>{d.active ? '🔥' : '·'}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.summaryGrid}>
        <Card style={styles.summaryCard}>
          <Eyebrow>Hábitos hoje</Eyebrow>
          <BigFigure>
            {doneHabits}
            <Text style={styles.figureSmall}>/{totalHabits}</Text>
          </BigFigure>
          <ProgressBar pct={totalHabits ? (doneHabits / totalHabits) * 100 : 0} />
          <SubText>
            {totalHabits === 0
              ? 'Nenhum hábito cadastrado'
              : doneHabits === totalHabits
                ? 'Tudo em dia hoje'
                : `${totalHabits - doneHabits} restando hoje`}
          </SubText>
        </Card>

        <Card style={styles.summaryCard}>
          <Eyebrow>Treino de hoje</Eyebrow>
          <BigFigure style={{ fontSize: 17 }}>{plan ? plan.title : '—'}</BigFigure>
          <ProgressBar pct={exTotal ? (exDone / exTotal) * 100 : 0} color={LQ.gold} />
          <SubText>{exTotal === 0 ? 'Dia de descanso' : `${exDone} de ${exTotal} exercícios feitos`}</SubText>
        </Card>

        <Card style={styles.summaryCard}>
          <Eyebrow>Metas financeiras</Eyebrow>
          <BigFigure>{formatBRL(totalSaved)}</BigFigure>
          <ProgressBar pct={totalTarget ? Math.min(100, (totalSaved / totalTarget) * 100) : 0} />
          <SubText>
            {state.goals.length} meta(s) · alvo total {formatBRL(totalTarget)}
          </SubText>
        </Card>
      </View>

      <Card>
        <Eyebrow>Últimos 7 dias · hábitos concluídos</Eyebrow>
        <View style={styles.streakRow}>
          {last7.map((d) => {
            const list = state.habitHistory[d.key] || [];
            const full = state.habits.length > 0 && list.length === state.habits.length;
            return (
              <View key={d.key} style={styles.streakCell}>
                <View style={[styles.streakDot, full && styles.streakDotFull, d.isToday && styles.streakDotToday]}>
                  <Text style={[styles.streakDotText, full && styles.streakDotTextFull]}>{list.length}</Text>
                </View>
                <Text style={styles.streakLabel}>{d.label}</Text>
              </View>
            );
          })}
        </View>
      </Card>
    </ScrollView>
  );
}

function formatBRL(n: number): string {
  return 'R$' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LQ.paper },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  ofensivaCard: { gap: 14 },
  ofensivaTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flame: { fontSize: 34 },
  flameOff: { opacity: 0.35 },
  ofensivaCount: { color: LQ.ink, fontSize: 15, fontFamily: LQ.fontBodyBold, textTransform: 'uppercase' },
  ofensivaCountStrong: { color: LQ.goldInk },
  ofensivaDays: { flexDirection: 'row', gap: 6 },
  ofensivaDay: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: LQ.lineSoft,
    borderWidth: 1,
    borderColor: LQ.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ofensivaDayActive: { backgroundColor: LQ.goldSoft, borderColor: LQ.gold },
  ofensivaDayToday: { borderColor: LQ.ink, borderWidth: 1.5 },
  summaryGrid: { gap: 12 },
  summaryCard: {},
  figureSmall: { fontSize: 15, color: LQ.inkSoft, fontWeight: '500' },
  streakRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  streakCell: { flex: 1, alignItems: 'center' },
  streakDot: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    backgroundColor: LQ.lineSoft,
    borderWidth: 1,
    borderColor: LQ.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  streakDotFull: { backgroundColor: LQ.goldSoft, borderColor: LQ.gold },
  streakDotToday: { borderWidth: 1.5, borderColor: LQ.ink },
  streakDotText: { color: LQ.inkFaint, fontSize: 11, fontWeight: '600' },
  streakDotTextFull: { color: LQ.goldInk },
  streakLabel: { color: LQ.inkFaint, fontSize: 10 },
});
