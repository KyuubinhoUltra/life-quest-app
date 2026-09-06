import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { LQ } from '@/constants/life-quest-theme';
import { BodyWeightEntry } from '@/store/types';

export function WeightChart({ entries }: { entries: BodyWeightEntry[] }) {
  const recent = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-8);
  if (recent.length === 0) return null;

  const w = 320;
  const h = 120;
  const padL = 30;
  const padR = 10;
  const padT = 12;
  const padB = 18;

  const weights = recent.map((p) => p.weight);
  let min = Math.min(...weights);
  let max = Math.max(...weights);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.15;
  min -= pad;
  max += pad;

  const xStep = recent.length > 1 ? (w - padL - padR) / (recent.length - 1) : 0;
  const xAt = (i: number) => padL + xStep * i;
  const yAt = (v: number) => padT + (h - padT - padB) * (1 - (v - min) / (max - min));

  const points = recent.map((p, i) => `${xAt(i)},${yAt(p.weight)}`).join(' ');

  return (
    <View style={styles.wrap}>
      <Svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
        {[0, 1, 2].map((g) => {
          const gy = padT + (h - padT - padB) * (g / 2);
          const gv = max - (max - min) * (g / 2);
          return (
            <React.Fragment key={g}>
              <Line x1={padL} y1={gy} x2={w - padR} y2={gy} stroke={LQ.lineSoft} strokeWidth={1} />
              <SvgText x={2} y={gy + 3} fontSize={8} fill={LQ.inkFaint}>
                {gv.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Polyline points={points} fill="none" stroke={LQ.gold} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {recent.map((p, i) => (
          <Circle
            key={p.id}
            cx={xAt(i)}
            cy={yAt(p.weight)}
            r={i === recent.length - 1 ? 4 : 2.5}
            fill={i === recent.length - 1 ? LQ.gold : LQ.goldInk}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    padding: 8,
  },
});
