import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, SectionList,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
  success: '#16A34A', border: '#E2E8F0', warning: '#D97706',
};

interface Section { title: string; data: WorkSession[]; totalMs: number }

export default function HistoryScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [filter, setFilter] = useState<'all' | 'work' | 'delegation'>('all');
  const navigation = useNavigation<any>();

  const loadSessions = useCallback(async () => {
    const all = await getSessions();
    const filtered = filter === 'all' ? all : all.filter(s => s.type === filter);
    const grouped = groupSessionsByDate(filtered);
    const result: Section[] = Object.entries(grouped).map(([date, sessions]) => ({
      title: date,
      data: sessions,
      totalMs: sessions.reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0),
    }));
    setSections(result);
  }, [filter]);

  useFocusEffect(useCallback(() => { loadSessions(); }, [loadSessions]));

  const handleDelete = (id: string) => {
    Alert.alert('Usuń', 'Czy na pewno chcesz usunąć ten wpis?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive',
        onPress: async () => { await deleteSession(id); loadSessions(); },
      },
    ]);
  };

  const renderSession = ({ item }: { item: WorkSession }) => {
    const isDelegation = item.type === 'delegation';
    return (
      <View style={styles.sessionCard}>
        <View style={styles.sessionLeft}>
          <View style={[styles.sessionIconBox, isDelegation && styles.sessionIconBoxDel]}>
            <Ionicons
              name={isDelegation ? 'airplane' : (item.mode === 'auto' ? 'location' : 'hand-left')}
              size={16}
              color={isDelegation ? COLORS.warning : COLORS.primary}
            />
          </View>
          <View>
            <Text style={styles.sessionTime}>
              {formatTime(item.startTime)}
              {item.endTime ? ` – ${formatTime(item.endTime)}` : ' – teraz'}
            </Text>
            {isDelegation && item.delegation?.destination ? (
              <Text style={styles.sessionMeta} numberOfLines={1}>
                {item.delegation.destination}
              </Text>
            ) : (
              <Text style={styles.sessionMeta}>
                {item.mode === 'auto' ? 'GPS auto' : 'Ręczny'}
                {item.commuteStartTime ? '  •  z dojazdem' : ''}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.sessionRight}>
          <Text style={styles.sessionDuration}>
            {formatShortDuration(getSessionDuration(item.startTime, item.endTime))}
          </Text>
          {!item.endTime && <Text style={styles.activeBadge}>AKTYWNA</Text>}
          {isDelegation && (
            <View style={styles.delBadge}>
              <Text style={styles.delBadgeText}>delegacja</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionTotal}>{formatShortDuration(section.totalMs)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['all', 'work', 'delegation'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Wszystkie' : f === 'work' ? 'Praca' : 'Delegacje'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={64} color={COLORS.muted} />
          <Text style={styles.emptyText}>Brak wpisów</Text>
          <Text style={styles.emptySubText}>Zacznij pracę lub dodaj delegację</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderSession}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddDelegation')}
      >
        <Ionicons name="airplane" size={22} color="#fff" />
        <Text style={styles.fabText}>Delegacja</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  filterRow: {
    flexDirection: 'row', padding: 12, gap: 8,
    backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: COLORS.bg, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  filterTextActive: { color: '#fff' },
  list: { padding: 12, gap: 4, paddingBottom: 80 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
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
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sessionIconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  sessionIconBoxDel: { backgroundColor: '#FFFBEB' },
  sessionTime: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  sessionMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2, maxWidth: 180 },
  sessionRight: { alignItems: 'flex-end', gap: 4 },
  sessionDuration: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  activeBadge: {
    fontSize: 10, fontWeight: '700', color: COLORS.success,
    backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  delBadge: {
    backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  delBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.warning },
  deleteBtn: { padding: 4 },
  fab: {
    position: 'absolute', bottom: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.warning, paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 28, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
