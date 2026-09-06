import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { LQ } from '@/constants/life-quest-theme';

export function GoalRing({ pct, icon, size = 76 }: { pct: number; icon: string; size?: number }) {
  const r = (size - 8) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  const offset = c * (1 - clamped / 100);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={cx} cy={cy} r={r} stroke={LQ.lineSoft} strokeWidth={7} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={LQ.gold}
          strokeWidth={7}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.pct}>{Math.round(clamped)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  icon: { position: 'absolute', fontSize: 26, top: '30%' },
  pct: { position: 'absolute', bottom: -2, fontSize: 9, color: LQ.goldInk, fontFamily: LQ.fontMono },
});
