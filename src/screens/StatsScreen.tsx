import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WorkSession } from '../types';
import { getSessions } from '../utils/storage';
import { useSettings } from '../hooks/useSettings';
import { formatShortDuration, getSessionDuration, getMonthName } from '../utils/formatters';
import { exportToPDF } from '../utils/export';

const COLORS = {
  primary: '#2563EB', bg: '#F8FAFC', card: '#FFFFFF',
  text: '#1E293B', muted: '#64748B', success: '#16A34A',
  warning: '#D97706', border: '#E2E8F0', danger: '#DC2626',
};

type Preset = 'week' | 'month' | 'lastMonth' | 'year' | 'custom';

const getPresetRange = (preset: Preset, t: (k: string) => string): { from: Date; to: Date; label: string } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === 'week') {
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const from = new Date(today); from.setDate(today.getDate() + diff);
    const to = new Date(from); to.setDate(from.getDate() + 6); to.setHours(23, 59, 59, 999);
    return { from, to, label: t('stats.thisWeek') };
  }
  if (preset === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from, to, label: `${getMonthName(now.getMonth())} ${now.getFullYear()}` };
  }
  if (preset === 'lastMonth') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { from, to, label: `${getMonthName(now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1)} ${now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}` };
  }
  if (preset === 'year') {
    const from = new Date(now.getFullYear(), 0, 1);
    const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { from, to, label: `${now.getFullYear()}` };
  }
  return { from: today, to: new Date(today.getTime() + 86399999), label: t('stats.custom') };
};

const parseDate = (str: string): Date | null => {
  const parts = str.split('.');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y || y < 2000) return null;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
};

export default function StatsScreen() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [allSessions, setAllSessions] = useState<WorkSession[]>([]);
  const [preset, setPreset] = useState<Preset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [exporting, setExporting] = useState(false);

  useFocusEffect(useCallback(() => { getSessions().then(setAllSessions); }, []));

  const PRESETS: { key: Preset; label: string }[] = [
    { key: 'week', label: t('stats.thisWeek') },
    { key: 'month', label: t('stats.thisMonth') },
    { key: 'lastMonth', label: t('stats.lastMonth') },
    { key: 'year', label: t('stats.thisYear') },
    { key: 'custom', label: t('stats.custom') },
  ];

  const getRange = (): { from: Date; to: Date; label: string } | null => {
    if (preset !== 'custom') return getPresetRange(preset, t);
    const from = parseDate(customFrom);
    const to = parseDate(customTo);
    if (!from || !to) return null;
    to.setHours(23, 59, 59, 999);
    return { from, to, label: `${customFrom} – ${customTo}` };
  };

  const filtered = (() => {
    const range = getRange();
    if (!range) return [];
    return allSessions.filter(s => s.startTime >= range.from.getTime() && s.startTime <= range.to.getTime());
  })();

  const totalMs = filtered.reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0);
  const workCount = filtered.filter(s => s.type !== 'delegation').length;
  const delegationCount = filtered.filter(s => s.type === 'delegation').length;
  const avgMs = workCount > 0 ? totalMs / workCount : 0;

  const handleExport = async () => {
    const range = getRange();
    if (!range) { Alert.alert(t('common.error'), t('stats.invalidDates')); return; }
    if (filtered.length === 0) { Alert.alert(t('stats.noData'), t('stats.noEntries')); return; }
    setExporting(true);
    try {
      await exportToPDF(filtered, range.label, settings);
    } catch {
      Alert.alert(t('common.error'), t('stats.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const range = getRange();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Text style={styles.sectionLabel}>{t('stats.timeRange')}</Text>
      <View style={styles.presetRow}>
        {PRESETS.map(p => (
          <TouchableOpacity key={p.key} style={[styles.presetBtn, preset === p.key && styles.presetBtnActive]} onPress={() => setPreset(p.key)}>
            <Text style={[styles.presetText, preset === p.key && styles.presetTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {preset === 'custom' && (
        <View style={styles.card}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>{t('stats.fromDate')}</Text>
              <TextInput style={styles.dateInput} value={customFrom} onChangeText={setCustomFrom} placeholder="01.01.2025" placeholderTextColor={COLORS.muted} keyboardType="numeric" />
            </View>
            <Ionicons name="arrow-forward" size={16} color={COLORS.muted} style={{ marginTop: 24 }} />
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>{t('stats.toDate')}</Text>
              <TextInput style={styles.dateInput} value={customTo} onChangeText={setCustomTo} placeholder="31.01.2025" placeholderTextColor={COLORS.muted} keyboardType="numeric" />
            </View>
          </View>
        </View>
      )}

      {range && (
        <>
          <Text style={styles.sectionLabel}>{t('stats.summary')} — {range.label.toUpperCase()}</Text>
          <View style={styles.card}>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatShortDuration(totalMs)}</Text>
                <Text style={styles.statLabel}>{t('stats.total')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{workCount}</Text>
                <Text style={styles.statLabel}>{t('stats.workDays')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatShortDuration(avgMs)}</Text>
                <Text style={styles.statLabel}>{t('stats.avgPerDay')}</Text>
              </View>
            </View>
            {delegationCount > 0 && (
              <View style={styles.delegationRow}>
                <Ionicons name="airplane" size={16} color={COLORS.warning} />
                <Text style={styles.delegationText}>{t('stats.delegations', { count: delegationCount })}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.exportBtn, filtered.length === 0 && styles.exportBtnDisabled]}
            onPress={handleExport}
            disabled={exporting || filtered.length === 0}
          >
            {exporting ? <ActivityIndicator color="#fff" /> : <Ionicons name="document-text-outline" size={20} color="#fff" />}
            <Text style={styles.exportText}>
              {exporting ? t('stats.generating') : `${t('stats.exportPdf')} (${t('stats.entries', { count: filtered.length })})`}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {range && filtered.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color={COLORS.muted} />
          <Text style={styles.emptyText}>{t('stats.empty')}</Text>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 1, paddingHorizontal: 2 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  presetBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  presetText: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  presetTextActive: { color: '#fff' },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '600', marginBottom: 6 },
  dateInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, fontSize: 14, color: COLORS.text, backgroundColor: COLORS.bg },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center', flex: 1, paddingVertical: 8 },
  statValue: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.muted, marginTop: 4, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  delegationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  delegationText: { fontSize: 13, color: COLORS.warning, fontWeight: '500' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, shadowColor: COLORS.primary, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  exportBtnDisabled: { backgroundColor: COLORS.muted },
  exportText: { color: '#fff', fontSize: 15, fontWeight: '600', flexShrink: 1 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 15, color: COLORS.muted },
});
