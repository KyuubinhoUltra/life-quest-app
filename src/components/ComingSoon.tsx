import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LQ } from '@/constants/life-quest-theme';

export function ComingSoon({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: LQ.paper, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  icon: { fontSize: 40, marginBottom: 4 },
  title: {
    color: LQ.ink,
    fontWeight: '700',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  desc: { color: LQ.inkSoft, fontSize: 13, textAlign: 'center', maxWidth: 280 },
});
