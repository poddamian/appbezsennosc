import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export const FREE_TRIAL_DAYS = 7;
export const FREE_HISTORY_DAYS = 14;

type PremiumContextValue = {
  isPremium: boolean;
  trialEndsAt: Date | null;
  startFreeTrial: () => void;
};

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

/**
 * Placeholder entitlement state: in-memory only, no persistence and no
 * real store/subscription behind it yet. Real IAP entitlement (RevenueCat)
 * replaces this provider's internals later without changing the
 * `usePremium()` call sites throughout the app.
 */
export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);

  function startFreeTrial() {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + FREE_TRIAL_DAYS);
    setTrialEndsAt(endsAt);
    setIsPremium(true);
  }

  const value = useMemo(() => ({ isPremium, trialEndsAt, startFreeTrial }), [isPremium, trialEndsAt]);

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
