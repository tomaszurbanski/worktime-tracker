import React, { useRef, useCallback, useMemo } from 'react';
import {
  Animated, TouchableWithoutFeedback, View, Text, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

interface Props {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onActivate: () => void;
  disabled?: boolean;
  holdMs?: number;
}

const makeStyles = (C: Colors) => StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  disabled: { opacity: 0.5 },
  bgCircle: { position: 'absolute', borderWidth: 6 },
  progressCircle: {
    position: 'absolute', borderWidth: 6,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  inner: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  hint: { fontSize: 10, color: C.disabledText },
});

export default function HoldButton({ label, icon, color, onActivate, disabled, holdMs = 1000 }: Props) {
  const { colors: C } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(C), [C]);
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
          <View style={[styles.bgCircle, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderColor: disabled ? C.disabledBorder : color + '33' }]} />
          <Animated.View
            style={[
              styles.progressCircle,
              {
                width: SIZE, height: SIZE, borderRadius: SIZE / 2,
                borderColor: color,
                opacity: progress.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 1, 1] }),
                transform: [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '270deg'] }) }],
              },
            ]}
          />
          <View style={[styles.inner, { backgroundColor: disabled ? C.disabledBg : color + '15' }]}>
            <Ionicons name={icon} size={28} color={disabled ? C.disabledText : color} />
          </View>
        </View>
        <Text style={[styles.label, { color: disabled ? C.disabledText : color }]}>{label}</Text>
        <Text style={styles.hint}>{t('common.hold')}</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}
