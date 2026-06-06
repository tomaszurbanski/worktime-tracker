import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTimer } from '../hooks/useTimer';
import { useLocation } from '../hooks/useLocation';
import { useSettings } from '../hooks/useSettings';
import { formatDuration, formatDelegationDuration } from '../utils/formatters';
import HoldButton from '../components/HoldButton';

const C = {
  work: '#16A34A', workStop: '#DC2626',
  delegation: '#D97706', delegationStop: '#7C3AED',
  commute: '#2563EB', commuteStop: '#0369A1',
  bg: '#F8FAFC', card: '#FFFFFF',
  text: '#1E293B', muted: '#64748B', border: '#E2E8F0', primary: '#2563EB',
};

export default function HomeScreen() {
  const { settings } = useSettings();
  const { state, startWork, stopWork, startDelegation, stopDelegation, startCommute, stopCommute } = useTimer();
  const { isAtWork } = useLocation(settings.workLocation, settings.mode === 'auto');
  const prevAtWork = useRef(isAtWork);

  useEffect(() => {
    if (settings.mode !== 'auto') return;
    if (isAtWork && !prevAtWork.current && !state.isWorking) startWork('auto');
    else if (!isAtWork && prevAtWork.current && state.isWorking) stopWork();
    prevAtWork.current = isAtWork;
  }, [isAtWork, settings.mode]);

  const statusLabel = state.isDelegating
    ? (state.isWorking ? (state.isCommuting ? 'Delegacja – dojazd' : 'Delegacja – w pracy') : 'Delegacja – poza pracą')
    : (state.isWorking ? (state.isCommuting ? 'W drodze do pracy' : 'W pracy') : 'Poza pracą');

  const statusColor = state.isCommuting ? C.commute : state.isWorking ? C.work : state.isDelegating ? C.delegation : C.muted;

  const delDuration = formatDelegationDuration(state.delegationElapsed);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Status */}
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        {settings.mode === 'auto' && (
          <View style={styles.gpsBadge}>
            <Ionicons name="location" size={11} color={C.primary} />
            <Text style={styles.gpsBadgeText}>GPS</Text>
          </View>
        )}
      </View>

      {/* Work timer */}
      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>CZAS PRACY</Text>
        <Text style={[styles.timerValue, { color: state.isWorking ? C.work : C.muted }]}>
          {formatDuration(state.workElapsed)}
        </Text>
      </View>

      {/* Delegation timer */}
      {state.isDelegating && (
        <View style={[styles.timerCard, { borderColor: C.delegation + '50', borderWidth: 2 }]}>
          <Text style={styles.timerLabel}>CZAS DELEGACJI</Text>
          <Text style={[styles.timerValueDel, { color: C.delegation }]}>{delDuration.main}</Text>
          <Text style={styles.timerSub}>{delDuration.sub}</Text>
        </View>
      )}

      {/* Main buttons row */}
      <View style={styles.buttonsRow}>
        {!state.isWorking ? (
          <HoldButton icon="play-circle" label="ROZPOCZNIJ" color={C.work} onActivate={() => startWork('manual')} />
        ) : (
          <HoldButton icon="stop-circle" label="ZAKOŃCZ" color={C.workStop} onActivate={stopWork} />
        )}

        {!state.isDelegating ? (
          <HoldButton icon="airplane" label="DELEGACJA" color={C.delegation} onActivate={startDelegation} />
        ) : (
          <HoldButton icon="airplane-outline" label="KONIEC DEL." color={C.delegationStop} onActivate={stopDelegation} />
        )}
      </View>

      {/* Commute button - only visible when work is active */}
      {state.isWorking && (
        <View style={styles.commuteRow}>
          {!state.isCommuting ? (
            <HoldButton icon="car" label="DOJAZD" color={C.commute} onActivate={startCommute} holdMs={1000} />
          ) : (
            <HoldButton icon="car-outline" label="KONIEC DOJAZDU" color={C.commuteStop} onActivate={stopCommute} holdMs={1000} />
          )}
        </View>
      )}

      {/* Hint */}
      <View style={styles.hintBox}>
        <Ionicons name="information-circle-outline" size={15} color={C.muted} />
        <Text style={styles.hintText}>
          {state.isDelegating
            ? 'Delegacja aktywna — sesje pracy przypisane do delegacji automatycznie.'
            : state.isWorking
            ? 'Przycisk Dojazd pojawia się podczas aktywnej pracy.'
            : 'Przytrzymaj przycisk 1 sekundę aby aktywować.'}
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, gap: 14, alignItems: 'center' },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: '600' },
  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EFF6FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10,
  },
  gpsBadgeText: { fontSize: 10, color: C.primary, fontWeight: '700' },
  timerCard: {
    width: '100%', backgroundColor: C.card, borderRadius: 20,
    paddingVertical: 22, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  timerLabel: { fontSize: 11, color: C.muted, fontWeight: '700', marginBottom: 6, letterSpacing: 1.5 },
  timerValue: { fontSize: 54, fontWeight: '700', letterSpacing: 2 },
  timerValueDel: { fontSize: 30, fontWeight: '700', textAlign: 'center' },
  timerSub: { fontSize: 13, color: C.delegation, fontWeight: '500', marginTop: 4, opacity: 0.85 },
  buttonsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    width: '100%', paddingVertical: 8,
  },
  commuteRow: {
    width: '100%', alignItems: 'center', paddingVertical: 4,
  },
  hintBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: C.card, padding: 12, borderRadius: 12, width: '100%',
  },
  hintText: { flex: 1, fontSize: 12, color: C.muted, lineHeight: 17 },
});
