import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { WorkSession } from '../types';
import { getSessionDuration } from '../utils/formatters';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

interface Props {
  sessions: WorkSession[];
  from: Date;
  to: Date;
}

interface DayBar {
  label: string;         // "Pn", "Wt" or date "12"
  dateKey: string;       // YYYY-MM-DD
  workMs: number;
  delegationMs: number;
  isToday: boolean;
  isWeekend: boolean;
}

const DAY_SHORT = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
const MAX_BAR_HEIGHT = 80;
const MIN_VISIBLE_HEIGHT = 3;

const makeStyles = (C: Colors) => StyleSheet.create({
  container: { gap: 6 },
  title: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1 },
  chartArea: { height: MAX_BAR_HEIGHT + 28, position: 'relative' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: MAX_BAR_HEIGHT, gap: 3 },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: MAX_BAR_HEIGHT },
  barWork: { width: '100%', borderRadius: 4, minHeight: MIN_VISIBLE_HEIGHT },
  barDelegation: { width: '100%', borderRadius: 4, minHeight: MIN_VISIBLE_HEIGHT },
  labelsRow: { flexDirection: 'row', marginTop: 4, gap: 3 },
  barLabel: { flex: 1, textAlign: 'center', fontSize: 9, color: C.muted, fontWeight: '500' },
  barLabelToday: { color: C.primary, fontWeight: '700' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary, alignSelf: 'center', marginTop: 2 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: C.muted },
  noData: { textAlign: 'center', color: C.muted, fontSize: 13, paddingVertical: 20 },
  peakLabel: { position: 'absolute', top: 0, right: 0, fontSize: 9, color: C.muted },
});

const buildDayBars = (sessions: WorkSession[], from: Date, to: Date): DayBar[] => {
  const bars: DayBar[] = [];
  const todayKey = new Date().toISOString().split('T')[0];

  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  const diffDays = Math.round((end.getTime() - cursor.getTime()) / 86400000);
  if (diffDays > 62) return []; // too many days — skip chart

  while (cursor <= end) {
    const key = cursor.toISOString().split('T')[0];
    const dow = cursor.getDay();
    const label = diffDays <= 14 ? DAY_SHORT[dow] : String(cursor.getDate());
    const daySessions = sessions.filter(s => s.startTime >= cursor.getTime() && s.startTime < cursor.getTime() + 86400000);
    const workMs = daySessions
      .filter(s => !s.delegation?.isTrip)
      .reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0);
    const delegationMs = daySessions
      .filter(s => s.delegation?.isTrip)
      .reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0);
    bars.push({ label, dateKey: key, workMs, delegationMs, isToday: key === todayKey, isWeekend: dow === 0 || dow === 6 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return bars;
};

export default function DailyBarChart({ sessions, from, to }: Props) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const bars = useMemo(() => buildDayBars(sessions, from, to), [sessions, from, to]);

  if (bars.length === 0) {
    return <Text style={styles.noData}>—</Text>;
  }

  const maxMs = Math.max(...bars.map(b => b.workMs + b.delegationMs), 1);
  const peakH = Math.round(maxMs / 3600000);

  const hasDelegations = bars.some(b => b.delegationMs > 0);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: bars.length * 18 }}>
          <View style={styles.chartArea}>
            <Text style={styles.peakLabel}>{peakH}h</Text>
            <View style={styles.barsRow}>
              {bars.map(bar => {
                const totalMs = bar.workMs + bar.delegationMs;
                const totalH = (totalMs / maxMs) * MAX_BAR_HEIGHT;
                const workH = (bar.workMs / maxMs) * MAX_BAR_HEIGHT;
                const delH = totalH - workH;
                return (
                  <View key={bar.dateKey} style={styles.barWrap}>
                    {bar.delegationMs > 0 && (
                      <View style={[styles.barDelegation, { height: Math.max(delH, MIN_VISIBLE_HEIGHT), backgroundColor: C.delegation + 'CC' }]} />
                    )}
                    {bar.workMs > 0 && (
                      <View style={[styles.barWork, { height: Math.max(workH, MIN_VISIBLE_HEIGHT), backgroundColor: bar.isToday ? C.primary : C.success + 'CC' }]} />
                    )}
                    {totalMs === 0 && bar.isWeekend && (
                      <View style={{ height: 3, width: '100%', borderRadius: 2, backgroundColor: C.border }} />
                    )}
                  </View>
                );
              })}
            </View>
            <View style={styles.labelsRow}>
              {bars.map(bar => (
                <View key={bar.dateKey} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[styles.barLabel, bar.isToday && styles.barLabelToday]}>{bar.label}</Text>
                  {bar.isToday && <View style={styles.todayDot} />}
                </View>
              ))}
            </View>
          </View>

          {hasDelegations && (
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: C.success + 'CC' }]} />
                <Text style={styles.legendText}>Praca</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: C.delegation + 'CC' }]} />
                <Text style={styles.legendText}>Delegacja</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
