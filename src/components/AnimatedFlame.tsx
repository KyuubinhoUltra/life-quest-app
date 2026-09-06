import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, TextStyle } from 'react-native';

export function AnimatedFlame({ active, style }: { active: boolean; style?: StyleProp<TextStyle> }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, t]);

  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });

  return (
    <Animated.Text style={[style, active && { transform: [{ scale }, { translateY }, { rotate }] }]}>
      🔥
    </Animated.Text>
  );
}
