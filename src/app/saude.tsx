import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Gauge } from '@/components/Gauge';
import { HealthConnectCard } from '@/components/HealthConnectCard';
import { SleepEntryModal } from '@/components/SleepEntryModal';
import { BigFigure, Card, Eyebrow, PillButton, SubText } from '@/components/ui';
import { WaterEntryModal } from '@/components/WaterEntryModal';
import { LQ } from '@/constants/life-quest-theme';
import { SLEEP_TARGET_H, useLifeQuest } from '@/store/LifeQuestStore';

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
  const { state, today, waterTargetMl } = useLifeQuest();

  const [waterModalOpen, setWaterModalOpen] = useState(false);
  const [sleepModalOpen, setSleepModalOpen] = useState(false);

  const todaySleep = state.sleepLog[today];
  const consumed = state.waterLog[today] || 0;
  const target = waterTargetMl();
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
          <PillButton
            label="Registrar água"
            variant="ghost"
            onPress={() => setWaterModalOpen(true)}
            style={{ marginTop: 12 }}
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
            label="Registrar sono"
            variant="ghost"
            onPress={() => setSleepModalOpen(true)}
            style={{ marginTop: 12 }}
          />
        </Card>
      </View>

      <WaterEntryModal visible={waterModalOpen} onClose={() => setWaterModalOpen(false)} />
      <SleepEntryModal visible={sleepModalOpen} onClose={() => setSleepModalOpen(false)} />
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
});
