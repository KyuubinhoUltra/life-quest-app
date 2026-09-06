import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { LQ } from '@/constants/life-quest-theme';

export function FlameIcon({ size = 24, lit = true, gradId }: { size?: number; lit?: boolean; gradId: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lit ? LQ.gold : LQ.inkFaint} />
          <Stop offset="1" stopColor={lit ? LQ.goldInk : LQ.line} />
        </LinearGradient>
      </Defs>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.176 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
        fill={`url(#${gradId})`}
      />
    </Svg>
  );
}
