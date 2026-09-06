import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, Text, TextStyle } from 'react-native';

export function AnimatedFlame({ active, style }: { active: boolean; style?: StyleProp<TextStyle> }) {
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

  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['-7deg', '7deg'] });

  return (
    <Animated.View
      style={active ? { transform: [{ scale }, { translateY }, { rotate }] } : undefined}>
      <Text style={style}>🔥</Text>
    </Animated.View>
  );
}
