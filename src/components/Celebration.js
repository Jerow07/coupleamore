// Animación de celebración: lluvia de corazones cuando la pareja está cerca

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEARTS = ['💕', '❤️', '🧡', '💗', '💖', '💝'];
const NUM_HEARTS = 16;

/**
 * Corazón animado individual
 */
function FallingHeart({ delay, onDone }) {
  const translateY = useSharedValue(-60);
  const translateX = useSharedValue(Math.random() * SCREEN_WIDTH);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.8 + Math.random() * 0.8);
  const emoji = HEARTS[Math.floor(Math.random() * HEARTS.length)];

  useEffect(() => {
    const targetY = SCREEN_HEIGHT * 0.7;
    translateY.value = withDelay(
      delay,
      withTiming(targetY, {
        duration: 1800 + Math.random() * 600,
        easing: Easing.out(Easing.quad),
      })
    );
    opacity.value = withDelay(
      delay + 1200,
      withTiming(0, { duration: 600 }, (finished) => {
        if (finished) runOnJS(onDone)();
      })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.heart, style]}>{emoji}</Animated.Text>
  );
}

/**
 * Componente de celebración.
 * Muestra la lluvia de corazones una vez por cada vez que `active` pase de false→true.
 *
 * @param {{ active: boolean }} props
 */
export default function Celebration({ active }) {
  const [visible, setVisible] = useState(false);
  const [hearts, setHearts] = useState([]);
  const doneCountRef = useRef(0);
  const prevActiveRef = useRef(false);

  const triggerCelebration = useCallback(() => {
    if (visible) return;
    doneCountRef.current = 0;
    const newHearts = Array.from({ length: NUM_HEARTS }, (_, i) => ({
      id: Date.now() + i,
      delay: i * 80,
    }));
    setHearts(newHearts);
    setVisible(true);
  }, [visible]);

  // Detectar flanco ascendente: false → true
  useEffect(() => {
    if (active && !prevActiveRef.current) {
      triggerCelebration();
    }
    prevActiveRef.current = active;
  }, [active, triggerCelebration]);

  const handleHeartDone = useCallback(() => {
    doneCountRef.current += 1;
    if (doneCountRef.current >= NUM_HEARTS) {
      setVisible(false);
      setHearts([]);
    }
  }, []);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {hearts.map((h) => (
        <FallingHeart key={h.id} delay={h.delay} onDone={handleHeartDone} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heart: {
    position: 'absolute',
    top: 0,
    fontSize: 28,
  },
});
