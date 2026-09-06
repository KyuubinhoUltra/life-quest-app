import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

import { FlameIcon } from '@/components/FlameIcon';

export function AnimatedFlame({ active, size = 24, gradId }: { active: boolean; size?: number; gradId: string }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    t.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 380, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, t]);

  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] });

  return (
    <Animated.View style={active ? { transform: [{ scale }, { translateY }, { rotate }] } : undefined}>
      <FlameIcon size={size} lit={active} gradId={gradId} />
    </Animated.View>
  );
}
