import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Card, PillButton, SectionTitle, SubText, XpBadge } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { WEEKLY_MISSIONS } from '@/store/daily-missions';
import { XP_HABIT, useLifeQuest } from '@/store/LifeQuestStore';

function CheckIcon({ checked }: { checked: boolean }) {
  if (!checked) return null;
  return (
    <Svg width={13} height={13} viewBox="0 0 16 16" fill="none">
      <Path d="M3 8.5L6.2 11.5L13 4.5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function RotinaScreen() {
  const {
    state,
    today,
    currentWeekdayKey,
    toggleHabit,
    addHabit,
    deleteHabit,
    habitStreak,
    isMissionDone,
    claimDailyMission,
  } = useLifeQuest();

  const [newHabit, setNewHabit] = useState('');

  const doneToday = state.habitHistory[today] || [];
  const todaysMissions = WEEKLY_MISSIONS[currentWeekdayKey] || [];
  const claimedToday = state.dailyMissionsClaimed[today] || [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle>Desafios do dia</SectionTitle>
      <Card>
        {todaysMissions.map((mission, i) => {
          const done = isMissionDone(mission);
          const claimed = claimedToday.includes(mission.id);
          return (
            <View key={mission.id} style={[styles.habitRow, i > 0 && styles.habitRowBorder]}>
              <View style={[styles.checkbox, done && styles.checkboxDone]}>
                <CheckIcon checked={done} />
              </View>
              <Text style={[styles.habitName, claimed && styles.habitNameDone]}>{mission.label}</Text>
              <XpBadge amount={mission.xp} />
              {claimed ? (
                <Text style={styles.claimedText}>Resgatada</Text>
              ) : (
                <PillButton
                  label="Resgatar"
                  variant="ghost"
                  disabled={!done}
                  onPress={() => claimDailyMission(mission)}
                  style={styles.claimBtn}
                />
              )}
            </View>
          );
        })}
      </Card>

      <SectionTitle>Missões de hoje</SectionTitle>
      <Card>
        {state.habits.length === 0 ? (
          <SubText>Nenhuma missão ainda. Adicione uma abaixo.</SubText>
        ) : (
          state.habits.map((h, i) => {
            const done = doneToday.includes(h.id);
            const streak = habitStreak(h.id);
            return (
              <View key={h.id} style={[styles.habitRow, i > 0 && styles.habitRowBorder]}>
                <Pressable onPress={() => toggleHabit(h.id)} style={[styles.checkbox, done && styles.checkboxDone]}>
                  <CheckIcon checked={done} />
                </Pressable>
                <Text style={[styles.habitName, done && styles.habitNameDone]}>{h.name}</Text>
                {streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakBadgeText}>{streak}d seguidos</Text>
                  </View>
                )}
                <XpBadge amount={XP_HABIT} />
                <Pressable onPress={() => deleteHabit(h.id)} hitSlop={8} style={{ marginLeft: 4 }}>
                  <Text style={{ color: LQ.inkFaint, fontSize: 16 }}>✕</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </Card>
      <View style={styles.addRow}>
        <TextInput
          value={newHabit}
          onChangeText={setNewHabit}
          placeholder="Nova missão, ex.: Meditar 10 minutos"
          placeholderTextColor={LQ.inkFaint}
          style={styles.addInput}
        />
        <PillButton
          label="Adicionar"
          onPress={() => {
            addHabit(newHabit);
            setNewHabit('');
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LQ.paper },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  habitRowBorder: { borderTopWidth: 1, borderTopColor: LQ.line },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: LQ.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: LQ.gold, borderColor: LQ.gold },
  habitName: { flex: 1, color: LQ.ink, fontSize: 14 },
  habitNameDone: { color: LQ.inkFaint, textDecorationLine: 'line-through' },
  streakBadge: { backgroundColor: LQ.goldSoft, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  streakBadgeText: { color: LQ.goldInk, fontSize: 10, fontWeight: '600' },
  claimBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  claimedText: { color: LQ.gold, fontSize: 11, fontFamily: LQ.fontBodySemiBold },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: {
    flex: 1,
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    color: LQ.ink,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
});
