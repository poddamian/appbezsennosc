import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from './auth';

type OnboardingContextValue = {
  /** null while the flag is still being read from storage. */
  hasCompletedOnboarding: boolean | null;
  completeOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

function storageKey(userId: string) {
  return `sleeptrack:onboarding-completed:${userId}`;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId) {
      setHasCompletedOnboarding(null);
      return;
    }

    let cancelled = false;
    AsyncStorage.getItem(storageKey(userId)).then((value) => {
      if (!cancelled) setHasCompletedOnboarding(value === 'true');
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const completeOnboarding = useCallback(async () => {
    if (!userId) return;
    await AsyncStorage.setItem(storageKey(userId), 'true');
    setHasCompletedOnboarding(true);
  }, [userId]);

  const value = useMemo(
    () => ({ hasCompletedOnboarding, completeOnboarding }),
    [hasCompletedOnboarding, completeOnboarding]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
