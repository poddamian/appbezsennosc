import { Pressable, ScrollView, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { formatPolishDate } from '../lib/journal';
import { FREE_TRIAL_DAYS, usePremium } from '../lib/premium';

type ComparisonRow = {
  label: string;
  free: string;
  premium: string;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'Dziennik snu', free: 'Pełny dostęp', premium: 'Pełny dostęp' },
  { label: 'Statystyki i wzorce', free: 'Pełny dostęp', premium: 'Pełny dostęp' },
  { label: 'Nagrania audio', free: '3 nagrania', premium: 'Pełna biblioteka' },
  { label: 'Historia danych', free: 'Ostatnie 14 dni', premium: 'Bez limitu' },
  { label: 'Eksport danych do PDF', free: '—', premium: 'Tak' },
];

export default function PremiumScreen() {
  const { isPremium, trialEndsAt, startFreeTrial } = usePremium();

  if (isPremium) {
    return (
      <ScrollView className="flex-1 bg-indigo-50" contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Card>
          <Text className="text-lg font-semibold text-indigo-950">✨ Premium aktywne</Text>
          <Text className="mt-2 text-sm text-slate-600">
            {trialEndsAt
              ? `Twój darmowy okres próbny trwa do ${formatPolishDate(trialEndsAt)}.`
              : 'Masz dostęp do wszystkich funkcji Premium.'}
          </Text>
        </Card>
        <Card>
          <Text className="text-sm text-slate-500">
            To na razie ustawienie lokalne do testów UI — prawdziwe zarządzanie subskrypcją (płatności,
            odnawianie, anulowanie) pojawi się po integracji z RevenueCat.
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-indigo-50" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View>
        <Text className="text-sm font-medium text-violet-500">Odblokuj więcej</Text>
        <Text className="mt-1 text-2xl font-bold text-indigo-950">SleepTrack Premium</Text>
      </View>

      <Card>
        <View className="flex-row border-b border-slate-100 pb-3">
          <Text className="flex-1 text-xs font-semibold uppercase text-slate-400">Funkcja</Text>
          <Text className="w-24 text-center text-xs font-semibold uppercase text-slate-400">Darmowe</Text>
          <Text className="w-24 text-center text-xs font-semibold uppercase text-violet-600">Premium</Text>
        </View>
        {COMPARISON_ROWS.map((row, index) => (
          <View
            key={row.label}
            className={`flex-row items-center py-3 ${
              index < COMPARISON_ROWS.length - 1 ? 'border-b border-slate-50' : ''
            }`}>
            <Text className="flex-1 pr-2 text-sm text-slate-800">{row.label}</Text>
            <Text className="w-24 text-center text-sm text-slate-500">{row.free}</Text>
            <Text className="w-24 text-center text-sm font-medium text-violet-700">{row.premium}</Text>
          </View>
        ))}
      </Card>

      <Pressable onPress={startFreeTrial} className="items-center rounded-2xl bg-indigo-900 py-4">
        <Text className="text-base font-semibold text-white">
          Wypróbuj za darmo przez {FREE_TRIAL_DAYS} dni
        </Text>
      </Pressable>
      <Text className="text-center text-xs text-slate-400">
        Po okresie próbnym subskrypcja płatna miesięcznie. Anuluj w dowolnym momencie.
      </Text>
    </ScrollView>
  );
}
