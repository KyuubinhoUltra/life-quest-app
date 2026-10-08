import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';

import { PillButton } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { ACHIEVEMENT_BY_ID } from '@/store/achievements';
import { titleForLevel } from '@/store/character';
import { useLifeQuest } from '@/store/LifeQuestStore';

const MAX_LISTADAS = 5;

// Mostra uma comemoração por vez: subiu de nível ou conquistas desbloqueadas.
export function CelebrationHost() {
  const { celebrations, dismissCelebration } = useLifeQuest();
  const atual = celebrations[0];
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!atual) return;
    scale.setValue(0.85);
    Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, [atual, scale]);

  if (!atual) return null;

  const conquistas = atual.kind === 'achievements' ? atual.ids.map((id) => ACHIEVEMENT_BY_ID[id]).filter(Boolean) : [];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismissCelebration}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          {atual.kind === 'level' ? (
            <>
              <Text style={styles.emoji}>🎉</Text>
              <Text style={styles.eyebrow}>Você subiu de nível!</Text>
              <Text style={styles.bigNumber}>NÍVEL {atual.level}</Text>
              <Text style={styles.sub}>{titleForLevel(atual.level)}</Text>
            </>
          ) : (
            <>
              <Text style={styles.emoji}>🏆</Text>
              <Text style={styles.eyebrow}>
                {conquistas.length === 1 ? 'Conquista desbloqueada!' : `${conquistas.length} conquistas desbloqueadas!`}
              </Text>
              <View style={styles.list}>
                {conquistas.slice(0, MAX_LISTADAS).map((a) => (
                  <View key={a.id} style={styles.row}>
                    <Text style={{ fontSize: 22 }}>{a.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{a.nome}</Text>
                      <Text style={styles.rowSub}>{a.descricao}</Text>
                    </View>
                    <Text style={styles.rowXp}>+{a.xp} XP</Text>
                  </View>
                ))}
                {conquistas.length > MAX_LISTADAS && (
                  <Text style={styles.rowSub}>e mais {conquistas.length - MAX_LISTADAS}…</Text>
                )}
              </View>
              <Text style={styles.sub}>+{atual.kind === 'achievements' ? atual.xp : 0} XP de bônus</Text>
            </>
          )}
          <PillButton label="Continuar" onPress={dismissCelebration} style={{ marginTop: 18, minWidth: 160 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.gold,
    borderRadius: LQ.radius,
    padding: 24,
    alignItems: 'center',
  },
  emoji: { fontSize: 44, marginBottom: 6 },
  eyebrow: { color: LQ.inkSoft, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontFamily: LQ.fontBodySemiBold },
  bigNumber: { color: LQ.goldInk, fontFamily: LQ.fontDisplay, fontSize: 44, marginTop: 6 },
  sub: { color: LQ.inkSoft, fontSize: 14, marginTop: 6 },
  list: { alignSelf: 'stretch', gap: 12, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
  rowSub: { color: LQ.inkFaint, fontSize: 11, marginTop: 1 },
  rowXp: { color: LQ.goldInk, fontFamily: LQ.fontMono, fontSize: 12 },
});
