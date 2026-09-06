import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { GoalDetailModal } from '@/components/GoalDetailModal';
import { GoalRing } from '@/components/GoalRing';
import { PillButton, SubText, XpBadge } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { XP_GOAL_DEPOSIT, useLifeQuest } from '@/store/LifeQuestStore';

const GOAL_ICONS = ['🎯', '💰', '🛟', '✈️', '🏠', '🚗', '🎓', '💍', '📱', '🛋️', '🏖️', '🎁'];

function formatBRL(n: number): string {
  return 'R$' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MetasScreen() {
  const { state, addGoal, deleteGoal, depositToGoal, withdrawFromGoal, setGoalDeadline } = useLifeQuest();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [icon, setIcon] = useState(GOAL_ICONS[0]);

  const selectedGoal = state.goals.find((g) => g.id === selectedId) ?? null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {state.goals.length === 0 ? (
        <SubText>Nenhuma meta ainda. Crie uma abaixo.</SubText>
      ) : (
        state.goals.map((g) => {
          const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
          return (
            <Pressable key={g.id} onPress={() => setSelectedId(g.id)} style={styles.goalCard}>
              <GoalRing pct={pct} icon={g.icon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.goalName}>{g.name}</Text>
                <Text style={styles.goalFigures}>
                  <Text style={styles.goalSaved}>{formatBRL(g.saved)}</Text> / {formatBRL(g.target)}
                </Text>
                <View style={styles.goalActionsRow}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedId(g.id);
                    }}
                    style={styles.smallGhostBtn}>
                    <Text style={styles.smallGhostBtnText}>+ Adicionar valor</Text>
                  </Pressable>
                  <XpBadge amount={XP_GOAL_DEPOSIT} />
                </View>
                {!!g.deadline && (
                  <Text style={styles.deadline}>até {new Date(g.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}</Text>
                )}
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  deleteGoal(g.id);
                }}
                hitSlop={8}>
                <Text style={{ color: LQ.inkFaint, fontSize: 16 }}>✕</Text>
              </Pressable>
            </Pressable>
          );
        })
      )}

      <View style={styles.addForm}>
        <View style={styles.iconRow}>
          {GOAL_ICONS.map((ic) => (
            <Pressable key={ic} onPress={() => setIcon(ic)} style={[styles.iconOption, icon === ic && styles.iconOptionActive]}>
              <Text style={{ fontSize: 16 }}>{ic}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome da meta, ex.: Viagem"
          placeholderTextColor={LQ.inkFaint}
          style={styles.input}
        />
        <TextInput
          value={target}
          onChangeText={setTarget}
          placeholder="Valor alvo (R$)"
          placeholderTextColor={LQ.inkFaint}
          keyboardType="numeric"
          style={styles.input}
        />
        <PillButton
          label="Criar meta"
          onPress={() => {
            const val = Number(target.replace(',', '.'));
            addGoal(name, icon, val, '');
            setName('');
            setTarget('');
          }}
          style={{ width: '100%' }}
        />
      </View>

      <GoalDetailModal
        goal={selectedGoal}
        alreadyCompleted={!!selectedGoal && !!state.character.goalsCompleted[selectedGoal.id]}
        onClose={() => setSelectedId(null)}
        onDelete={deleteGoal}
        onDeposit={depositToGoal}
        onWithdraw={withdrawFromGoal}
        onSetDeadline={setGoalDeadline}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LQ.paper },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    padding: 16,
  },
  goalName: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 15, textTransform: 'uppercase' },
  goalFigures: { color: LQ.inkSoft, fontSize: 12, fontFamily: LQ.fontMono, marginTop: 4 },
  goalSaved: { color: LQ.ink, fontWeight: '700' },
  goalActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  smallGhostBtn: {
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  smallGhostBtnText: { color: LQ.ink, fontSize: 12, fontWeight: '600' },
  deadline: { color: LQ.inkFaint, fontSize: 11, marginTop: 6 },
  addForm: {
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    backgroundColor: LQ.paperRaised,
    padding: 14,
    gap: 10,
    marginTop: 8,
  },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
});
