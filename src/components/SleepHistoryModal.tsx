import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { LQ } from '@/constants/life-quest-theme';
import { SleepEntry } from '@/store/types';

function durationLabel(bed: string, wake: string): string {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let diff = wh * 60 + wm - (bh * 60 + bm);
  if (diff <= 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

type Props = {
  visible: boolean;
  entries: Record<string, SleepEntry>;
  onClose: () => void;
  onDelete: (date: string) => void;
};

export function SleepHistoryModal({ visible, entries, onClose, onDelete }: Props) {
  const rows = Object.entries(entries)
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
            <Text style={styles.title}>Histórico de sono</Text>
            <View style={{ width: 34 }} />
          </View>

          <FlatList
            data={rows}
            keyExtractor={([date]) => date}
            style={styles.list}
            contentContainerStyle={{ gap: 8 }}
            ListEmptyComponent={<Text style={styles.empty}>Nenhum registro de sono ainda.</Text>}
            renderItem={({ item: [date, entry] }) => (
              <View style={styles.row}>
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
                <Pressable onPress={() => onDelete(date)} hitSlop={8}>
                  <Text style={{ color: LQ.inkFaint, fontSize: 16, marginLeft: 8 }}>✕</Text>
                </Pressable>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  panel: {
    maxHeight: '80%',
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
  list: {},
  empty: { color: LQ.inkFaint, textAlign: 'center', paddingVertical: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: 12,
    backgroundColor: LQ.paper,
  },
  rowDate: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 13, textTransform: 'capitalize' },
  rowTimes: { color: LQ.inkSoft, fontSize: 12, marginTop: 3 },
  rowDuration: { color: LQ.gold, fontFamily: LQ.fontMono, fontSize: 13 },
});
