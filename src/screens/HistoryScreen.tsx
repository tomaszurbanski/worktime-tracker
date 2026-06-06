import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WorkSession } from '../types';
import { getSessions, deleteSession, updateSession } from '../utils/storage';
import { formatDateShort, formatTime, formatShortDuration, getSessionDuration } from '../utils/formatters';

const C = {
  primary: '#2563EB', bg: '#F8FAFC', card: '#FFFFFF',
  text: '#1E293B', muted: '#64748B', danger: '#DC2626',
  success: '#16A34A', border: '#E2E8F0',
  delegation: '#7C3AED', commute: '#0369A1',
};

type Filter = 'all' | 'work' | 'delegation';

interface GroupItem {
  type: 'session' | 'delegation-header';
  session: WorkSession;
  children?: WorkSession[];
}

interface DayGroup {
  dateKey: string;
  dateLabel: string;
  totalMs: number;
  items: GroupItem[];
}

const buildGroups = (sessions: WorkSession[], filter: Filter): DayGroup[] => {
  const filtered = filter === 'all' ? sessions
    : filter === 'work' ? sessions.filter(s => !s.delegationId && s.delegation?.isTrip !== true && s.type !== 'delegation')
    : sessions.filter(s => s.delegation?.isTrip || s.delegationId);

  const byDay: Record<string, WorkSession[]> = {};
  filtered.forEach(s => {
    const key = new Date(s.startTime).toLocaleDateString('pl-PL');
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(s);
  });

  return Object.entries(byDay)
    .sort(([a], [b]) => new Date(b.split('.').reverse().join('-')).getTime() - new Date(a.split('.').reverse().join('-')).getTime())
    .map(([key, daySessions]) => {
      const trips = daySessions.filter(s => s.delegation?.isTrip);
      const linkedWork = daySessions.filter(s => s.delegationId);
      const regularWork = daySessions.filter(s => !s.delegationId && !s.delegation?.isTrip);
      const items: GroupItem[] = [
        ...trips.map(trip => ({ type: 'delegation-header' as const, session: trip, children: linkedWork.filter(w => w.delegationId === trip.id) })),
        ...regularWork.map(s => ({ type: 'session' as const, session: s })),
      ];
      const totalMs = daySessions.reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0);
      return { dateKey: key, dateLabel: formatDateShort(daySessions[0].startTime), totalMs, items };
    });
};

const SessionCard = ({ session, inDelegation = false, onDelete, onClose, t }: {
  session: WorkSession; inDelegation?: boolean;
  onDelete: (id: string) => void; onClose: (id: string) => void;
  t: (k: string) => string;
}) => {
  const isActive = !session.endTime;
  const hasCommute = !!session.commuteStartTime;
  const iconName: keyof typeof Ionicons.glyphMap = hasCommute ? 'car' : session.mode === 'auto' ? 'location' : 'hand-left';
  const iconColor = hasCommute ? C.commute : C.primary;

  return (
    <View style={[styles.card, inDelegation && styles.cardIndented]}>
      <View style={[styles.iconBox, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={iconName} size={16} color={iconColor} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTime}>
            {formatTime(session.startTime)}
            {session.endTime ? ` – ${formatTime(session.endTime)}` : ` – ${t('common.now')}`}
          </Text>
          <Text style={styles.cardDuration}>{formatShortDuration(getSessionDuration(session.startTime, session.endTime))}</Text>
        </View>
        <View style={styles.badgeRow}>
          {inDelegation && <View style={styles.badge}><Text style={[styles.badgeText, { color: C.delegation }]}>{t('history.inDelegation')}</Text></View>}
          {hasCommute && <View style={[styles.badge, { borderColor: C.commute + '40' }]}><Text style={[styles.badgeText, { color: C.commute }]}>{t('history.withCommute')}</Text></View>}
          {session.mode === 'auto' && !inDelegation && <View style={[styles.badge, { borderColor: C.primary + '40' }]}><Text style={[styles.badgeText, { color: C.primary }]}>GPS</Text></View>}
          {isActive && <View style={[styles.badge, { borderColor: C.success + '40', backgroundColor: '#F0FDF4' }]}><Text style={[styles.badgeText, { color: C.success }]}>{t('common.active')}</Text></View>}
        </View>
      </View>
      <View style={styles.cardActions}>
        {isActive && <TouchableOpacity style={styles.closeBtn} onPress={() => onClose(session.id)}><Ionicons name="stop-circle" size={20} color={C.danger} /></TouchableOpacity>}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(session.id)}><Ionicons name="trash-outline" size={16} color={C.muted} /></TouchableOpacity>
      </View>
    </View>
  );
};

