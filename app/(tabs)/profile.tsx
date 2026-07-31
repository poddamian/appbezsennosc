import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Card } from '../../components/Card';
import { TimeStepper } from '../../components/TimeStepper';
import { ToggleRow } from '../../components/ToggleRow';
import { useAuth } from '../../lib/auth';
import { formatPolishDate, type TimeValue } from '../../lib/journal';
import { requestNotificationPermission, syncScheduledReminders } from '../../lib/notifications';
import { usePremium } from '../../lib/premium';
import { supabase, type UserSettings } from '../../lib/supabase';
import { useUserSettings } from '../../lib/userSettings';

export default function ProfileScreen() {
  const { session } = useAuth();
  const { settings, isLoading, refresh } = useUserSettings();
  const { isPremium, trialEndsAt } = usePremium();
  const [permissionDenied, setPermissionDenied] = useState(false);

  async function updateSettings(patch: Partial<UserSettings>) {
    if (!session || !settings) return;
    const next = { ...settings, ...patch };

    await supabase
      .from('user_settings')
      .update(patch)
      .eq('user_id', session.user.id);

    await syncScheduledReminders(next.notifications_enabled, {
      eveningHour: next.evening_reminder_hour,
      eveningMinute: next.evening_reminder_minute,
      morningHour: next.morning_reminder_hour,
      morningMinute: next.morning_reminder_minute,
    });

    await refresh();
  }

  async function handleToggleNotifications(enabled: boolean) {
    setPermissionDenied(false);
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
    }
    await updateSettings({ notifications_enabled: enabled });
  }

  if (isLoading || !settings) {
    return (
      <View className="flex-1 items-center justify-center bg-indigo-50">
        <ActivityIndicator color="#6d28d9" />
      </View>
    );
  }

  const eveningTime: TimeValue = {
    hour: settings.evening_reminder_hour,
    minute: settings.evening_reminder_minute,
  };
  const morningTime: TimeValue = {
    hour: settings.morning_reminder_hour,
    minute: settings.morning_reminder_minute,
  };

  return (
    <ScrollView className="flex-1 bg-indigo-50" contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
      <View>
        <Text className="text-3xl font-bold text-indigo-950">Profil</Text>
        {session?.user.email ? <Text className="mt-1 text-sm text-slate-500">{session.user.email}</Text> : null}
      </View>

      <Card>
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-indigo-950">{isPremium ? '✨ Premium' : 'Premium'}</Text>
          {isPremium ? (
            <View className="rounded-full bg-emerald-100 px-3 py-1">
              <Text className="text-xs font-semibold text-emerald-700">Aktywne</Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-2 text-sm text-slate-500">
          {isPremium
            ? trialEndsAt
              ? `Okres próbny trwa do ${formatPolishDate(trialEndsAt)}.`
              : 'Masz dostęp do pełnej biblioteki audio i historii bez limitu.'
            : 'Odblokuj pełną bibliotekę audio, historię bez limitu i eksport do PDF.'}
        </Text>
        <Pressable
          onPress={() => router.push('/premium')}
          className="mt-4 items-center rounded-2xl bg-violet-100 py-3">
          <Text className="font-semibold text-violet-900">{isPremium ? 'Zarządzaj Premium' : 'Zobacz Premium'}</Text>
        </Pressable>
      </Card>

      <Card>
        <Text className="text-lg font-semibold text-indigo-950">Rutyna wieczorna</Text>
        <Text className="mt-2 text-sm text-slate-500">
          Zarządzaj pozycjami checklisty widocznej codziennie w Dzienniku.
        </Text>
        <Pressable
          onPress={() => router.push('/routine-settings')}
          className="mt-4 items-center rounded-2xl bg-violet-100 py-3">
          <Text className="font-semibold text-violet-900">Ustawienia rutyny</Text>
        </Pressable>
      </Card>

      <Card>
        <Text className="text-lg font-semibold text-indigo-950">Powiadomienia</Text>
        <View className="mt-4">
          <ToggleRow
            label="Codzienne przypomnienia"
            value={settings.notifications_enabled}
            onChange={handleToggleNotifications}
          />
        </View>
        {permissionDenied ? (
          <Text className="mt-3 text-sm text-red-600">
            Brak zgody na powiadomienia. Włącz je w ustawieniach systemowych telefonu.
          </Text>
        ) : null}

        {settings.notifications_enabled ? (
          <View className="mt-4 gap-3">
            <TimeStepper
              label="Przypomnienie wieczorne"
              value={eveningTime}
              defaultValue={eveningTime}
              allowClear={false}
              onChange={(value) =>
                value && updateSettings({ evening_reminder_hour: value.hour, evening_reminder_minute: value.minute })
              }
            />
            <TimeStepper
              label="Przypomnienie poranne"
              value={morningTime}
              defaultValue={morningTime}
              allowClear={false}
              onChange={(value) =>
                value && updateSettings({ morning_reminder_hour: value.hour, morning_reminder_minute: value.minute })
              }
            />
          </View>
        ) : null}
      </Card>

      <Pressable
        onPress={() => supabase.auth.signOut()}
        className="items-center rounded-2xl bg-slate-900 py-4">
        <Text className="text-base font-semibold text-white">Wyloguj się</Text>
      </Pressable>
    </ScrollView>
  );
}
