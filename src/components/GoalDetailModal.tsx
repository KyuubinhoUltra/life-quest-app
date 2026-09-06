import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { LQ } from '@/constants/life-quest-theme';
import { Goal } from '@/store/types';

function arcPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function GoalArc({ pct, icon }: { pct: number; icon: string }) {
  const cx = 130;
  const cy = 110;
  const r = 96;
  const start = arcPoint(cx, cy, r, 135);
  const end = arcPoint(cx, cy, r, 45);
  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;
  const totalLen = 2 * Math.PI * r * (270 / 360);
  const offset = totalLen * (1 - Math.min(100, Math.max(0, pct)) / 100);

  return (
    <View style={styles.arcWrap}>
      <Svg viewBox="0 0 260 220" width="100%" height="100%">
        <Path d={trackPath} stroke={LQ.lineSoft} strokeWidth={14} strokeLinecap="round" fill="none" />
        <Path
          d={trackPath}
          stroke={LQ.gold}
          strokeWidth={14}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${totalLen} 999`}
          strokeDashoffset={offset}
        />
      </Svg>
      <Text style={styles.arcIcon}>{icon}</Text>
    </View>
  );
}

function formatBRL(n: number): string {
  return 'R$' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  goal: Goal | null;
  alreadyCompleted: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDeposit: (id: string, amount: number) => void;
  onWithdraw: (id: string, amount: number) => void;
  onSetDeadline: (id: string, deadline: string) => void;
};

export function GoalDetailModal({ goal, alreadyCompleted, onClose, onDelete, onDeposit, onWithdraw, onSetDeadline }: Props) {
  const [amount, setAmount] = useState('');
  const [deadlineInput, setDeadlineInput] = useState('');
  const [mode, setMode] = useState<'view' | 'deposit' | 'withdraw' | 'deadline'>('view');

  if (!goal) return null;
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;

  const closeAndReset = () => {
    setMode('view');
    setAmount('');
    setDeadlineInput('');
    onClose();
  };

  const submitAmount = (action: 'deposit' | 'withdraw') => {
    const val = Number(amount.replace(',', '.'));
    if (!val || val <= 0) return;
    if (action === 'deposit') onDeposit(goal.id, val);
    else onWithdraw(goal.id, val);
    setAmount('');
    setMode('view');
  };

  return (
    <Modal visible={!!goal} animationType="fade" transparent onRequestClose={closeAndReset}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Pressable onPress={closeAndReset} style={styles.iconBtn} hitSlop={8}>
              <Svg viewBox="0 0 16 16" width={16} height={16} fill="none">
                <Path d="M10 3L5 8l5 5" stroke={LQ.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
            <Pressable
              onPress={() => {
                onDelete(goal.id);
                closeAndReset();
              }}
              style={styles.iconBtn}
              hitSlop={8}>
              <Text style={{ color: LQ.inkFaint, fontSize: 16 }}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>{goal.name}</Text>
          <Text style={styles.sub}>
            A meta é {formatBRL(goal.target)}
            {goal.deadline ? ` até ${new Date(goal.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}
          </Text>

          <GoalArc pct={pct} icon={goal.icon} />

          <Text style={styles.amount}>{formatBRL(goal.saved)}</Text>
          <Text style={styles.progress}>{pct}% da meta alcançada</Text>

          {mode === 'view' && (
            <View style={styles.actions}>
              <Pressable style={styles.actionBtn} onPress={() => setMode('deposit')}>
                <Text style={styles.actionText}>Reservar</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, goal.saved <= 0 && styles.actionBtnDisabled]}
                disabled={goal.saved <= 0}
                onPress={() => setMode('withdraw')}>
                <Text style={styles.actionText}>Retirar</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => setMode('deadline')}>
                <Text style={styles.actionText}>Prazo</Text>
              </Pressable>
            </View>
          )}

          {(mode === 'deposit' || mode === 'withdraw') && (
            <View style={styles.inlineForm}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="Valor em R$"
                placeholderTextColor={LQ.inkFaint}
                keyboardType="numeric"
                autoFocus
                style={styles.input}
              />
              <Pressable style={styles.confirmBtn} onPress={() => submitAmount(mode)}>
                <Text style={styles.confirmBtnText}>{mode === 'deposit' ? 'Reservar' : 'Retirar'}</Text>
              </Pressable>
            </View>
          )}

          {mode === 'deadline' && (
            <View style={styles.inlineForm}>
              <TextInput
                value={deadlineInput}
                onChangeText={setDeadlineInput}
                placeholder="AAAA-MM-DD (vazio para remover)"
                placeholderTextColor={LQ.inkFaint}
                autoFocus
                style={styles.input}
              />
              <Pressable
                style={styles.confirmBtn}
                onPress={() => {
                  const v = deadlineInput.trim();
                  if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
                  onSetDeadline(goal.id, v);
                  setDeadlineInput('');
                  setMode('view');
                }}>
                <Text style={styles.confirmBtnText}>Salvar</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.hint}>
            +10 XP por aporte{alreadyCompleted ? '' : ' · +50 XP ao completar a meta'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  panel: {
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    padding: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LQ.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: LQ.ink,
    fontWeight: '700',
    fontSize: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 10,
  },
  sub: { color: LQ.inkSoft, fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 4 },
  arcWrap: { width: 240, height: 200, alignSelf: 'center', marginTop: 4 },
  arcIcon: { position: 'absolute', top: '46%', left: '50%', fontSize: 46, transform: [{ translateX: -23 }, { translateY: -23 }] },
  amount: { color: LQ.ink, fontWeight: '700', fontSize: 30, textAlign: 'center', fontFamily: 'monospace', marginTop: 4 },
  progress: { color: LQ.gold, fontWeight: '600', fontSize: 13, textAlign: 'center', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  actionBtn: {
    flex: 1,
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionText: { color: LQ.ink, fontWeight: '600', fontSize: 13 },
  inlineForm: { flexDirection: 'row', gap: 8, marginTop: 20 },
  input: {
    flex: 1,
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    color: LQ.ink,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  confirmBtn: { backgroundColor: LQ.gold, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18, justifyContent: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  hint: { color: LQ.inkFaint, fontSize: 11, textAlign: 'center', marginTop: 16 },
});
