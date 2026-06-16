import React, { useMemo, useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, TextInput, Linking, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import { useLocation } from '../hooks/useLocation';
import { LANGUAGES, getLang } from '../i18n/langs';
import { saveLanguage } from '../i18n';
import i18n from '../i18n';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import {
  requestNotificationPermission,
  scheduleWorkReminder,
  cancelWorkReminder,
} from '../hooks/useNotifications';

const PRIVACY_URL = 'https://tuautomation.de/privacy-worktimer.html';

const makeStyles = (C: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1, paddingHorizontal: 4, marginTop: 8, marginBottom: 4 },
  card: { backgroundColor: C.card, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 56 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: C.text },
  rowSubtitle: { fontSize: 12, color: C.muted, marginTop: 2 },
  inputGroup: { paddingHorizontal: 14, paddingVertical: 10 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  textInput: { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15, color: C.text, backgroundColor: C.inputBg },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginHorizontal: 14, marginBottom: 6, borderRadius: 8, backgroundColor: C.primaryBg },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },
  themePicker: { flexDirection: 'row', padding: 10, gap: 8 },
  themeBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, gap: 4 },
  themeBtnActive: { backgroundColor: C.primaryBg, borderColor: C.primary },
  themeIcon: { fontSize: 20 },
  themeBtnLabel: { fontSize: 12, fontWeight: '600', color: C.muted },
  themeBtnLabelActive: { color: C.primary },
  version: { textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 16, marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32, maxHeight: '70%' },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 12 },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, gap: 12 },
  langRowActive: { backgroundColor: C.primaryBg },
  langFlag: { fontSize: 28 },
  langTexts: { flex: 1 },
  langNative: { fontSize: 16, fontWeight: '600', color: C.text },
  langName: { fontSize: 12, color: C.muted },
});

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

