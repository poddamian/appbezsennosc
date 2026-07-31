import '../global.css';

import { Stack } from 'expo-router/stack';

import { ErrorState } from '../components/ErrorState';
import { AuthProvider, useAuth } from '../lib/auth';
import { configureNotificationHandler } from '../lib/notifications';
import { OnboardingProvider, useOnboarding } from '../lib/onboarding';
import { PremiumProvider } from '../lib/premium';
import { UserSettingsProvider, useUserSettings } from '../lib/userSettings';

configureNotificationHandler();

function RootNavigator() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const { settings, isLoading: areSettingsLoading, error: settingsError, refresh: refreshSettings } =
    useUserSettings();
  const { hasCompletedOnboarding } = useOnboarding();

  const isWaitingOnSessionData =
    Boolean(session) && (areSettingsLoading || hasCompletedOnboarding === null);

  if (isAuthLoading || isWaitingOnSessionData) {
    return null;
  }

  // A failed first fetch (no row loaded yet) must not be mistaken for "no
  // row exists" - that would silently misroute a returning user into the
  // notifications onboarding screen every time their connection blips.
  if (session && settings === null && settingsError) {
    return <ErrorState message={settingsError} onRetry={refreshSettings} />;
  }

  const needsOnboarding = Boolean(session) && hasCompletedOnboarding === false;
  const needsNotificationsOnboarding = Boolean(session) && !needsOnboarding && settings === null;
  const canEnterApp = Boolean(session) && !needsOnboarding && !needsNotificationsOnboarding;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={canEnterApp}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="routine-settings"
          options={{ headerShown: true, title: 'Rutyna wieczorna', presentation: 'modal' }}
        />
        <Stack.Screen
          name="premium"
          options={{ headerShown: true, title: 'Premium', presentation: 'modal' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={needsOnboarding}>
        <Stack.Screen name="onboarding" />
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
        <OnboardingProvider>
          <PremiumProvider>
            <RootNavigator />
          </PremiumProvider>
        </OnboardingProvider>
      </UserSettingsProvider>
    </AuthProvider>
  );
}
