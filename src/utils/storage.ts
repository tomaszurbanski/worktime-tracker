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
  const sessions: WorkSession[] = data ? JSON.parse(data) : [];
  return sessions.map(s => ({ ...s, type: s.type ?? ('work' as const) }));
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

export const getSessionsByMonth = async (year: number, month: number): Promise<WorkSession[]> => {
  const sessions = await getSessions();
  return sessions.filter(s => {
    const d = new Date(s.startTime);
    return d.getFullYear() === year && d.getMonth() === month;
  });
};

export const getSessionsByWeek = async (weekStart: Date): Promise<WorkSession[]> => {
  const start = weekStart.getTime();
  const end = start + 7 * 24 * 60 * 60 * 1000;
  const sessions = await getSessions();
  return sessions.filter(s => s.startTime >= start && s.startTime < end);
};
