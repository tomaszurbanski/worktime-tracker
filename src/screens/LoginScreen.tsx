import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveSettings, getSettings } from '../utils/storage';

const C = {
  primary: '#2563EB', bg: '#F8FAFC', card: '#FFFFFF',
  text: '#1E293B', muted: '#64748B', border: '#E2E8F0',
};

interface Props {
  onDone: () => void;
}

export default function LoginScreen({ onDone }: Props) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Imię i nazwisko jest wymagane.');
      return;
    }
    const settings = await getSettings();
    await saveSettings({ ...settings, userFullName: name.trim(), companyName: company.trim() });
    onDone();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoBox}>
          <View style={styles.logoCircle}>
            <Ionicons name="timer" size={40} color={C.primary} />
          </View>
          <Text style={styles.appName}>WorkTime Tracker</Text>
          <Text style={styles.appSub}>Witaj! Uzupełnij swoje dane przed rozpoczęciem.</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Imię i nazwisko *</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={name}
            onChangeText={v => { setName(v); setError(''); }}
            placeholder="np. Jan Kowalski"
            placeholderTextColor={C.muted}
            autoCapitalize="words"
            returnKeyType="next"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Firma (opcjonalnie)</Text>
          <TextInput
            style={styles.input}
            value={company}
            onChangeText={setCompany}
            placeholder="np. Acme Sp. z o.o."
            placeholderTextColor={C.muted}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <Text style={styles.hint}>
            Twoje dane pojawią się w eksportowanych raportach PDF.
            Możesz je później zmienić w Ustawieniach.
          </Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.btnText}>Rozpocznij</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 20 },
  logoBox: { alignItems: 'center', gap: 10, marginBottom: 8 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  appName: { fontSize: 26, fontWeight: '800', color: C.text },
  appSub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.muted, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    padding: 13, fontSize: 15, color: C.text, backgroundColor: C.bg,
  },
  inputError: { borderColor: '#DC2626' },
  errorText: { fontSize: 12, color: '#DC2626', marginTop: 4 },
  hint: { fontSize: 12, color: C.muted, marginTop: 16, lineHeight: 18, textAlign: 'center' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.primary, padding: 16, borderRadius: 14,
    shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
