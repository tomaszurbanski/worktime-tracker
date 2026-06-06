import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkSession } from '../types';
import { getSessions } from '../utils/storage';
import {
  formatShortDuration, getSessionDuration,
  getMonthName, getWeekStart, formatDate,
} from '../utils/formatters';
import { exportToCSV, exportToPDF } from '../utils/export';

const COLORS = {
  primary: '#2563EB', bg: '#F8FAFC', card: '#FFFFFF',
  text: '#1E293B', muted: '#64748B', success: '#16A34A',
  warning: '#D97706', border: '#E2E8F0',
};

interface MonthData {
  label: string;
  year: number;
  month: number;
  totalMs: number;
  workDays: number;
  delegations: number;
  sessions: WorkSession[];
}

interface WeekData {
  label: string;
  totalMs: number;
  days: { label: string; ms: number }[];
}

export default function StatsScreen() {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [currentWeek, setCurrentWeek] = useState<WeekData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    const all = await getSessions();

    const monthMap: Record<string, MonthData> = {};
    all.forEach(s => {
      const d = new Date(s.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthMap[key]) {
        monthMap[key] = {
          label: `${getMonthName(d.getMonth())} ${d.getFullYear()}`,
          year: d.getFullYear(),
          month: d.getMonth(),
          totalMs: 0,
          workDays: 0,
          delegations: 0,
          sessions: [],
        };
      }
      monthMap[key].totalMs += getSessionDuration(s.startTime, s.endTime);
      monthMap[key].sessions.push(s);
      if (s.type === 'delegation') monthMap[key].delegations++;
      else monthMap[key].workDays++;
    });

    const monthList = Object.values(monthMap).sort((a, b) =>
      b.year !== a.year ? b.year - a.year : b.month - a.month
    );
    setMonths(monthList);
    if (monthList.length > 0 && !selectedMonth) setSelectedMonth(monthList[0]);

    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
    const weekSessions = all.filter(s =>
      s.startTime >= weekStart.getTime() && s.startTime < weekEnd.getTime()
    );
    const dayNames = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
    const days = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(weekStart.getTime() + i * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const ms = weekSessions
        .filter(s => s.startTime >= dayStart.getTime() && s.startTime < dayEnd.getTime())
        .reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0);
      return { label: dayNames[i], ms };
    });
    const weekTotal = days.reduce((sum, d) => sum + d.ms, 0);
    setCurrentWeek({
      label: `${formatDate(weekStart.getTime())} – ${formatDate(weekEnd.getTime() - 1)}`,
      totalMs: weekTotal,
      days,
    });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!selectedMonth) return;
    setExporting(true);
    try {
      const filename = `raport_${selectedMonth.year}_${String(selectedMonth.month + 1).padStart(2, '0')}`;
      if (format === 'csv') {
        await exportToCSV(selectedMonth.sessions, filename);
      } else {
        await exportToPDF(selectedMonth.sessions, selectedMonth.label, selectedMonth.totalMs);
      }
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się wygenerować raportu.');
    } finally {
      setExporting(false);
    }
  };

  const maxMs = currentWeek ? Math.max(...currentWeek.days.map(d => d.ms), 1) : 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {currentWeek && (
        <>
          <Text style={styles.sectionLabel}>TEN TYDZIEŃ</Text>
          <View style={styles.card}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekLabel}>{currentWeek.label}</Text>
              <Text style={styles.weekTotal}>{formatShortDuration(currentWeek.totalMs)}</Text>
            </View>
            <View style={styles.barChart}>
              {currentWeek.days.map((day, i) => (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barValue}>
                    {day.ms > 0 ? formatShortDuration(day.ms) : ''}
                  </Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, {
                      height: day.ms > 0 ? Math.max((day.ms / maxMs) * 80, 4) : 0,
                      backgroundColor: i < 5 ? COLORS.primary : COLORS.muted,
                    }]} />
                  </View>
                  <Text style={[styles.barDay, i >= 5 && { color: COLORS.muted }]}>{day.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>RAPORT MIESIĘCZNY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthTabs}>
        {months.map(m => (
          <TouchableOpacity
            key={`${m.year}-${m.month}`}
            style={[styles.monthTab, selectedMonth?.month === m.month && selectedMonth?.year === m.year && styles.monthTabActive]}
            onPress={() => setSelectedMonth(m)}
          >
            <Text style={[styles.monthTabText, selectedMonth?.month === m.month && selectedMonth?.year === m.year && styles.monthTabTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedMonth && (
        <View style={styles.card}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatShortDuration(selectedMonth.totalMs)}</Text>
              <Text style={styles.statLabel}>Łącznie</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{selectedMonth.workDays}</Text>
              <Text style={styles.statLabel}>Dni pracy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{selectedMonth.delegations}</Text>
              <Text style={styles.statLabel}>Delegacje</Text>
            </View>
          </View>

          <View style={styles.exportRow}>
            <Text style={styles.exportLabel}>Eksportuj raport:</Text>
            <View style={styles.exportBtns}>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={() => handleExport('csv')}
                disabled={exporting}
              >
                {exporting ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Ionicons name="document-text" size={16} color="#fff" />
                    <Text style={styles.exportBtnText}>CSV</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportBtn, { backgroundColor: COLORS.success }]}
                onPress={() => handleExport('pdf')}
                disabled={exporting}
              >
                {exporting ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Ionicons name="document" size={16} color="#fff" />
                    <Text style={styles.exportBtnText}>PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {months.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="bar-chart-outline" size={64} color={COLORS.muted} />
          <Text style={styles.emptyText}>Brak danych</Text>
          <Text style={styles.emptySubText}>Zacznij śledzić czas pracy</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, gap: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.muted,
    letterSpacing: 1, paddingHorizontal: 4, marginTop: 8, marginBottom: 4,
  },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  weekLabel: { fontSize: 13, color: COLORS.muted },
  weekTotal: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, color: COLORS.primary, fontWeight: '600', textAlign: 'center' },
  barTrack: { width: 28, height: 80, justifyContent: 'flex-end' },
  barFill: { width: 28, borderRadius: 4 },
  barDay: { fontSize: 11, color: COLORS.text, fontWeight: '500' },
  monthTabs: { flexGrow: 0, marginBottom: 8 },
  monthTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.card, marginRight: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  monthTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  monthTabText: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  monthTabTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  exportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  exportLabel: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  exportBtns: { flexDirection: 'row', gap: 8 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
  },
  exportBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.muted },
  emptySubText: { fontSize: 14, color: COLORS.muted },
});
