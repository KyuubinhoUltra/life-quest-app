import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LQ } from '@/constants/life-quest-theme';
import { ACHIEVEMENTS } from '@/store/achievements';
import { levelFromXp, titleForLevel } from '@/store/character';
import { useLifeQuest } from '@/store/LifeQuestStore';

// Nível geral da conta (soma de tudo que você faz no app) + conquistas.
export function LevelStrip({ detalhado = false, onPress }: { detalhado?: boolean; onPress?: () => void }) {
  const { state } = useLifeQuest();
  const info = levelFromXp(state.character.xpGeral);
  const desbloqueadas = Object.keys(state.achievements.unlocked).length;

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.strip}>
      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>NV</Text>
        <Text style={styles.badgeNumber}>{info.level}</Text>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{titleForLevel(info.level)}</Text>
          {detalhado && (
            <Text style={styles.xp}>
              {info.xpInLevel} / {info.xpNeeded} XP
            </Text>
          )}
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(info.xpInLevel / info.xpNeeded) * 100}%` }]} />
        </View>
      </View>
      <View style={styles.trophy}>
        <Text style={{ fontSize: 16 }}>🏆</Text>
        <Text style={styles.trophyCount}>
          {desbloqueadas}/{ACHIEVEMENTS.length}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LQ.goldSoft,
    borderWidth: 1,
    borderColor: LQ.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: { color: LQ.goldInk, fontSize: 8, fontFamily: LQ.fontBodySemiBold, letterSpacing: 1, marginBottom: -2 },
  badgeNumber: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 13 },
  xp: { color: LQ.inkFaint, fontSize: 11, fontFamily: LQ.fontMono },
  track: { height: 6, borderRadius: 3, backgroundColor: LQ.lineSoft, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: LQ.gold, borderRadius: 3 },
  trophy: { alignItems: 'center' },
  trophyCount: { color: LQ.inkSoft, fontSize: 10, fontFamily: LQ.fontMono },
});
