import React, { useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, TextInput, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../hooks/useSettings';
import { useLocation } from '../hooks/useLocation';

const PRIVACY_URL = 'https://tomaszurbanski.github.io/worktime-tracker/privacy';

const COLORS = {
  primary: '#2563EB', bg: '#F8FAFC', card: '#FFFFFF',
  text: '#1E293B', muted: '#64748B', danger: '#DC2626',
  success: '#16A34A', border: '#E2E8F0',
};

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

const Row = ({ icon, title, subtitle, right, onPress }: RowProps) => (
  <TouchableOpacity
    style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}
  >
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
    </View>
    <View style={styles.rowContent}>
      <Text style={styles.rowTitle}>{title}</Text>
      {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
    </View>
    {right}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const { hasPermission, getCurrentLocation } = useLocation();
  const [savingLocation, setSavingLocation] = useState(false);
  const [name, setName] = useState(settings.userFullName ?? '');
  const [company, setCompany] = useState(settings.companyName ?? '');

  const toggleMode = () => {
    if (settings.mode === 'auto' && !hasPermission) {
      Alert.alert('Brak uprawnień', 'Aplikacja potrzebuje dostępu do lokalizacji.');
      return;
    }
    updateSettings({ mode: settings.mode === 'manual' ? 'auto' : 'manual' });
  };

  const saveCurrentLocation = async () => {
    setSavingLocation(true);
    const loc = await getCurrentLocation();
    setSavingLocation(false);
    if (!loc) {
      Alert.alert('Błąd', 'Nie można pobrać lokalizacji. Sprawdź uprawnienia.');
      return;
    }
    await updateSettings({
      workLocation: {
        ...loc,
        radius: 150,
        name: 'Praca',
      },
    });
    Alert.alert('Zapisano', 'Lokalizacja pracy została ustawiona na Twoje obecne położenie.');
  };

  const clearLocation = () => {
    Alert.alert('Usuń lokalizację', 'Czy na pewno chcesz usunąć lokalizację pracy?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => updateSettings({ workLocation: undefined }) },
    ]);
  };

  const saveProfile = () => {
    updateSettings({ userFullName: name.trim(), companyName: company.trim() });
    Alert.alert('Zapisano', 'Dane profilu zostały zaktualizowane.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>DANE UŻYTKOWNIKA</Text>
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Imię i nazwisko</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Jan Kowalski"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Firma</Text>
          <TextInput
            style={styles.textInput}
            value={company}
            onChangeText={setCompany}
            placeholder="Acme Sp. z o.o."
            placeholderTextColor={COLORS.muted}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
          <Ionicons name="save-outline" size={16} color={COLORS.primary} />
          <Text style={styles.saveBtnText}>Zapisz dane</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>TRYB ŚLEDZENIA</Text>
      <View style={styles.card}>
        <Row
          icon="hand-left"
          title="Tryb ręczny"
          subtitle="Sam klikasz Start i Stop"
          right={
            <Switch
              value={settings.mode === 'manual'}
              onValueChange={() => settings.mode !== 'manual' && toggleMode()}
              trackColor={{ true: COLORS.primary }}
            />
          }
        />
        <View style={styles.divider} />
        <Row
          icon="location"
          title="Tryb GPS (auto)"
          subtitle="Aplikacja wykrywa wejście/wyjście z pracy"
          right={
            <Switch
              value={settings.mode === 'auto'}
              onValueChange={() => settings.mode !== 'auto' && toggleMode()}
              trackColor={{ true: COLORS.primary }}
            />
          }
        />
      </View>

      <Text style={styles.sectionLabel}>LOKALIZACJA PRACY</Text>
      <View style={styles.card}>
        {settings.workLocation ? (
          <>
            <Row
              icon="checkmark-circle"
              title={settings.workLocation.name}
              subtitle={`${settings.workLocation.latitude.toFixed(5)}, ${settings.workLocation.longitude.toFixed(5)}  •  promień ${settings.workLocation.radius}m`}
            />
            <View style={styles.divider} />
            <Row
              icon="refresh"
              title="Ustaw bieżącą lokalizację"
              subtitle="Zapisze Twoje obecne położenie jako pracę"
              onPress={saveCurrentLocation}
              right={savingLocation ? <ActivityIndicator size="small" /> : <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />}
            />
            <View style={styles.divider} />
            <Row
              icon="trash"
              title="Usuń lokalizację"
              onPress={clearLocation}
              right={<Ionicons name="chevron-forward" size={16} color={COLORS.muted} />}
            />
          </>
        ) : (
          <Row
            icon="add-circle"
            title="Ustaw lokalizację pracy"
            subtitle="Przejdź do pracy i kliknij aby zapisać"
            onPress={saveCurrentLocation}
            right={
              savingLocation
                ? <ActivityIndicator size="small" />
                : <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            }
          />
        )}
      </View>

      <Text style={styles.sectionLabel}>OPCJE</Text>
      <View style={styles.card}>
        <Row
          icon="car"
          title="Śledzenie dojazdu"
          subtitle="Mierz czas dojazdu do pracy"
          right={
            <Switch
              value={settings.commuteTracking}
              onValueChange={v => updateSettings({ commuteTracking: v })}
              trackColor={{ true: COLORS.primary }}
            />
          }
        />
        <View style={styles.divider} />
        <Row
          icon="megaphone"
          title="Reklamy (darmowa wersja)"
          subtitle="Wyłącz aby przejść na wersję premium"
          right={
            <Switch
              value={settings.showAds}
              onValueChange={v => updateSettings({ showAds: v })}
              trackColor={{ true: COLORS.primary }}
            />
          }
        />
      </View>

      <Text style={styles.sectionLabel}>O APLIKACJI</Text>
      <View style={styles.card}>
        <Row
          icon="shield-checkmark"
          title="Polityka prywatności"
          subtitle="Jak chronimy Twoje dane"
          onPress={() => Linking.openURL(PRIVACY_URL)}
          right={<Ionicons name="open-outline" size={16} color={COLORS.muted} />}
        />
        <View style={styles.divider} />
        <Row
          icon="mail-outline"
          title="Kontakt"
          subtitle="turbanski824@gmail.com"
          onPress={() => Linking.openURL('mailto:turbanski824@gmail.com')}
          right={<Ionicons name="chevron-forward" size={16} color={COLORS.muted} />}
        />
      </View>

      <Text style={styles.version}>WorkTime Tracker v1.0.0</Text>
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
    backgroundColor: COLORS.card, borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 56 },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  rowSubtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.muted, marginTop: 16, marginBottom: 8 },
  inputGroup: { paddingHorizontal: 14, paddingVertical: 10 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  textInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 15, color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, marginHorizontal: 14, marginBottom: 6,
    borderRadius: 8, backgroundColor: '#EFF6FF',
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
