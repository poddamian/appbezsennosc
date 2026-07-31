import '../global.css';

import { Stack } from 'expo-router/stack';

import { AuthProvider, useAuth } from '../lib/auth';
import { configureNotificationHandler } from '../lib/notifications';
import { UserSettingsProvider, useUserSettings } from '../lib/userSettings';

configureNotificationHandler();

function RootNavigator() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const { settings, isLoading: areSettingsLoading } = useUserSettings();

  if (isAuthLoading || (session && areSettingsLoading)) {
    return null;
  }

  const needsNotificationsOnboarding = Boolean(session) && settings === null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={Boolean(session) && !needsNotificationsOnboarding}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="routine-settings"
          options={{ headerShown: true, title: 'Rutyna wieczorna', presentation: 'modal' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={needsNotificationsOnboarding}>
        <Stack.Screen name="notifications-intro" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <UserSettingsProvider>
        <RootNavigator />
      </UserSettingsProvider>
    </AuthProvider>
  );
}
