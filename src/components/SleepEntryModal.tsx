import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { hmFromMinutes, minutesFromHM, SleepDial } from '@/components/SleepDial';
import { PillButton, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { SLEEP_TARGET_H, useLifeQuest } from '@/store/LifeQuestStore';

const DEFAULT_BED_MIN = 23 * 60;
const DEFAULT_WAKE_MIN = 7 * 60;

function durationLabel(bed: string, wake: string): string {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let diff = wh * 60 + wm - (bh * 60 + bm);
  if (diff <= 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export function SleepEntryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, today, saveSleep, deleteSleepEntry } = useLifeQuest();
  const todaySleep = state.sleepLog[today];
  const [bedMin, setBedMin] = useState(minutesFromHM(todaySleep?.bed ?? '', DEFAULT_BED_MIN));
  const [wakeMin, setWakeMin] = useState(minutesFromHM(todaySleep?.wake ?? '', DEFAULT_WAKE_MIN));

  const rows = Object.entries(state.sleepLog)
    .filter(([, v]) => v?.bed && v?.wake)
    .sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
            <Text style={styles.title}>Registrar sono</Text>
            <View style={{ width: 34 }} />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            <SleepDial
              bedMinutes={bedMin}
              wakeMinutes={wakeMin}
              onChange={(b, w) => {
                setBedMin(b);
                setWakeMin(w);
              }}
            />
            <PillButton
              label="Registrar"
              onPress={() => saveSleep(hmFromMinutes(bedMin), hmFromMinutes(wakeMin))}
              style={{ marginTop: 16 }}
            />
            {!!todaySleep && (
              <PillButton
                label="Excluir registro de hoje"
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

            <Text style={styles.sectionTitle}>Histórico</Text>
            {rows.length === 0 ? (
              <SubText>Nenhum registro de sono ainda.</SubText>
            ) : (
              rows.map(([date, entry]) => (
                <View key={date} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowDate}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </Text>
                    <Text style={styles.rowTimes}>
                      🛏 {entry.bed} → ⏰ {entry.wake}
                    </Text>
                  </View>
                  <Text style={styles.rowDuration}>{durationLabel(entry.bed, entry.wake)}</Text>
                  <Pressable onPress={() => deleteSleepEntry(date)} hitSlop={8}>
                    <Text style={{ color: LQ.inkFaint, fontSize: 16, marginLeft: 8 }}>✕</Text>
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  panel: {
    maxHeight: '88%',
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    padding: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LQ.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: LQ.ink, fontSize: 14 },
  title: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  hint: { fontSize: 11, marginTop: 14, textAlign: 'center' },
  sectionTitle: {
    color: LQ.ink,
    fontFamily: LQ.fontDisplay,
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 26,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: 12,
    backgroundColor: LQ.paper,
    marginBottom: 8,
  },
  rowDate: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 13, textTransform: 'capitalize' },
  rowTimes: { color: LQ.inkSoft, fontSize: 12, marginTop: 3 },
  rowDuration: { color: LQ.gold, fontFamily: LQ.fontMono, fontSize: 13 },
});
