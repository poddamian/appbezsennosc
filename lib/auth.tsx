import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './supabase';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ session, isLoading }), [session, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const AUTH_ERROR_MESSAGES: Partial<Record<string, string>> = {
  invalid_credentials: 'Nieprawidłowy email lub hasło.',
  email_not_confirmed: 'Potwierdź adres email, klikając link wysłany na Twoją skrzynkę.',
  user_already_exists: 'Konto z tym adresem email już istnieje. Zaloguj się.',
  email_exists: 'Konto z tym adresem email już istnieje. Zaloguj się.',
  weak_password: 'Hasło jest zbyt słabe. Użyj co najmniej 6 znaków.',
  email_address_invalid: 'Podaj poprawny adres email.',
  over_email_send_rate_limit: 'Zbyt wiele prób. Spróbuj ponownie za chwilę.',
  over_request_rate_limit: 'Zbyt wiele prób. Spróbuj ponownie za chwilę.',
  same_password: 'Nowe hasło musi różnić się od obecnego.',
  user_not_found: 'Nie znaleziono konta z tym adresem email.',
};

export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
    if (code && AUTH_ERROR_MESSAGES[code]) {
      return AUTH_ERROR_MESSAGES[code]!;
    }
  }

  return 'Coś poszło nie tak. Spróbuj ponownie.';
}
