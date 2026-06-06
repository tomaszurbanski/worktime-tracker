import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert, SectionList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkSession } from '../types';
import { getSessions, deleteSession } from '../utils/storage';
import {
  formatDate, formatTime, formatShortDuration,
  getSessionDuration, groupSessionsByDate,
} from '../utils/formatters';

const COLORS = {
  primary: '#2563EB', bg: '#F8FAFC', card: '#FFFFFF',
  text: '#1E293B', muted: '#64748B', danger: '#DC2626',
  success: '#16A34A', border: '#E2E8F0',
};

interface Section { title: string; data: WorkSession[]; totalMs: number }

export default function HistoryScreen() {
  const [sections, setSections] = useState<Section[]>([]);

  const loadSessions = useCallback(async () => {
    const all = await getSessions();
    const grouped = groupSessionsByDate(all);
    const result: Section[] = Object.entries(grouped).map(([date, sessions]) => ({
      title: date,
      data: sessions,
      totalMs: sessions.reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0),
    }));
    setSections(result);
  }, []);

  useFocusEffect(useCallback(() => { loadSessions(); }, [loadSessions]));

  const handleDelete = (id: string) => {
    Alert.alert('Usuń sesję', 'Czy na pewno chcesz usunąć tę sesję?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive',
        onPress: async () => { await deleteSession(id); loadSessions(); },
      },
    ]);
  };

  const renderSession = ({ item }: { item: WorkSession }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionLeft}>
        <View style={styles.sessionIconBox}>
          <Ionicons
            name={item.mode === 'auto' ? 'location' : 'hand-left'}
            size={16} color={COLORS.primary}
          />
        </View>
        <View>
          <Text style={styles.sessionTime}>
            {formatTime(item.startTime)}
            {item.endTime ? ` – ${formatTime(item.endTime)}` : ' – teraz'}
          </Text>
          <Text style={styles.sessionMeta}>
            {item.mode === 'auto' ? 'Auto GPS' : 'Ręczny'}
            {item.commuteStartTime ? '  •  z dojazdem' : ''}
          </Text>
        </View>
      </View>
      <View style={styles.sessionRight}>
        <Text style={styles.sessionDuration}>
          {formatShortDuration(getSessionDuration(item.startTime, item.endTime))}
        </Text>
        {!item.endTime && <Text style={styles.activeBadge}>AKTYWNA</Text>}
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionTotal}>{formatShortDuration(section.totalMs)}</Text>
    </View>
  );

  if (sections.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="time-outline" size={64} color={COLORS.muted} />
        <Text style={styles.emptyText}>Brak historii</Text>
        <Text style={styles.emptySubText}>Zacznij pracę na ekranie głównym</Text>
      </View>
    );
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={item => item.id}
      renderItem={renderSession}
      renderSectionHeader={renderSectionHeader}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  list: { padding: 16, gap: 4 },
  empty: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.muted },
  emptySubText: { fontSize: 14, color: COLORS.muted },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bg, paddingVertical: 10, paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  sectionTotal: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  sessionCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionIconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  sessionTime: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  sessionMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  sessionRight: { alignItems: 'flex-end', gap: 4 },
  sessionDuration: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  activeBadge: {
    fontSize: 10, fontWeight: '700', color: COLORS.success,
    backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  deleteBtn: { padding: 4 },
});
