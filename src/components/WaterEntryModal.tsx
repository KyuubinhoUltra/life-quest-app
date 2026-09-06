import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PillButton, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { useLifeQuest } from '@/store/LifeQuestStore';

const ML_PER_KG = 35;

function fmtLiters(ml: number): string {
  return (ml / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function WaterEntryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, today, addWater, deleteWaterEntry, latestBodyWeight, waterTargetMl } = useLifeQuest();
  const consumed = state.waterLog[today] || 0;
  const target = waterTargetMl();
  const weight = latestBodyWeight();

  const rows = Object.entries(state.waterLog)
    .filter(([, ml]) => ml > 0)
    .sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
            <Text style={styles.title}>Registrar água</Text>
            <View style={{ width: 34 }} />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.figure}>
              {fmtLiters(consumed)} <Text style={styles.figureSmall}>/ {target ? fmtLiters(target) : '—'} L</Text>
            </Text>
            <View style={styles.actions}>
              <PillButton label="− 250ml" variant="ghost" onPress={() => addWater(-250)} style={{ flex: 1 }} />
              <PillButton label="+ 250ml" variant="ghost" onPress={() => addWater(250)} style={{ flex: 1 }} />
              <PillButton label="+ 500ml" variant="ghost" onPress={() => addWater(500)} style={{ flex: 1 }} />
            </View>
            {weight && (
              <SubText style={styles.hint}>
                Peso: {weight.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg × {ML_PER_KG}ml · +15 XP ao bater a
                meta
              </SubText>
            )}

            <Text style={styles.sectionTitle}>Histórico</Text>
            {rows.length === 0 ? (
              <SubText>Nenhum registro de água ainda.</SubText>
            ) : (
              rows.map(([date, ml]) => (
                <View key={date} style={styles.row}>
                  <Text style={styles.rowDate}>
                    {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.rowValue}>💧 {fmtLiters(ml)} L</Text>
                  <Pressable onPress={() => deleteWaterEntry(date)} hitSlop={8}>
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
  figure: { color: LQ.ink, fontFamily: LQ.fontMono, fontSize: 30, textAlign: 'center', marginTop: 6 },
  figureSmall: { fontSize: 15, color: LQ.inkSoft, fontFamily: LQ.fontBody },
  actions: { flexDirection: 'row', gap: 6, marginTop: 16 },
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
  rowDate: { flex: 1, color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 13, textTransform: 'capitalize' },
  rowValue: { color: LQ.gold, fontFamily: LQ.fontMono, fontSize: 13 },
});
