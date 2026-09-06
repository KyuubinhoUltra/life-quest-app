import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { GoalDetailModal } from '@/components/GoalDetailModal';
import { GoalRing } from '@/components/GoalRing';
import { BigFigure, Card, Eyebrow, PillButton, SectionTitle, SubText, XpBadge } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { XP_GOAL_DEPOSIT, useLifeQuest } from '@/store/LifeQuestStore';

const GOAL_ICONS = ['🎯', '💰', '🛟', '✈️', '🏠', '🚗', '🎓', '💍', '📱', '🛋️', '🏖️', '🎁'];

function formatBRL(n: number): string {
  return 'R$' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function MiniBars({ level }: { level: number }) {
  const heights = [7, 12, 17, 22];
  return (
    <View style={styles.miniBars}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={[
            styles.miniBar,
            { height: h },
            i < level ? styles.miniBarActive : styles.miniBarOff,
          ]}
        />
      ))}
    </View>
  );
}

export default function MetasScreen() {
  const { state, today, addGoal, deleteGoal, depositToGoal, withdrawFromGoal, setGoalDeadline } = useLifeQuest();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [icon, setIcon] = useState(GOAL_ICONS[0]);

  const selectedGoal = state.goals.find((g) => g.id === selectedId) ?? null;

  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);
  const totalSaved = state.goals.reduce((s, g) => s + g.saved, 0);
  const overallPct = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

  const monthPrefix = today.slice(0, 7);
  const monthActivity = state.financeActivity.filter((a) => a.date.startsWith(monthPrefix));
  const monthDeposits = monthActivity.filter((a) => a.type === 'deposit').reduce((s, a) => s + a.amount, 0);
  const monthWithdraws = monthActivity.filter((a) => a.type === 'withdraw').reduce((s, a) => s + a.amount, 0);
  const monthMax = Math.max(monthDeposits, monthWithdraws, 1);
  const depositBarLevel = monthDeposits === 0 ? 0 : monthDeposits < 200 ? 1 : monthDeposits < 500 ? 2 : monthDeposits < 1000 ? 3 : 4;

  const recentActivity = state.financeActivity.slice(0, 5);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.summaryGrid}>
        <Card style={styles.summaryCard}>
          <Eyebrow>Guardado nas metas</Eyebrow>
          <BigFigure style={{ fontSize: 20 }} numberOfLines={1} adjustsFontSizeToFit>
            {formatBRL(totalSaved)}
          </BigFigure>
          <SubText>{state.goals.length} meta(s) ativa(s)</SubText>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryCardTop}>
            <Eyebrow>Depositado este mês</Eyebrow>
            <MiniBars level={depositBarLevel} />
          </View>
          <BigFigure style={{ fontSize: 20 }} numberOfLines={1} adjustsFontSizeToFit>
            {formatBRL(monthDeposits)}
          </BigFigure>
          <SubText>{monthActivity.filter((a) => a.type === 'deposit').length} aporte(s)</SubText>
        </Card>

        <Card style={styles.summaryCard}>
          <Eyebrow>Progresso das metas</Eyebrow>
          <View style={styles.segmentedBar}>
            {state.goals.length === 0 ? (
              <View style={[styles.segment, { flex: 1, backgroundColor: LQ.lineSoft }]} />
            ) : (
              state.goals.map((g) => {
                const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
                return (
                  <View key={g.id} style={[styles.segment, { flex: Math.max(g.target, 1) }]}>
                    <View style={[styles.segmentFill, { width: `${pct}%` }]} />
                  </View>
                );
              })
            )}
          </View>
          <BigFigure style={{ fontSize: 20, marginTop: 10 }}>{overallPct.toFixed(0)}%</BigFigure>
          <SubText>da meta total · {formatBRL(totalTarget)}</SubText>
        </Card>

        <Card style={styles.summaryCard}>
          <Eyebrow>Este mês</Eyebrow>
          <BigFigure style={{ color: LQ.gold, fontSize: 20 }} numberOfLines={1} adjustsFontSizeToFit>
            +{formatBRL(monthDeposits)}
          </BigFigure>
          {monthWithdraws > 0 && <Text style={styles.withdrawFigure}>-{formatBRL(monthWithdraws)}</Text>}
          <View style={styles.flowBars}>
            <View style={styles.flowBarTrack}>
              <View style={[styles.flowBarFill, { width: `${(monthDeposits / monthMax) * 100}%`, backgroundColor: LQ.gold }]} />
            </View>
            <View style={styles.flowBarTrack}>
              <View style={[styles.flowBarFill, { width: `${(monthWithdraws / monthMax) * 100}%`, backgroundColor: LQ.danger }]} />
            </View>
          </View>
        </Card>
      </View>

      {recentActivity.length > 0 && (
        <Card style={{ marginBottom: 4 }}>
          <Eyebrow>Atividade recente</Eyebrow>
          {recentActivity.map((a, i) => (
            <View key={a.id} style={[styles.activityRow, i > 0 && styles.activityRowBorder]}>
              <View style={styles.activityIcon}>
                <Text style={{ fontSize: 16 }}>{a.goalIcon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>
                  {a.type === 'deposit' ? 'Depósito' : 'Retirada'} · {a.goalName}
                </Text>
                <Text style={styles.activityDate}>{new Date(a.date + 'T00:00:00').toLocaleDateString('pt-BR')}</Text>
              </View>
              <Text style={[styles.activityAmount, a.type === 'withdraw' && styles.activityAmountNegative]}>
                {a.type === 'deposit' ? '+' : '-'}
                {formatBRL(a.amount)}
              </Text>
            </View>
          ))}
        </Card>
      )}

      <SectionTitle>Suas metas</SectionTitle>

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
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  summaryCard: { flexBasis: '47%', flexGrow: 1 },
  summaryCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  miniBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  miniBar: { width: 4, borderRadius: 2 },
  miniBarActive: { backgroundColor: LQ.gold },
  miniBarOff: { backgroundColor: LQ.lineSoft },
  segmentedBar: { flexDirection: 'row', gap: 4, height: 8, marginTop: 4 },
  segment: { height: 8, borderRadius: 4, backgroundColor: LQ.lineSoft, overflow: 'hidden' },
  segmentFill: { height: '100%', backgroundColor: LQ.gold, borderRadius: 4 },
  withdrawFigure: { color: LQ.danger, fontFamily: LQ.fontMono, fontSize: 15, marginTop: 2 },
  flowBars: { gap: 5, marginTop: 12 },
  flowBarTrack: { height: 5, borderRadius: 3, backgroundColor: LQ.lineSoft, overflow: 'hidden' },
  flowBarFill: { height: '100%', borderRadius: 3 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  activityRowBorder: { borderTopWidth: 1, borderTopColor: LQ.line },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: LQ.lineSoft,
    borderWidth: 1,
    borderColor: LQ.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: { color: LQ.ink, fontSize: 13, fontFamily: LQ.fontBodySemiBold },
  activityDate: { color: LQ.inkFaint, fontSize: 11, marginTop: 2 },
  activityAmount: { color: LQ.gold, fontFamily: LQ.fontMono, fontSize: 13 },
  activityAmountNegative: { color: LQ.danger },
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
