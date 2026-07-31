import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from './auth';
import { getSupabaseErrorMessage } from './errors';
import { supabase, type UserSettings } from './supabase';

type UserSettingsContextValue = {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSettings(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error: fetchError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      // Keep whatever settings we already had (if any) rather than treating a
      // transient failure as "this user has no row yet" - the root layout
      // relies on `settings === null` to mean the latter.
      setError(getSupabaseErrorMessage(fetchError));
    } else {
      setError(null);
      setSettings(data ?? null);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ settings, isLoading, error, refresh }),
    [settings, isLoading, error, refresh]
  );

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}
