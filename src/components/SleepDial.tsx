import React, { useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { LQ } from '@/constants/life-quest-theme';

const SIZE = 260;
const RADIUS = 100;
const CENTER = SIZE / 2;
const HANDLE_R = 17;

export function minutesFromHM(hm: string, fallback: number): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm);
  if (!m) return fallback;
  return (Number(m[1]) % 24) * 60 + Number(m[2]);
}

export function hmFromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function pointForMinutes(minutes: number, r: number) {
  const clockAngle = (minutes / 1440) * 360;
  const rad = ((clockAngle - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function minutesFromOffset(dx: number, dy: number): number {
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  const minutes = Math.round(((deg / 360) * 1440) / 5) * 5;
  return minutes % 1440;
}

function arcPath(bedMinutes: number, wakeMinutes: number) {
  const start = pointForMinutes(bedMinutes, RADIUS);
  const end = pointForMinutes(wakeMinutes, RADIUS);
  const durationMinutes = (wakeMinutes - bedMinutes + 1440) % 1440;
  const largeArc = durationMinutes > 720 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function SleepDial({
  bedMinutes,
  wakeMinutes,
  onChange,
}: {
  bedMinutes: number;
  wakeMinutes: number;
  onChange: (bedMinutes: number, wakeMinutes: number) => void;
}) {
  const bedRef = useRef(bedMinutes);
  const wakeRef = useRef(wakeMinutes);
  const onChangeRef = useRef(onChange);
  bedRef.current = bedMinutes;
  wakeRef.current = wakeMinutes;
  onChangeRef.current = onChange;

  const containerRef = useRef<View>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const measureCenter = () => {
    containerRef.current?.measureInWindow((x, y, w, h) => {
      centerRef.current = { x: x + w / 2, y: y + h / 2 };
    });
  };

  const bedResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: measureCenter,
      onPanResponderMove: (_evt, gesture) => {
        const minutes = minutesFromOffset(gesture.moveX - centerRef.current.x, gesture.moveY - centerRef.current.y);
        onChangeRef.current(minutes, wakeRef.current);
      },
    })
  ).current;

  const wakeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: measureCenter,
      onPanResponderMove: (_evt, gesture) => {
        const minutes = minutesFromOffset(gesture.moveX - centerRef.current.x, gesture.moveY - centerRef.current.y);
        onChangeRef.current(bedRef.current, minutes);
      },
    })
  ).current;

  const bedPoint = pointForMinutes(bedMinutes, RADIUS);
  const wakePoint = pointForMinutes(wakeMinutes, RADIUS);
  const durationMinutes = (wakeMinutes - bedMinutes + 1440) % 1440;
  const durationH = Math.floor(durationMinutes / 60);
  const durationM = durationMinutes % 60;

  return (
    <View style={styles.wrap}>
      <View ref={containerRef} collapsable={false} style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={CENTER} cy={CENTER} r={RADIUS + 22} stroke={LQ.line} strokeWidth={1} strokeDasharray="1 7" fill="none" />
          <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke={LQ.lineSoft} strokeWidth={16} fill="none" />
          <Path d={arcPath(bedMinutes, wakeMinutes)} stroke={LQ.gold} strokeWidth={16} strokeLinecap="round" fill="none" />
        </Svg>

        {[0, 6, 12, 18].map((h) => {
          const p = pointForMinutes(h * 60, RADIUS + 34);
          return (
            <Text key={h} style={[styles.hourLabel, { left: p.x - 12, top: p.y - 8 }]}>
              {h}
            </Text>
          );
        })}

        <View style={styles.centerText} pointerEvents="none">
          <Text style={styles.centerRow}>🛏 {hmFromMinutes(bedMinutes)}</Text>
          <Text style={styles.centerRow}>⏰ {hmFromMinutes(wakeMinutes)}</Text>
        </View>

        <View
          {...bedResponder.panHandlers}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.handle, { left: bedPoint.x - HANDLE_R, top: bedPoint.y - HANDLE_R }]}>
          <Text style={{ fontSize: 14 }}>🛏</Text>
        </View>
        <View
          {...wakeResponder.panHandlers}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.handle, { left: wakePoint.x - HANDLE_R, top: wakePoint.y - HANDLE_R }]}>
          <Text style={{ fontSize: 14 }}>⏰</Text>
        </View>
      </View>
      <Text style={styles.durationText}>
        Tempo de sono: {durationH} hora{durationH === 1 ? '' : 's'}
        {durationM ? ` e ${durationM} minutos` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  hourLabel: { position: 'absolute', width: 24, textAlign: 'center', color: LQ.inkFaint, fontSize: 11, fontFamily: LQ.fontMono },
  centerText: {
    position: 'absolute',
    top: CENTER - 26,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  centerRow: { color: LQ.ink, fontFamily: LQ.fontMono, fontSize: 19 },
  handle: {
    position: 'absolute',
    width: HANDLE_R * 2,
    height: HANDLE_R * 2,
    borderRadius: HANDLE_R,
    backgroundColor: LQ.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: LQ.paperRaised,
  },
  durationText: { color: LQ.gold, fontFamily: LQ.fontBodySemiBold, fontSize: 13, marginTop: 14 },
});
