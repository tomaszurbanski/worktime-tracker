import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkSession, AppSettings } from '../types';

const SESSIONS_KEY = '@worktime_sessions';
const SETTINGS_KEY = '@worktime_settings';

const DEFAULT_SETTINGS: AppSettings = {
  mode: 'manual',
  commuteTracking: false,
  showAds: true,
};

export const getSessions = async (): Promise<WorkSession[]> => {
  const data = await AsyncStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSessions = async (sessions: WorkSession[]): Promise<void> => {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const addSession = async (session: WorkSession): Promise<void> => {
  const sessions = await getSessions();
  sessions.unshift(session);
  await saveSessions(sessions);
};

export const updateSession = async (id: string, updates: Partial<WorkSession>): Promise<void> => {
  const sessions = await getSessions();
  const idx = sessions.findIndex(s => s.id === id);
  if (idx !== -1) {
    sessions[idx] = { ...sessions[idx], ...updates };
    await saveSessions(sessions);
  }
};

export const deleteSession = async (id: string): Promise<void> => {
  const sessions = await getSessions();
  await saveSessions(sessions.filter(s => s.id !== id));
};

export const getSettings = async (): Promise<AppSettings> => {
  const data = await AsyncStorage.getItem(SETTINGS_KEY);
  return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
