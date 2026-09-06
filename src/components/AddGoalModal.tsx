import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { LQ } from '@/constants/life-quest-theme';

const GOAL_ICONS = ['🎯', '💰', '🛟', '✈️', '🏠', '🚗', '🎓', '💍', '📱', '🛋️', '🏖️', '🎁'];

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, icon: string, target: number, deadline: string) => void;
};

export function AddGoalModal({ visible, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [icon, setIcon] = useState(GOAL_ICONS[0]);

  const reset = () => {
    setName('');
    setTarget('');
    setIcon(GOAL_ICONS[0]);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    const val = Number(target.replace(',', '.'));
    if (!name.trim() || !val || val <= 0) return;
    onCreate(name, icon, val, '');
    close();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Nova meta</Text>
            <Pressable onPress={close} style={styles.iconBtn} hitSlop={8}>
              <Svg viewBox="0 0 16 16" width={14} height={14} fill="none">
                <Path d="M3 3l10 10M13 3L3 13" stroke={LQ.ink} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>

          <Text style={styles.label}>Ícone</Text>
          <View style={styles.iconRow}>
            {GOAL_ICONS.map((ic) => (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                style={[styles.iconOption, icon === ic && styles.iconOptionActive]}>
                <Text style={{ fontSize: 18 }}>{ic}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Nome da meta</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="ex.: Viagem, Reserva de emergência"
            placeholderTextColor={LQ.inkFaint}
            style={styles.input}
          />

          <Text style={styles.label}>Valor alvo</Text>
          <TextInput
            value={target}
            onChangeText={setTarget}
            placeholder="R$ 0,00"
            placeholderTextColor={LQ.inkFaint}
            keyboardType="numeric"
            style={styles.input}
          />

          <Pressable
            style={[styles.confirmBtn, (!name.trim() || !target) && styles.confirmBtnDisabled]}
            disabled={!name.trim() || !target}
            onPress={submit}>
            <Text style={styles.confirmBtnText}>Criar meta</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  panel: {
    backgroundColor: LQ.paperRaised,
    borderTopWidth: 1,
    borderColor: LQ.line,
    borderTopLeftRadius: LQ.radius,
    borderTopRightRadius: LQ.radius,
    padding: 20,
    paddingBottom: 32,
    gap: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 18, textTransform: 'uppercase' },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LQ.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: LQ.inkFaint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: LQ.fontBodySemiBold, marginTop: 12, marginBottom: 8 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: LQ.line,
    backgroundColor: LQ.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionActive: { borderColor: LQ.gold, backgroundColor: LQ.goldSoft },
  input: {
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    color: LQ.ink,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  confirmBtn: { backgroundColor: LQ.gold, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { color: '#fff', fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
});
