import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTimer } from '../hooks/useTimer';
import { useLocation } from '../hooks/useLocation';
import { useSettings } from '../hooks/useSettings';
import { formatDuration } from '../utils/formatters';
import HoldButton from '../components/HoldButton';

const COLORS = {
  work: '#16A34A',
  workStop: '#DC2626',
  delegation: '#D97706',
  delegationStop: '#7C3AED',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  primary: '#2563EB',
};

export default function HomeScreen() {
  const { settings } = useSettings();
  const { state, startWork, stopWork, startDelegation, stopDelegation } = useTimer();
  const { isAtWork } = useLocation(settings.workLocation, settings.mode === 'auto');
  const prevAtWork = useRef(isAtWork);

  useEffect(() => {
    if (settings.mode !== 'auto') return;
    if (isAtWork && !prevAtWork.current && !state.isWorking) {
      startWork('auto');
    } else if (!isAtWork && prevAtWork.current && state.isWorking) {
      stopWork();
    }
    prevAtWork.current = isAtWork;
  }, [isAtWork, settings.mode]);

  const statusLabel = state.isDelegating
    ? (state.isWorking ? 'Delegacja – w pracy' : 'Delegacja – poza pracą')
    : (state.isWorking ? 'W pracy' : 'Poza pracą');

  const statusColor = state.isWorking ? COLORS.work : state.isDelegating ? COLORS.delegation : COLORS.muted;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Status */}
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        {settings.mode === 'auto' && (
          <View style={styles.gpsBadge}>
            <Ionicons name="location" size={11} color={COLORS.primary} />
            <Text style={styles.gpsBadgeText}>GPS</Text>
          </View>
        )}
      </View>

      {/* Work timer */}
      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>Czas pracy</Text>
        <Text style={[styles.timerValue, { color: state.isWorking ? COLORS.work : COLORS.muted }]}>
          {formatDuration(state.workElapsed)}
        </Text>
      </View>

      {/* Delegation timer (visible only when delegating) */}
      {state.isDelegating && (
        <View style={[styles.timerCard, styles.timerCardDel]}>
          <Text style={styles.timerLabel}>Czas delegacji</Text>
          <Text style={[styles.timerValue, { color: COLORS.delegation }]}>
            {formatDuration(state.delegationElapsed)}
          </Text>
        </View>
      )}

      {/* Buttons */}
      <View style={styles.buttonsRow}>

        {/* Work button */}
        {!state.isWorking ? (
          <HoldButton
            icon="play-circle"
            label="ROZPOCZNIJ PRACĘ"
            color={COLORS.work}
            onActivate={() => startWork('manual')}
          />
        ) : (
          <HoldButton
            icon="stop-circle"
            label="ZAKOŃCZ PRACĘ"
            color={COLORS.workStop}
            onActivate={stopWork}
          />
        )}

        {/* Delegation button */}
        {!state.isDelegating ? (
          <HoldButton
            icon="airplane"
            label="START DELEGACJA"
            color={COLORS.delegation}
            onActivate={startDelegation}
          />
        ) : (
          <HoldButton
            icon="airplane-outline"
            label="KONIEC DELEGACJI"
            color={COLORS.delegationStop}
            onActivate={stopDelegation}
          />
        )}

      </View>

      {/* Hint */}
      <View style={styles.hintBox}>
        <Ionicons name="information-circle-outline" size={16} color={COLORS.muted} />
        <Text style={styles.hintText}>
          {state.isDelegating
            ? 'Delegacja aktywna — sesje pracy są automatycznie przypisane do delegacji.'
            : 'Przytrzymaj przycisk przez 1 sekundę aby go aktywować.'}
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 16, alignItems: 'center' },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: '600' },
  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EFF6FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10,
  },
  gpsBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: '700' },
  timerCard: {
    width: '100%', backgroundColor: COLORS.card, borderRadius: 20,
    paddingVertical: 24, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  timerCardDel: { borderWidth: 2, borderColor: COLORS.delegation + '40' },
  timerLabel: { fontSize: 12, color: COLORS.muted, fontWeight: '500', marginBottom: 6, letterSpacing: 1 },
  timerValue: { fontSize: 56, fontWeight: '700', letterSpacing: 2 },
  buttonsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    width: '100%', paddingVertical: 16,
  },
  hintBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.card, padding: 14, borderRadius: 12, width: '100%',
  },
  hintText: { flex: 1, fontSize: 12, color: COLORS.muted, lineHeight: 18 },
});
