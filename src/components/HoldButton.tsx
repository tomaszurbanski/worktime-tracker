import React, { useRef, useCallback } from 'react';
import {
  Animated, TouchableWithoutFeedback, View, Text, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onActivate: () => void;
  disabled?: boolean;
  holdMs?: number;
}

export default function HoldButton({ label, icon, color, onActivate, disabled, holdMs = 1000 }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const activated = useRef(false);

  const SIZE = 100;
  const STROKE = 6;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    activated.current = false;
    progress.setValue(0);

    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: holdMs,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished && !activated.current) {
        activated.current = true;
        onActivate();
        progress.setValue(0);
      }
    });

    timerRef.current = setTimeout(() => {}, holdMs);
  }, [disabled, holdMs, onActivate, progress]);

  const handlePressOut = useCallback(() => {
    if (activated.current) return;
    animRef.current?.stop();
    Animated.timing(progress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled}>
      <View style={[styles.wrap, disabled && styles.disabled]}>
        <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
          {/* Background circle */}
          <View style={[styles.bgCircle, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderColor: disabled ? '#E2E8F0' : color + '33' }]} />
          {/* Progress arc using animated border */}
          <Animated.View
            style={[
              styles.progressCircle,
              {
                width: SIZE,
                height: SIZE,
                borderRadius: SIZE / 2,
                borderColor: color,
                opacity: progress.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 1, 1] }),
                transform: [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '270deg'] }) }],
              },
            ]}
          />
          {/* Inner circle with icon */}
          <View style={[styles.inner, { backgroundColor: disabled ? '#F1F5F9' : color + '15' }]}>
            <Ionicons name={icon} size={28} color={disabled ? '#94A3B8' : color} />
          </View>
        </View>
        <Text style={[styles.label, { color: disabled ? '#94A3B8' : color }]}>{label}</Text>
        <Text style={styles.hint}>Przytrzymaj</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  disabled: { opacity: 0.5 },
  bgCircle: {
    position: 'absolute', borderWidth: 6,
  },
  progressCircle: {
    position: 'absolute',
    borderWidth: 6,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  inner: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  hint: { fontSize: 10, color: '#94A3B8' },
});
