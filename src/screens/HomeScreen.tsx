import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTimer } from '../hooks/useTimer';
import { useLocation } from '../hooks/useLocation';
import { useSettings } from '../hooks/useSettings';
import { formatDuration, formatDelegationDuration } from '../utils/formatters';
import HoldButton from '../components/HoldButton';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

const makeStyles = (C: Colors) => StyleSheet.create({
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
    backgroundColor: C.primaryBg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10,
  },
  gpsBadgeText: { fontSize: 10, color: C.primary, fontWeight: '700' },
  timerCard: {
    width: '100%', backgroundColor: C.card, borderRadius: 20,
    paddingVertical: 22, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  timerLabel: { fontSize: 11, color: C.muted, fontWeight: '700', marginBottom: 6, letterSpacing: 1.5 },
  timerValue: { fontSize: 54, fontWeight: '700', letterSpacing: 2 },
  timerValueDel: { fontSize: 30, fontWeight: '700', textAlign: 'center', color: C.warning },
  timerSub: { fontSize: 13, color: C.warning, fontWeight: '500', marginTop: 4, opacity: 0.85 },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingVertical: 8 },
  commuteRow: { width: '100%', alignItems: 'center', paddingVertical: 4 },
  hintBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: C.card, padding: 12, borderRadius: 12, width: '100%',
  },
  hintText: { flex: 1, fontSize: 12, color: C.muted, lineHeight: 17 },
});

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
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
    ? (state.isWorking
      ? (state.isCommuting ? t('home.status.delegationCommute') : t('home.status.delegationWork'))
      : t('home.status.delegationOutside'))
    : (state.isWorking
      ? (state.isCommuting ? t('home.status.commuting') : t('home.status.atWork'))
      : t('home.status.outsideWork'));

  const statusColor = state.isCommuting ? C.primary : state.isWorking ? C.success : state.isDelegating ? C.warning : C.muted;
  const delDuration = formatDelegationDuration(state.delegationElapsed);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

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

      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>{t('home.workTime')}</Text>
        <Text style={[styles.timerValue, { color: state.isWorking ? C.success : C.muted }]}>
          {formatDuration(state.workElapsed)}
        </Text>
      </View>

      {state.isDelegating && (
        <View style={[styles.timerCard, { borderColor: C.warning + '50', borderWidth: 2 }]}>
          <Text style={styles.timerLabel}>{t('home.delegationTime')}</Text>
          <Text style={styles.timerValueDel}>{delDuration.main}</Text>
          <Text style={styles.timerSub}>{delDuration.sub}</Text>
        </View>
      )}

      <View style={styles.buttonsRow}>
        {!state.isWorking ? (
          <HoldButton icon="play-circle" label={t('home.start')} color={C.success} onActivate={() => startWork('manual')} />
        ) : (
          <HoldButton icon="stop-circle" label={t('home.stop')} color={C.danger} onActivate={stopWork} />
        )}
        {!state.isDelegating ? (
          <HoldButton icon="airplane" label={t('home.delegation')} color={C.warning} onActivate={startDelegation} />
        ) : (
          <HoldButton icon="airplane-outline" label={t('home.stopDelegation')} color={C.delegation} onActivate={stopDelegation} />
        )}
      </View>

      {state.isWorking && (
        <View style={styles.commuteRow}>
          {!state.isCommuting ? (
            <HoldButton icon="car" label={t('home.commute')} color={C.primary} onActivate={startCommute} holdMs={1000} />
          ) : (
            <HoldButton icon="car-outline" label={t('home.stopCommute')} color={C.commute} onActivate={stopCommute} holdMs={1000} />
          )}
        </View>
      )}

      <View style={styles.hintBox}>
        <Ionicons name="information-circle-outline" size={15} color={C.muted} />
        <Text style={styles.hintText}>
          {state.isDelegating
            ? t('home.hint.delegation')
            : state.isWorking
            ? t('home.hint.commute')
            : t('home.hint.default')}
        </Text>
      </View>

    </ScrollView>
  );
}