const Row = ({ icon, title, subtitle, right, onPress }: RowProps) => {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={C.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors: C, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { settings, updateSettings } = useSettings();
  const { hasPermission, getCurrentLocation } = useLocation();
  const [savingLocation, setSavingLocation] = useState(false);
  const [name, setName] = useState(settings.userFullName ?? '');
  const [company, setCompany] = useState(settings.companyName ?? '');
  const [langModal, setLangModal] = useState(false);
  const [reminderTime, setReminderTime] = useState(settings.workReminderTime ?? '08:00');
  const currentLang = getLang(i18n.language);

  const toggleMode = () => {
    if (settings.mode === 'auto' && !hasPermission) {
      Alert.alert(t('settings.noPermission'), t('settings.noPermissionDesc'));
      return;
    }
    updateSettings({ mode: settings.mode === 'manual' ? 'auto' : 'manual' });
  };

  const saveCurrentLocation = async () => {
    setSavingLocation(true);
    const loc = await getCurrentLocation();
    setSavingLocation(false);
    if (!loc) { Alert.alert(t('common.error'), t('settings.locationError')); return; }
    await updateSettings({ workLocation: { ...loc, radius: 150, name: t('settings.locationWork') } });
    Alert.alert(t('settings.saved'), t('settings.locationSaved'));
  };

  const clearLocation = () => {
    Alert.alert(t('settings.deleteLocationTitle'), t('settings.deleteLocationConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => updateSettings({ workLocation: undefined }) },
    ]);
  };

  const saveProfile = () => {
    updateSettings({ userFullName: name.trim(), companyName: company.trim() });
    Alert.alert(t('settings.saved'), t('settings.profileSaved'));
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const ok = await requestNotificationPermission();
      if (!ok) {
        Alert.alert(t('settings.noPermission'), t('notifications.noPermission'));
        return;
      }
    }
    await updateSettings({ notificationsEnabled: value });
    if (!value) await cancelWorkReminder();
  };

  const saveReminder = async () => {
    const ok = await requestNotificationPermission();
    if (!ok) { Alert.alert(t('settings.noPermission'), t('notifications.noPermission')); return; }
    if (!/^\d{1,2}:\d{2}$/.test(reminderTime)) {
      Alert.alert(t('common.error'), t('notifications.invalidTime'));
      return;
    }
    await updateSettings({ workReminderTime: reminderTime });
    await scheduleWorkReminder(reminderTime);
    Alert.alert(t('settings.saved'), t('notifications.reminderSaved', { time: reminderTime }));
  };

  const selectLanguage = async (code: string) => {
    setLangModal(false);
    const lang = getLang(code);
    if (lang.rtl) {
      Alert.alert('Arabic / عربية', t('settings.rtlRestart'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.ok'), onPress: () => saveLanguage(code) },
      ]);
    } else {
      await saveLanguage(code);
    }
  };

  const themeOptions: { m: ThemeMode; icon: string; label: string }[] = [
    { m: 'system', icon: '📱', label: t('settings.themeSystem') },
    { m: 'light', icon: '☀️', label: t('settings.themeLight') },
    { m: 'dark', icon: '🌙', label: t('settings.themeDark') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Profile */}
      <Text style={styles.sectionLabel}>{t('settings.profile')}</Text>
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('settings.fullName')}</Text>
          <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="Jan Kowalski" placeholderTextColor={C.muted} autoCapitalize="words" />
        </View>
        <View style={styles.divider} />
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('settings.company')}</Text>
          <TextInput style={styles.textInput} value={company} onChangeText={setCompany} placeholder="Acme Sp. z o.o." placeholderTextColor={C.muted} autoCapitalize="words" />
        </View>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
          <Ionicons name="save-outline" size={16} color={C.primary} />
          <Text style={styles.saveBtnText}>{t('settings.saveProfile')}</Text>
        </TouchableOpacity>
      </View>

      {/* Language */}
      <Text style={styles.sectionLabel}>{t('settings.language_section')}</Text>
      <View style={styles.card}>
        <Row
          icon="language"
          title={t('settings.language')}
          subtitle={`${currentLang.flag} ${currentLang.native}`}
          onPress={() => setLangModal(true)}
          right={<Ionicons name="chevron-forward" size={16} color={C.muted} />}
        />
      </View>

      {/* Theme */}
      <Text style={styles.sectionLabel}>{t('settings.theme_section')}</Text>
      <View style={styles.card}>
        <View style={styles.themePicker}>
          {themeOptions.map(opt => (
            <TouchableOpacity
              key={opt.m}
              style={[styles.themeBtn, mode === opt.m && styles.themeBtnActive]}
              onPress={() => setMode(opt.m)}
            >
              <Text style={styles.themeIcon}>{opt.icon}</Text>
              <Text style={[styles.themeBtnLabel, mode === opt.m && styles.themeBtnLabelActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tracking mode */}
      <Text style={styles.sectionLabel}>{t('settings.trackingMode')}</Text>
      <View style={styles.card}>
        <Row
          icon="hand-left"
          title={t('settings.manualMode')}
          subtitle={t('settings.manualModeDesc')}
          right={<Switch value={settings.mode === 'manual'} onValueChange={() => { if (settings.mode !== 'manual') toggleMode(); }} trackColor={{ true: C.primary }} />}
        />
        <View style={styles.divider} />
        <Row
          icon="location"
          title={t('settings.autoMode')}
          subtitle={t('settings.autoModeDesc')}
          right={<Switch value={settings.mode === 'auto'} onValueChange={() => { if (settings.mode !== 'auto') toggleMode(); }} trackColor={{ true: C.primary }} />}
        />
      </View>

      {/* Work location */}
      <Text style={styles.sectionLabel}>{t('settings.workLocation')}</Text>
      <View style={styles.card}>
        {settings.workLocation ? (
          <>
            <Row
              icon="checkmark-circle"
              title={settings.workLocation.name}
              subtitle={`${settings.workLocation.latitude.toFixed(5)}, ${settings.workLocation.longitude.toFixed(5)}  •  ${t('settings.radius')} ${settings.workLocation.radius}m`}
            />
            <View style={styles.divider} />
            <Row icon="refresh" title={t('settings.setCurrentLocation')} subtitle={t('settings.setCurrentLocationDesc')} onPress={saveCurrentLocation} right={savingLocation ? <ActivityIndicator size="small" /> : <Ionicons name="chevron-forward" size={16} color={C.muted} />} />
            <View style={styles.divider} />
            <Row icon="trash" title={t('settings.deleteLocation')} onPress={clearLocation} right={<Ionicons name="chevron-forward" size={16} color={C.muted} />} />
          </>
        ) : (
          <Row icon="add-circle" title={t('settings.addLocation')} subtitle={t('settings.addLocationDesc')} onPress={saveCurrentLocation} right={savingLocation ? <ActivityIndicator size="small" /> : <Ionicons name="chevron-forward" size={16} color={C.muted} />} />
        )}
      </View>

      {/* Options */}
      <Text style={styles.sectionLabel}>{t('settings.options')}</Text>
      <View style={styles.card}>
        <Row
          icon="car"
          title={t('settings.commuteTracking')}
          subtitle={t('settings.commuteTrackingDesc')}
          right={<Switch value={settings.commuteTracking} onValueChange={v => updateSettings({ commuteTracking: v })} trackColor={{ true: C.primary }} />}
        />
        <View style={styles.divider} />
        <Row
          icon="megaphone"
          title={t('settings.ads')}
          subtitle={t('settings.adsDesc')}
          right={<Switch value={settings.showAds} onValueChange={v => updateSettings({ showAds: v })} trackColor={{ true: C.primary }} />}
        />
      </View>

      {/* Notifications */}
      <Text style={styles.sectionLabel}>{t('notifications.section')}</Text>
      <View style={styles.card}>
        <Row
          icon="notifications"
          title={t('notifications.enable')}
          subtitle={t('notifications.enableDesc')}
          right={<Switch value={!!settings.notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ true: C.primary }} />}
        />
        {settings.notificationsEnabled && (
          <>
            <View style={styles.divider} />
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('notifications.reminderTime')}</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  placeholder="08:00"
                  placeholderTextColor={C.muted}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={[styles.saveBtn, { flex: 0, paddingHorizontal: 16 }]} onPress={saveReminder}>
                  <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>

      {/* About */}
      <Text style={styles.sectionLabel}>{t('settings.about')}</Text>
      <View style={styles.card}>
        <Row icon="shield-checkmark" title={t('settings.privacy')} subtitle={t('settings.privacyDesc')} onPress={() => Linking.openURL(PRIVACY_URL)} right={<Ionicons name="open-outline" size={16} color={C.muted} />} />
        <View style={styles.divider} />
        <Row icon="mail-outline" title={t('settings.contact')} subtitle="info@tuautomation.de" onPress={() => Linking.openURL('mailto:info@tuautomation.de')} right={<Ionicons name="chevron-forward" size={16} color={C.muted} />} />
      </View>

      <Text style={styles.version}>{t('settings.version')}</Text>

      {/* Language picker modal */}
      <Modal visible={langModal} transparent animationType="slide" onRequestClose={() => setLangModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('settings.language')}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={l => l.code}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.langRow, i18n.language === item.code && styles.langRowActive]} onPress={() => selectLanguage(item.code)}>
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <View style={styles.langTexts}>
                    <Text style={styles.langNative}>{item.native}</Text>
                    <Text style={styles.langName}>{item.name}</Text>
                  </View>
                  {i18n.language === item.code && <Ionicons name="checkmark-circle" size={20} color={C.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

    </ScrollView>
  );
}