const DelegationHeader = ({ session, children, onDelete, onClose, t }: {
  session: WorkSession; children: WorkSession[];
  onDelete: (id: string) => void; onClose: (id: string) => void;
  t: (k: string) => string;
}) => {
  const isActive = !session.endTime;
  const totalWork = children.reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0);

  return (
    <View style={styles.delegationGroup}>
      <View style={styles.delegationHeaderCard}>
        <View style={[styles.iconBox, { backgroundColor: C.delegation + '18' }]}>
          <Ionicons name="airplane" size={16} color={C.delegation} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={[styles.cardTime, { color: C.delegation }]}>
              {formatTime(session.startTime)}{session.endTime ? ` – ${formatTime(session.endTime)}` : ` – ${t('common.now')}`}
            </Text>
            <Text style={[styles.cardDuration, { color: C.delegation }]}>{formatShortDuration(getSessionDuration(session.startTime, session.endTime))}</Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: C.delegation + '15', borderColor: C.delegation + '40' }]}>
              <Text style={[styles.badgeText, { color: C.delegation }]}>{t('history.delegation')}</Text>
            </View>
            {isActive && <View style={[styles.badge, { borderColor: C.success + '40', backgroundColor: '#F0FDF4' }]}><Text style={[styles.badgeText, { color: C.success }]}>{t('common.active')}</Text></View>}
            {children.length > 0 && <Text style={styles.workSummary}>{t('history.workLabel')} {formatShortDuration(totalWork)}</Text>}
          </View>
        </View>
        <View style={styles.cardActions}>
          {isActive && <TouchableOpacity style={styles.closeBtn} onPress={() => onClose(session.id)}><Ionicons name="stop-circle" size={20} color={C.danger} /></TouchableOpacity>}
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(session.id)}><Ionicons name="trash-outline" size={16} color={C.muted} /></TouchableOpacity>
        </View>
      </View>
      {children.map(child => (
        <SessionCard key={child.id} session={child} inDelegation onDelete={onDelete} onClose={onClose} t={t} />
      ))}
    </View>
  );
};

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    const all = await getSessions();
    setGroups(buildGroups(all, filter));
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (id: string) => {
    Alert.alert(t('history.deleteTitle'), t('history.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteSession(id); load(); } },
    ]);
  };

  const handleClose = async (id: string) => {
    await updateSession(id, { endTime: Date.now() });
    load();
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: t('history.all') },
    { key: 'work', label: t('history.work') },
    { key: 'delegation', label: t('history.delegations') },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key} style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {groups.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={56} color={C.muted} />
          <Text style={styles.emptyText}>{t('history.empty')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {groups.map(group => (
            <View key={group.dateKey}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{group.dateLabel}</Text>
                <Text style={styles.dayTotal}>{formatShortDuration(group.totalMs)}</Text>
              </View>
              {group.items.map(item =>
                item.type === 'delegation-header' ? (
                  <DelegationHeader key={item.session.id} session={item.session} children={item.children ?? []} onDelete={handleDelete} onClose={handleClose} t={t} />
                ) : (
                  <SessionCard key={item.session.id} session={item.session} onDelete={handleDelete} onClose={handleClose} t={t} />
                )
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  filterRow: { flexDirection: 'row', padding: 10, gap: 8, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: C.bg, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterText: { fontSize: 13, fontWeight: '500', color: C.text },
  filterTextActive: { color: '#fff' },
  list: { padding: 12, paddingBottom: 24 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 16, color: C.muted },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 2, marginTop: 8 },
  dayTitle: { fontSize: 13, fontWeight: '700', color: C.text, textTransform: 'capitalize' },
  dayTotal: { fontSize: 13, fontWeight: '700', color: C.primary },
  card: { backgroundColor: C.card, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardIndented: { marginLeft: 20, borderLeftWidth: 2, borderLeftColor: C.delegation + '40' },
  delegationGroup: { marginBottom: 6 },
  delegationHeaderCard: { backgroundColor: '#FAF5FF', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.delegation + '30', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, marginBottom: 4 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTime: { fontSize: 14, fontWeight: '600', color: C.text },
  cardDuration: { fontSize: 14, fontWeight: '700', color: C.text },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  badgeText: { fontSize: 10, fontWeight: '700' },
  workSummary: { fontSize: 11, color: C.muted, alignSelf: 'center' },
  cardActions: { flexDirection: 'row', gap: 4 },
  closeBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
});
