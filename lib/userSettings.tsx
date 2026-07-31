import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from './auth';
import { supabase, type UserSettings } from './supabase';

type UserSettingsContextValue = {
  settings: UserSettings | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
    setSettings(data ?? null);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ settings, isLoading, refresh }), [settings, isLoading, refresh]);

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}
