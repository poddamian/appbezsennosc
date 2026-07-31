import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useAuth } from '../lib/auth';
import { DEFAULT_EVENING_REMINDER, DEFAULT_MORNING_REMINDER, requestNotificationPermission, syncScheduledReminders } from '../lib/notifications';
import { supabase } from '../lib/supabase';
import { useUserSettings } from '../lib/userSettings';

export default function NotificationsIntroScreen() {
  const { session } = useAuth();
  const { refresh } = useUserSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function saveSettings(notificationsEnabled: boolean) {
    if (!session) return;
    setIsSubmitting(true);

    await supabase.from('user_settings').upsert(
      {
        user_id: session.user.id,
        notifications_enabled: notificationsEnabled,
        evening_reminder_hour: DEFAULT_EVENING_REMINDER.hour,
        evening_reminder_minute: DEFAULT_EVENING_REMINDER.minute,
        morning_reminder_hour: DEFAULT_MORNING_REMINDER.hour,
        morning_reminder_minute: DEFAULT_MORNING_REMINDER.minute,
      },
      { onConflict: 'user_id' }
    );

    if (notificationsEnabled) {
      await syncScheduledReminders(true, {
        eveningHour: DEFAULT_EVENING_REMINDER.hour,
        eveningMinute: DEFAULT_EVENING_REMINDER.minute,
        morningHour: DEFAULT_MORNING_REMINDER.hour,
        morningMinute: DEFAULT_MORNING_REMINDER.minute,
      });
    }

    await refresh();
    setIsSubmitting(false);
  }

  async function handleEnable() {
    setIsSubmitting(true);
    const granted = await requestNotificationPermission();
    setIsSubmitting(false);
    await saveSettings(granted);
  }

  return (
    <View className="flex-1 justify-center bg-indigo-50 px-6">
      <Text style={{ fontSize: 48 }} className="text-center">
        🌙
      </Text>
      <Text className="mt-6 text-center text-2xl font-bold text-indigo-950">Zostań przy dobrych nawykach</Text>
      <Text className="mt-3 text-center text-base leading-6 text-slate-600">
        Możemy przypominać Ci wieczorem o rutynie przed snem i rano zapytać, jak Ci się spało — żeby dziennik
        wypełniał się sam z siebie. Powiadomienia możesz w każdej chwili wyłączyć w Profilu.
      </Text>

      <Pressable
        onPress={handleEnable}
        disabled={isSubmitting}
        className="mt-8 items-center rounded-2xl bg-indigo-900 py-4 disabled:opacity-50">
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-base font-semibold text-white">Włącz powiadomienia</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => saveSettings(false)}
        disabled={isSubmitting}
        className="mt-4 items-center py-2 disabled:opacity-50">
        <Text className="text-sm text-slate-500">Nie teraz</Text>
      </Pressable>
    </View>
  );
}
