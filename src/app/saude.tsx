import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Gauge } from '@/components/Gauge';
import { HealthConnectCard } from '@/components/HealthConnectCard';
import { BigFigure, Card, Eyebrow, PillButton, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { SLEEP_TARGET_H, useLifeQuest } from '@/store/LifeQuestStore';

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

export default function SaudeScreen() {
  const { state, today, addWater, saveSleep, latestBodyWeight, waterTargetMl } = useLifeQuest();

  const [bed, setBed] = useState(state.sleepLog[today]?.bed ?? '');
  const [wake, setWake] = useState(state.sleepLog[today]?.wake ?? '');

  const consumed = state.waterLog[today] || 0;
  const target = waterTargetMl();
  const weight = latestBodyWeight();
  const waterPct = target ? Math.min(100, Math.round((consumed / target) * 100)) : 0;

  const hours = sleepHoursFromTimes(state.sleepLog[today]?.bed, state.sleepLog[today]?.wake);
  const sleepPct = hours ? Math.min(100, Math.round((hours / SLEEP_TARGET_H) * 100)) : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <HealthConnectCard />

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
              ? 'Registre seu peso na aba Treino'
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
});
