import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { LQ } from '@/constants/life-quest-theme';

type Props = { size?: number; color?: string };

export function HomeIcon({ size = 22, color = LQ.inkFaint }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 11l9-7 9 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChecklistIcon({ size = 22, color = LQ.inkFaint }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={4} width={14} height={17} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M9 3v3h6V3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.5 12.5l2 2 4-4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DumbbellIcon({ size = 22, color = LQ.inkFaint }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2.5 12h2M19.5 12h2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M6 8v8M18 8v8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={3.5} y={9.5} width={3} height={5} rx={1} stroke={color} strokeWidth={1.8} />
      <Rect x={17.5} y={9.5} width={3} height={5} rx={1} stroke={color} strokeWidth={1.8} />
      <Path d="M6 12h12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function WalletIcon({ size = 22, color = LQ.inkFaint }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6} width={18} height={13} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={16.5} cy={14} r={1.2} fill={color} />
    </Svg>
  );
}

export function ShieldIcon({ size = 22, color = LQ.inkFaint }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HeartIcon({ size = 22, color = LQ.inkFaint }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.5s-7.5-4.6-10-9.3C.4 8 2 4.5 5.4 4c2.1-.3 4 .8 6.6 3.4C14.6 4.8 16.5 3.7 18.6 4c3.4.5 5 4 3.4 7.2-2.5 4.7-10 9.3-10 9.3z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UsersIcon({ size = 22, color = LQ.inkFaint }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={8} r={3.2} stroke={color} strokeWidth={1.8} />
      <Path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M15.5 6.2c1.4.4 2.5 1.7 2.5 3.3 0 1.5-1 2.8-2.4 3.2M18 14.3c2.2.6 3.8 2.6 3.8 4.9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
