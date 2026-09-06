import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Gauge } from '@/components/Gauge';
import { HealthConnectCard } from '@/components/HealthConnectCard';
import { hmFromMinutes, minutesFromHM, SleepDial } from '@/components/SleepDial';
import { SleepHistoryModal } from '@/components/SleepHistoryModal';
import { BigFigure, Card, Eyebrow, PillButton, SectionTitle, SubText } from '@/components/ui';
import { WaterHistoryModal } from '@/components/WaterHistoryModal';
import { LQ } from '@/constants/life-quest-theme';
import { SLEEP_TARGET_H, useLifeQuest } from '@/store/LifeQuestStore';

const ML_PER_KG = 35;
const DEFAULT_BED_MIN = 23 * 60;
const DEFAULT_WAKE_MIN = 7 * 60;

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
  const { state, today, addWater, deleteWaterEntry, saveSleep, deleteSleepEntry, latestBodyWeight, waterTargetMl } =
    useLifeQuest();

  const todaySleep = state.sleepLog[today];
  const [bedMin, setBedMin] = useState(minutesFromHM(todaySleep?.bed ?? '', DEFAULT_BED_MIN));
  const [wakeMin, setWakeMin] = useState(minutesFromHM(todaySleep?.wake ?? '', DEFAULT_WAKE_MIN));
  const [sleepHistoryOpen, setSleepHistoryOpen] = useState(false);
  const [waterHistoryOpen, setWaterHistoryOpen] = useState(false);

  const consumed = state.waterLog[today] || 0;
  const target = waterTargetMl();
  const weight = latestBodyWeight();
  const waterPct = target ? Math.min(100, Math.round((consumed / target) * 100)) : 0;

  const hours = sleepHoursFromTimes(todaySleep?.bed, todaySleep?.wake);
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
          <PillButton
            label="Ver histórico"
            variant="ghost"
            onPress={() => setWaterHistoryOpen(true)}
            style={{ marginTop: 10 }}
          />
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
          <PillButton
            label="Ver histórico"
            variant="ghost"
            onPress={() => setSleepHistoryOpen(true)}
            style={{ marginTop: 10 }}
          />
        </Card>
      </View>

      <SectionTitle>Registrar sono</SectionTitle>
      <Card>
        <SleepDial bedMinutes={bedMin} wakeMinutes={wakeMin} onChange={(b, w) => { setBedMin(b); setWakeMin(w); }} />
        <View style={styles.sleepActions}>
          <PillButton
            label="Registrar"
            onPress={() => saveSleep(hmFromMinutes(bedMin), hmFromMinutes(wakeMin))}
            style={{ flex: 1 }}
          />
        </View>
        {!!todaySleep && (
          <PillButton
            label="Excluir registro de sono"
            variant="ghost"
            onPress={() => {
              deleteSleepEntry(today);
              setBedMin(DEFAULT_BED_MIN);
              setWakeMin(DEFAULT_WAKE_MIN);
            }}
            style={{ marginTop: 10 }}
          />
        )}
        <SubText style={styles.hint}>Recomendado: {SLEEP_TARGET_H}h por noite · +15 XP ao bater a meta</SubText>
      </Card>

      <SleepHistoryModal
        visible={sleepHistoryOpen}
        entries={state.sleepLog}
        onClose={() => setSleepHistoryOpen(false)}
        onDelete={deleteSleepEntry}
      />
      <WaterHistoryModal
        visible={waterHistoryOpen}
        entries={state.waterLog}
        onClose={() => setWaterHistoryOpen(false)}
        onDelete={deleteWaterEntry}
      />
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
  hint: { fontSize: 11, marginTop: 14, textAlign: 'center' },
  sleepActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
});
