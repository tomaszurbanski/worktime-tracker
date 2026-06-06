import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { addSession } from '../utils/storage';
import { useLocation } from '../hooks/useLocation';
import { WorkSession } from '../types';

const COLORS = {
  primary: '#2563EB', bg: '#F8FAFC', card: '#FFFFFF',
  text: '#1E293B', muted: '#64748B', success: '#16A34A',
  border: '#E2E8F0', danger: '#DC2626',
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const pad = (n: number) => String(n).padStart(2, '0');

const timeToDate = (base: Date, timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.getTime();
};

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}

const Field = ({ label, value, onChangeText, placeholder, icon, multiline, keyboardType }: FieldProps) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldRow}>
      <Ionicons name={icon} size={18} color={COLORS.primary} style={styles.fieldIcon} />
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
      />
    </View>
  </View>
);

export default function AddDelegationScreen() {
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
      Alert.alert('GPS', 'Nie można pobrać lokalizacji. Wpisz ręcznie.');
    }
  };

  const handleSave = async () => {
    if (!destination.trim()) {
      Alert.alert('Błąd', 'Podaj cel delegacji.');
      return;
    }

    const [day, month, year] = date.split('.');
    const base = new Date(Number(year), Number(month) - 1, Number(day));

    if (isNaN(base.getTime())) {
      Alert.alert('Błąd', 'Nieprawidłowy format daty (DD.MM.YYYY).');
      return;
    }

    const start = timeToDate(base, startTime);
    const end = timeToDate(base, endTime);

    if (end <= start) {
      Alert.alert('Błąd', 'Czas końca musi być późniejszy niż czas startu.');
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
    Alert.alert('Zapisano', 'Delegacja została dodana.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>PODSTAWOWE DANE</Text>
        <View style={styles.card}>
          <Field icon="location" label="Cel delegacji *" value={destination}
            onChangeText={setDestination} placeholder="np. Warszawa, ul. Marszałkowska 1" />
          <View style={styles.divider} />
          <Field icon="briefcase" label="Cel / zadanie" value={purpose}
            onChangeText={setPurpose} placeholder="np. Spotkanie z klientem" />
        </View>

        <Text style={styles.sectionLabel}>CZAS</Text>
        <View style={styles.card}>
          <Field icon="calendar" label="Data (DD.MM.YYYY)" value={date}
            onChangeText={setDate} placeholder="01.01.2025" />
          <View style={styles.divider} />
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Field icon="time" label="Godzina startu" value={startTime}
                onChangeText={setStartTime} placeholder="08:00" />
            </View>
            <View style={{ flex: 1 }}>
              <Field icon="time-outline" label="Godzina końca" value={endTime}
                onChangeText={setEndTime} placeholder="16:00" />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>SZCZEGÓŁY</Text>
        <View style={styles.card}>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Lokalizacja</Text>
            <View style={styles.fieldRow}>
              <Ionicons name="map" size={18} color={COLORS.primary} style={styles.fieldIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={location}
                onChangeText={setLocation}
                placeholder="Adres lub współrzędne GPS"
                placeholderTextColor={COLORS.muted}
              />
              <TouchableOpacity style={styles.gpsBtn} onPress={handleGetGPS} disabled={loadingGPS}>
                <Ionicons name="locate" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />
          <Field icon="speedometer" label="Dystans (km)" value={distance}
            onChangeText={setDistance} placeholder="np. 150" keyboardType="numeric" />
          <View style={styles.divider} />
          <Field icon="create" label="Notatka" value={note}
            onChangeText={setNote} placeholder="Dodatkowe informacje..." multiline />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.saveBtnText}>ZAPISZ DELEGACJĘ</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, gap: 8, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.muted,
    letterSpacing: 1, paddingHorizontal: 4, marginTop: 8, marginBottom: 4,
  },
  card: {
    backgroundColor: COLORS.card, borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 46 },
  fieldWrap: { padding: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: COLORS.muted, marginBottom: 6, marginLeft: 26 },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  fieldIcon: { marginRight: 8, width: 24, textAlign: 'center' },
  input: {
    flex: 1, fontSize: 15, color: COLORS.text,
    paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  inputMulti: { height: 72, textAlignVertical: 'top' },
  timeRow: { flexDirection: 'row', gap: 0 },
  gpsBtn: {
    padding: 8, backgroundColor: '#EFF6FF', borderRadius: 8, marginLeft: 8,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, marginTop: 12,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});
