import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Gauge } from '@/components/Gauge';
import { BigFigure, Card, Eyebrow, PillButton, SectionTitle, SubText, XpBadge } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { SLEEP_TARGET_H, XP_HABIT, useLifeQuest } from '@/store/LifeQuestStore';

const ML_PER_KG = 35;

function fmtLiters(ml: number): string {
  return (ml / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sleepHoursFromTimes(bed?: string, wake?: string): number | null {
  if (!bed || !wake) return null;
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let diff = wh * 60 + wm - (bh * 60 + bm);
  if (diff <= 0) diff += 24 * 60;
  return Math.round((diff / 60) * 10) / 10;
}

function CheckIcon({ checked }: { checked: boolean }) {
  if (!checked) return null;
  return (
    <Svg width={13} height={13} viewBox="0 0 16 16" fill="none">
      <Path d="M3 8.5L6.2 11.5L13 4.5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function RotinaScreen() {
  const { state, today, addWater, saveSleep, toggleHabit, addHabit, deleteHabit, habitStreak, latestBodyWeight, waterTargetMl } =
    useLifeQuest();

  const [newHabit, setNewHabit] = useState('');
  const [bed, setBed] = useState(state.sleepLog[today]?.bed ?? '');
  const [wake, setWake] = useState(state.sleepLog[today]?.wake ?? '');

  const consumed = state.waterLog[today] || 0;
  const target = waterTargetMl();
  const weight = latestBodyWeight();
  const waterPct = target ? Math.min(100, Math.round((consumed / target) * 100)) : 0;

  const hours = sleepHoursFromTimes(state.sleepLog[today]?.bed, state.sleepLog[today]?.wake);
  const sleepPct = hours ? Math.min(100, Math.round((hours / SLEEP_TARGET_H) * 100)) : 0;

  const doneToday = state.habitHistory[today] || [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.healthGrid}>
        <Card style={styles.healthCard}>
          <Eyebrow>Meta de água hoje</Eyebrow>
          <Gauge pct={waterPct} icon="💧" />
          <BigFigure style={styles.centered}>
            {fmtLiters(consumed)}
            <Text style={styles.figureSmall}> / {target ? fmtLiters(target) : '—'} L</Text>
          </BigFigure>
          <SubText style={styles.centered}>
            {!target
              ? 'Registre seu peso na aba Academia'
              : consumed >= target
                ? 'Meta batida hoje 💧'
                : `${fmtLiters(target - consumed)} L restantes`}
          </SubText>
          <View style={styles.waterActions}>
            <PillButton label="− 250ml" variant="ghost" onPress={() => addWater(-250)} style={styles.waterBtn} />
            <PillButton label="+ 250ml" variant="ghost" onPress={() => addWater(250)} style={styles.waterBtn} />
            <PillButton label="+ 500ml" variant="ghost" onPress={() => addWater(500)} style={styles.waterBtn} />
          </View>
          {weight && (
            <SubText style={styles.hint}>
              Peso: {weight.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg × {ML_PER_KG}ml · +15 XP ao bater a meta
            </SubText>
          )}
        </Card>

        <Card style={styles.healthCard}>
          <Eyebrow>Sono da última noite</Eyebrow>
          <Gauge pct={sleepPct} icon="😴" color={LQ.gold} />
          <BigFigure style={styles.centered}>
            {hours ?? 0}
            <Text style={styles.figureSmall}>h / {SLEEP_TARGET_H}h</Text>
          </BigFigure>
          <SubText style={styles.centered}>
            {hours === null
              ? 'Ainda não registrado hoje'
              : hours >= SLEEP_TARGET_H
                ? 'Meta de sono batida 🌙'
                : `${(SLEEP_TARGET_H - hours).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h a menos que o recomendado`}
          </SubText>
          <View style={styles.sleepInputs}>
            <View style={styles.sleepField}>
              <Text style={styles.sleepLabel}>Dormi às</Text>
              <TextInput
                value={bed}
                onChangeText={setBed}
                placeholder="23:00"
                placeholderTextColor={LQ.inkFaint}
                style={styles.timeInput}
              />
            </View>
            <View style={styles.sleepField}>
              <Text style={styles.sleepLabel}>Acordei às</Text>
              <TextInput
                value={wake}
                onChangeText={setWake}
                placeholder="07:00"
                placeholderTextColor={LQ.inkFaint}
                style={styles.timeInput}
              />
            </View>
          </View>
          <PillButton label="Registrar" variant="ghost" onPress={() => saveSleep(bed, wake)} style={{ marginTop: 10 }} />
          <SubText style={styles.hint}>Recomendado: {SLEEP_TARGET_H}h por noite · +15 XP ao bater a meta</SubText>
        </Card>
      </View>

      <SectionTitle>Checklist de hoje</SectionTitle>
      <Card>
        {state.habits.length === 0 ? (
          <SubText>Nenhum hábito ainda. Adicione um abaixo.</SubText>
        ) : (
          state.habits.map((h, i) => {
            const done = doneToday.includes(h.id);
            const streak = habitStreak(h.id);
            return (
              <View key={h.id} style={[styles.habitRow, i > 0 && styles.habitRowBorder]}>
                <Pressable onPress={() => toggleHabit(h.id)} style={[styles.checkbox, done && styles.checkboxDone]}>
                  <CheckIcon checked={done} />
                </Pressable>
                <Text style={[styles.habitName, done && styles.habitNameDone]}>{h.name}</Text>
                {streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakBadgeText}>{streak}d seguidos</Text>
                  </View>
                )}
                <XpBadge amount={XP_HABIT} />
                <Pressable onPress={() => deleteHabit(h.id)} hitSlop={8} style={{ marginLeft: 4 }}>
                  <Text style={{ color: LQ.inkFaint, fontSize: 16 }}>✕</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </Card>
      <View style={styles.addRow}>
        <TextInput
          value={newHabit}
          onChangeText={setNewHabit}
          placeholder="Novo hábito, ex.: Meditar 10 minutos"
          placeholderTextColor={LQ.inkFaint}
          style={styles.addInput}
        />
        <PillButton
          label="Adicionar"
          onPress={() => {
            addHabit(newHabit);
            setNewHabit('');
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LQ.paper },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  healthGrid: { flexDirection: 'row', gap: 12 },
  healthCard: { flex: 1 },
  centered: { textAlign: 'center', alignSelf: 'center', marginTop: -4 },
  figureSmall: { fontSize: 14, color: LQ.inkSoft, fontWeight: '500' },
  waterActions: { flexDirection: 'row', gap: 6, marginTop: 12 },
  waterBtn: { flex: 1, paddingHorizontal: 4 },
  hint: { fontSize: 11, marginTop: 8, textAlign: 'center' },
  sleepInputs: { flexDirection: 'row', gap: 8, marginTop: 12 },
  sleepField: { flex: 1, gap: 4 },
  sleepLabel: { fontSize: 10, color: LQ.inkFaint, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  timeInput: {
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    color: LQ.ink,
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  habitRowBorder: { borderTopWidth: 1, borderTopColor: LQ.line },
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
  habitName: { flex: 1, color: LQ.ink, fontSize: 14 },
  habitNameDone: { color: LQ.inkFaint, textDecorationLine: 'line-through' },
  streakBadge: { backgroundColor: LQ.goldSoft, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  streakBadgeText: { color: LQ.goldInk, fontSize: 10, fontWeight: '600' },
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
