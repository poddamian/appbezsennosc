import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const EVENING_REMINDER_ID = 'evening-reminder';
export const MORNING_REMINDER_ID = 'morning-reminder';
const ANDROID_CHANNEL_ID = 'reminders';

export const DEFAULT_EVENING_REMINDER = { hour: 21, minute: 0 };
export const DEFAULT_MORNING_REMINDER = { hour: 9, minute: 0 };

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Przypomnienia',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function getNotificationPermissionGranted(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function scheduleDailyReminder(identifier: string, hour: number, minute: number, title: string, body: string) {
  await ensureAndroidChannel();
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

export async function cancelDailyReminders() {
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(EVENING_REMINDER_ID).catch(() => undefined),
    Notifications.cancelScheduledNotificationAsync(MORNING_REMINDER_ID).catch(() => undefined),
  ]);
}

export type ReminderSchedule = {
  eveningHour: number;
  eveningMinute: number;
  morningHour: number;
  morningMinute: number;
};

export async function syncScheduledReminders(enabled: boolean, schedule: ReminderSchedule) {
  if (!enabled) {
    await cancelDailyReminders();
    return;
  }

  const granted = await getNotificationPermissionGranted();
  if (!granted) {
    await cancelDailyReminders();
    return;
  }

  await Promise.all([
    scheduleDailyReminder(
      EVENING_REMINDER_ID,
      schedule.eveningHour,
      schedule.eveningMinute,
      'Czas na rutynę wieczorną 🌙',
      'Sprawdź swoją checklistę i przygotuj się do snu.'
    ),
    scheduleDailyReminder(
      MORNING_REMINDER_ID,
      schedule.morningHour,
      schedule.morningMinute,
      'Jak spałeś/aś?',
      'Zapisz dzisiejszy sen w Dzienniku.'
    ),
  ]);
}
