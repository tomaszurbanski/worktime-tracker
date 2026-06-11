import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../types';
import { getSettings, saveSettings } from '../utils/storage';

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>({
    mode: 'manual',
    commuteTracking: false,
    showAds: true,
    notificationsEnabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    await saveSettings(next);
  }, [settings]);

  return { settings, loading, updateSettings };
};
