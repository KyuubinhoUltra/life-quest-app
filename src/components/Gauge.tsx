import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { LQ } from '@/constants/life-quest-theme';

function arcPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

type Props = {
  pct: number; // 0-100
  icon: string;
  color?: string;
  size?: number;
};

/** Velocímetro em arco de 270° (aberto embaixo), com um emoji no centro. */
export function Gauge({ pct, icon, color = LQ.gold, size = 150 }: Props) {
  const clamped = Math.min(100, Math.max(0, pct));
  const cx = 90;
  const cy = 78;
  const r = 62;
  const start = arcPoint(cx, cy, r, 135);
  const end = arcPoint(cx, cy, r, 45);
  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;
  const totalLen = 2 * Math.PI * r * (270 / 360);
  const offset = totalLen * (1 - clamped / 100);

  return (
    <View style={[styles.wrap, { width: size, height: size * 0.83 }]}>
      <Svg viewBox="0 0 180 150" width="100%" height="100%">
        <Path d={trackPath} stroke={LQ.lineSoft} strokeWidth={11} strokeLinecap="round" fill="none" />
        <Path
          d={trackPath}
          stroke={color}
          strokeWidth={11}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${totalLen} 999`}
          strokeDashoffset={offset}
        />
      </Svg>
      <Text style={styles.icon}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center', position: 'relative', marginTop: 4 },
  icon: { position: 'absolute', top: '50%', left: '50%', fontSize: 30, transform: [{ translateX: -15 }, { translateY: -19 }] },
});
