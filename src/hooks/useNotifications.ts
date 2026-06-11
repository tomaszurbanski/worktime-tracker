import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { formatShortDuration } from '../utils/formatters';
import i18n from '../i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const WORK_REMINDER_ID = 'work-daily-reminder';

export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleWorkReminder = async (timeStr: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(WORK_REMINDER_ID).catch(() => {});
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return;

  await Notifications.scheduleNotificationAsync({
    identifier: WORK_REMINDER_ID,
    content: {
      title: i18n.t('notifications.reminderTitle'),
      body: i18n.t('notifications.reminderBody'),
    },
    trigger: {
      hour: h,
      minute: m,
      repeats: true,
    } as any,
  });
};

export const cancelWorkReminder = async (): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(WORK_REMINDER_ID).catch(() => {});
};

export const useNotifications = (enabled: boolean) => {
  const permissionGranted = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    requestNotificationPermission().then(ok => {
      permissionGranted.current = ok;
    });
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('worktime', {
        name: 'WorkTime Tracker',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  }, [enabled]);

  const notifyWorkStarted = useCallback(async () => {
    if (!enabled || !permissionGranted.current) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.startedTitle'),
        body: i18n.t('notifications.startedBody'),
        data: { type: 'work_started' },
      },
      trigger: null,
    });
  }, [enabled]);

  const notifyWorkStopped = useCallback(async (durationMs: number) => {
    if (!enabled || !permissionGranted.current) return;
    const dur = formatShortDuration(durationMs);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.stoppedTitle'),
        body: i18n.t('notifications.stoppedBody', { duration: dur }),
        data: { type: 'work_stopped' },
      },
      trigger: null,
    });
  }, [enabled]);

  return { notifyWorkStarted, notifyWorkStopped };
};
