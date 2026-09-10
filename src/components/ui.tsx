import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { LQ } from '@/constants/life-quest-theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function BigFigure({
  children,
  style,
  numberOfLines,
  adjustsFontSizeToFit,
}: {
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
}) {
  return (
    <Text style={[styles.bigFigure, style]} numberOfLines={numberOfLines} adjustsFontSizeToFit={adjustsFontSizeToFit}>
      {children}
    </Text>
  );
}

export function SubText({
  children,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
}) {
  return (
    <Text style={[styles.sub, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function ProgressBar({ pct, color = LQ.gold }: { pct: number; color?: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${clamped}%`, backgroundColor: color }]} />
    </View>
  );
}

export function PillButton({
  label,
  onPress,
  variant = 'solid',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'ghost' ? styles.btnGhost : styles.btnSolid,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
        style,
      ]}>
      <Text style={variant === 'ghost' ? styles.btnGhostText : styles.btnSolidText}>{label}</Text>
    </Pressable>
  );
}

export function XpBadge({ amount }: { amount: number }) {
  return (
    <View style={styles.xpBadge}>
      <Text style={styles.xpBadgeText}>+{amount} XP</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LQ.paperRaised,
    borderColor: LQ.line,
    borderWidth: 1,
    borderRadius: LQ.radius,
    padding: 16,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: LQ.inkFaint,
    fontFamily: LQ.fontBodySemiBold,
    marginBottom: 8,
  },
  bigFigure: {
    fontVariant: ['tabular-nums'],
    fontFamily: LQ.fontMono,
    fontSize: 26,
    color: LQ.ink,
  },
  sub: { fontSize: 13, color: LQ.inkSoft, marginTop: 4 },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: LQ.lineSoft,
    overflow: 'hidden',
    marginTop: 10,
  },
  barFill: { height: '100%', borderRadius: 3 },
  btn: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSolid: { backgroundColor: LQ.gold },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: LQ.line },
  btnPressed: { opacity: 0.8 },
  btnDisabled: { opacity: 0.4 },
  btnSolidText: { color: '#fff', fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
  btnGhostText: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
  xpBadge: {
    backgroundColor: LQ.goldSoft,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  xpBadgeText: { color: LQ.goldInk, fontSize: 11, fontFamily: LQ.fontBodySemiBold },
  sectionTitle: {
    color: LQ.ink,
    fontFamily: LQ.fontDisplay,
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
});
