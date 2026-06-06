import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTimer } from '../hooks/useTimer';
import { useLocation } from '../hooks/useLocation';
import { useSettings } from '../hooks/useSettings';
import { formatDuration, formatTime } from '../utils/formatters';

const COLORS = {
  primary: '#2563EB',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
};

export default function HomeScreen() {
  const { settings } = useSettings();
  const { state, startWork, stopWork, startCommute, stopCommute } = useTimer();
  const { isAtWork } = useLocation(settings.workLocation, settings.mode === 'auto');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevAtWork = useRef(isAtWork);

  useEffect(() => {
    if (state.isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state.isRunning]);

  useEffect(() => {
    if (settings.mode !== 'auto') return;
    if (isAtWork && !prevAtWork.current && !state.isRunning) {
      startWork('auto');
    } else if (!isAtWork && prevAtWork.current && state.isRunning) {
      stopWork();
    }
    prevAtWork.current = isAtWork;
  }, [isAtWork, settings.mode]);

  const handleMainButton = () => {
    if (state.isRunning) {
      Alert.alert('Zakończyć pracę?', 'Czy na pewno chcesz zatrzymać licznik?', [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Zakończ', style: 'destructive', onPress: stopWork },
      ]);
    } else {
      startWork('manual');
    }
  };

  const statusColor = state.isRunning ? COLORS.success : COLORS.muted;
  const statusText = state.isRunning
    ? (state.isCommuting ? 'W drodze do pracy' : 'W pracy')
    : 'Poza pracą';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        {settings.mode === 'auto' && (
          <View style={styles.modeBadge}>
            <Ionicons name="location" size={12} color={COLORS.primary} />
            <Text style={styles.modeText}>AUTO GPS</Text>
          </View>
        )}
      </View>

      <Animated.View style={[styles.timerCard, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.timerLabel}>Czas pracy</Text>
        <Text style={styles.timerText}>{formatDuration(state.elapsed)}</Text>
        {state.startTime && (
          <Text style={styles.timerSub}>Start: {formatTime(state.startTime)}</Text>
        )}
      </Animated.View>

      {settings.mode === 'manual' && (
        <TouchableOpacity
          style={[styles.mainBtn, state.isRunning ? styles.stopBtn : styles.startBtn]}
          onPress={handleMainButton}
          activeOpacity={0.8}
        >
          <Ionicons
            name={state.isRunning ? 'stop-circle' : 'play-circle'}
            size={32}
            color="#fff"
          />
          <Text style={styles.mainBtnText}>
            {state.isRunning ? 'ZATRZYMAJ' : 'ROZPOCZNIJ'}
          </Text>
        </TouchableOpacity>
      )}

      {settings.commuteTracking && state.isRunning && (
        <TouchableOpacity
          style={[styles.commuteBtn, state.isCommuting ? styles.commutingActive : {}]}
          onPress={state.isCommuting ? stopCommute : startCommute}
        >
          <Ionicons name="car" size={20} color={state.isCommuting ? '#fff' : COLORS.warning} />
          <Text style={[styles.commuteBtnText, state.isCommuting && { color: '#fff' }]}>
            {state.isCommuting ? 'Zakończ dojazd' : 'Dojazd do pracy'}
          </Text>
        </TouchableOpacity>
      )}

      {settings.mode === 'auto' && !settings.workLocation && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.warning} />
          <Text style={styles.infoText}>
            Ustaw lokalizację pracy w Ustawieniach aby włączyć tryb auto.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, alignItems: 'center', gap: 20 },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: '600' },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    marginLeft: 4,
  },
  modeText: { fontSize: 10, color: COLORS.primary, fontWeight: '700' },
  timerCard: {
    width: '100%', backgroundColor: COLORS.card, borderRadius: 24,
    padding: 36, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  timerLabel: { fontSize: 14, color: COLORS.muted, fontWeight: '500', marginBottom: 8 },
  timerText: { fontSize: 64, fontWeight: '700', color: COLORS.text, letterSpacing: 2 },
  timerSub: { fontSize: 13, color: COLORS.muted, marginTop: 8 },
  mainBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingVertical: 18, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  startBtn: { backgroundColor: COLORS.success },
  stopBtn: { backgroundColor: COLORS.danger },
  mainBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  commuteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12,
    borderWidth: 2, borderColor: COLORS.warning,
  },
  commutingActive: { backgroundColor: COLORS.warning, borderColor: COLORS.warning },
  commuteBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.warning },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB', padding: 14, borderRadius: 12, width: '100%',
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.warning },
});
