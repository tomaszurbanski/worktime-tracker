import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { addSession } from '../utils/storage';
import { useLocation } from '../hooks/useLocation';
import { WorkSession } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const pad = (n: number) => String(n).padStart(2, '0');

const timeToDate = (base: Date, timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.getTime();
};

const makeStyles = (C: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 8, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    letterSpacing: 1, paddingHorizontal: 4, marginTop: 8, marginBottom: 4,
  },
  card: {
    backgroundColor: C.card, borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 46 },
  fieldWrap: { padding: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: C.muted, marginBottom: 6, marginLeft: 26 },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  fieldIcon: { marginRight: 8, width: 24, textAlign: 'center' },
  input: {
    flex: 1, fontSize: 15, color: C.text,
    paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  inputMulti: { height: 72, textAlignVertical: 'top' },
  timeRow: { flexDirection: 'row', gap: 0 },
  gpsBtn: {
    padding: 8, backgroundColor: C.primaryBg, borderRadius: 8, marginLeft: 8,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.primary, padding: 18, borderRadius: 16, marginTop: 12,
    shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
  C: Colors;
  styles: ReturnType<typeof makeStyles>;
}

const Field = ({ label, value, onChangeText, placeholder, icon, multiline, keyboardType, C, styles }: FieldProps) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldRow}>
      <Ionicons name={icon} size={18} color={C.primary} style={styles.fieldIcon as any} />
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
      />
    </View>
  </View>
);

export default function AddDelegationScreen() {
  const { t } = useTranslation();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const navigation = useNavigation();
  const { getCurrentLocation } = useLocation();

  const now = new Date();
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(now.toLocaleDateString('pl-PL'));
  const [startTime, setStartTime] = useState(`${pad(now.getHours())}:00`);
  const [endTime, setEndTime] = useState(`${pad(now.getHours() + 8 > 23 ? 17 : now.getHours() + 8)}:00`);
  const [loadingGPS, setLoadingGPS] = useState(false);

  const handleGetGPS = async () => {
    setLoadingGPS(true);
    const loc = await getCurrentLocation();
    setLoadingGPS(false);
    if (loc) {
      setLocation(`${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`);
    } else {
      Alert.alert('GPS', t('settings.locationError'));
    }
  };

  const handleSave = async () => {
    if (!destination.trim()) {
      Alert.alert(t('common.error'), t('delegation.destinationRequired'));
      return;
    }
    const [day, month, year] = date.split('.');
    const base = new Date(Number(year), Number(month) - 1, Number(day));
    if (isNaN(base.getTime())) {
      Alert.alert(t('common.error'), t('delegation.invalidDate'));
      return;
    }
    const start = timeToDate(base, startTime);
    const end = timeToDate(base, endTime);
    if (end <= start) {
      Alert.alert(t('common.error'), t('delegation.endBeforeStart'));
      return;
    }
    const session: WorkSession = {
      id: generateId(),
      startTime: start,
      endTime: end,
      mode: 'manual',
      type: 'delegation',
      delegation: {
        destination: destination.trim(),
        purpose: purpose.trim(),
        location: location.trim() || undefined,
        distance: distance ? Number(distance) : undefined,
      },
      note: note.trim() || undefined,
    };
    await addSession(session);
    Alert.alert(t('common.save'), t('delegation.saved'), [
      { text: t('common.ok'), onPress: () => navigation.goBack() },
    ]);
  };

  const fieldProps = { C, styles };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <Text style={styles.sectionLabel}>{t('delegation.basicData')}</Text>
        <View style={styles.card}>
          <Field {...fieldProps} icon="location" label={`${t('delegation.destination')} *`}
            value={destination} onChangeText={setDestination} placeholder="np. Warszawa, ul. Marszałkowska 1" />
          <View style={styles.divider} />
          <Field {...fieldProps} icon="briefcase" label={t('delegation.purpose')}
            value={purpose} onChangeText={setPurpose} placeholder="np. Spotkanie z klientem" />
        </View>

        <Text style={styles.sectionLabel}>{t('delegation.time')}</Text>
        <View style={styles.card}>
          <Field {...fieldProps} icon="calendar" label={t('delegation.date')}
            value={date} onChangeText={setDate} placeholder="01.01.2025" />
          <View style={styles.divider} />
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Field {...fieldProps} icon="time" label={t('delegation.startTime')}
                value={startTime} onChangeText={setStartTime} placeholder="08:00" />
            </View>
            <View style={{ flex: 1 }}>
              <Field {...fieldProps} icon="time-outline" label={t('delegation.endTime')}
                value={endTime} onChangeText={setEndTime} placeholder="16:00" />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('delegation.details')}</Text>
        <View style={styles.card}>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{t('delegation.location')}</Text>
            <View style={styles.fieldRow}>
              <Ionicons name="map" size={18} color={C.primary} style={styles.fieldIcon as any} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={location}
                onChangeText={setLocation}
                placeholder={t('delegation.locationPlaceholder')}
                placeholderTextColor={C.muted}
              />
              <TouchableOpacity style={styles.gpsBtn} onPress={handleGetGPS} disabled={loadingGPS}>
                <Ionicons name="locate" size={18} color={C.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />
          <Field {...fieldProps} icon="speedometer" label={t('delegation.distance')}
            value={distance} onChangeText={setDistance} placeholder="np. 150" keyboardType="numeric" />
          <View style={styles.divider} />
          <Field {...fieldProps} icon="create" label={t('delegation.note')}
            value={note} onChangeText={setNote} placeholder={t('delegation.notePlaceholder')} multiline />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.saveBtnText}>{t('delegation.save')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
