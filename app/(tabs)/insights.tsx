import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ProgressBar } from '../../components/ProgressBar';
import { useAuth } from '../../lib/auth';
import { getSupabaseErrorMessage } from '../../lib/errors';
import {
  buildNightPairs,
  buildSleepQualityChartData,
  computePatterns,
  computeWeeklySummary,
  type FactorInsight,
} from '../../lib/insights';
import { addDays, getTodayDateString } from '../../lib/journal';
import { FREE_HISTORY_DAYS, usePremium } from '../../lib/premium';
import { supabase, type EveningFactors, type SleepEntry } from '../../lib/supabase';

const HISTORY_ROW_LIMIT = 400;

export default function InsightsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { width } = useWindowDimensions();
  const { isPremium } = usePremium();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [eveningFactors, setEveningFactors] = useState<EveningFactors[]>([]);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setLoadError(null);

    // Free tier only ever sees the last FREE_HISTORY_DAYS days of history —
    // capping the fetch itself (not just the display) so pattern detection
    // for free users also only draws on that window.
    const earliestDate = isPremium
      ? null
      : addDays(getTodayDateString(), -(FREE_HISTORY_DAYS - 1));

    let sleepQuery = supabase
      .from('sleep_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .limit(HISTORY_ROW_LIMIT);
    let eveningQuery = supabase
      .from('evening_factors')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .limit(HISTORY_ROW_LIMIT);

    if (earliestDate) {
      sleepQuery = sleepQuery.gte('date', earliestDate);
      eveningQuery = eveningQuery.gte('date', earliestDate);
    }

    const [sleepResult, eveningResult] = await Promise.all([sleepQuery, eveningQuery]);

    if (sleepResult.error || eveningResult.error) {
      setLoadError(getSupabaseErrorMessage(sleepResult.error ?? eveningResult.error));
      setIsLoading(false);
      return;
    }

    setSleepEntries(sleepResult.data ?? []);
    setEveningFactors(eveningResult.data ?? []);
    setIsLoading(false);
  }, [userId, isPremium]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={loadHistory} />;
  }

  if (sleepEntries.length === 0) {
    return (
      <View className="flex-1 bg-indigo-50 px-5">
        <View className="flex-1 items-center justify-center">
          <EmptyState
            emoji="📊"
            title="Brak jeszcze wpisów — zacznij dzisiaj!"
            description="Statystyki i wzorce pojawią się tutaj, gdy uzupełnisz pierwsze wpisy w Dzienniku."
            actionLabel="Przejdź do Dziennika"
            onAction={() => router.push('/')}
          />
        </View>
      </View>
    );
  }

  const chartData = buildSleepQualityChartData(sleepEntries);
  const nights = buildNightPairs(sleepEntries, eveningFactors);
  const patterns = computePatterns(nights);
  const weekly = computeWeeklySummary(sleepEntries);

  const chartWidth = Math.max(width - 40 - 32, 200);

  return (
    <ScrollView
      className="flex-1 bg-indigo-50"
      contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
      <View>
        <Text className="text-sm font-medium text-violet-500">Twoje dane</Text>
        <Text className="mt-1 text-3xl font-bold text-indigo-950">Statystyki</Text>
      </View>

      {!isPremium ? (
        <Card>
          <Text className="text-base font-semibold text-indigo-950">🔓 Odblokuj pełną historię</Text>
          <Text className="mt-1 text-sm text-slate-500">
            Darmowa wersja pokazuje ostatnie {FREE_HISTORY_DAYS} dni. Premium odblokowuje historię bez limitu.
          </Text>
          <Pressable
            onPress={() => router.push('/premium')}
            accessibilityRole="button"
            accessibilityLabel="Zobacz Premium"
            className="mt-3 items-center rounded-2xl bg-violet-100 py-2.5">
            <Text className="font-semibold text-violet-900">Zobacz Premium</Text>
          </Pressable>
        </Card>
      ) : null}

      <Card>
        <Text className="text-lg font-semibold text-indigo-950">Podsumowanie tygodnia</Text>
        <View className="mt-4 flex-row items-center justify-between">
          <SummaryStat
            label="Śr. jakość snu"
            value={weekly.averageSleepQuality !== null ? weekly.averageSleepQuality.toFixed(1) : '–'}
          />
          <SummaryStat
            label="Śr. wybudzenia"
            value={weekly.averageTimesWoken !== null ? weekly.averageTimesWoken.toFixed(1) : '–'}
          />
          <TrendStat trend={weekly.trend} />
        </View>
        <Text className="mt-4 text-xs text-slate-400">
          Na podstawie {weekly.daysLoggedThisWeek}/7 dni z tego tygodnia
        </Text>
      </Card>

      <Card>
        <Text className="text-lg font-semibold text-indigo-950">Jakość snu — ostatnie 14 dni</Text>
        {chartData.length > 0 ? (
          <View
            className="mt-4 items-center"
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Wykres jakości snu z ostatnich 14 dni, ${chartData.length} zarejestrowanych nocy`}>
            <LineChart
              data={chartData.map((point) => ({ value: point.value, label: point.label }))}
              width={chartWidth}
              height={180}
              initialSpacing={12}
              endSpacing={12}
              spacing={Math.max(chartWidth / Math.max(chartData.length, 1) - 8, 18)}
              thickness={3}
              color="#6d28d9"
              dataPointsColor="#6d28d9"
              curved
              maxValue={5}
              noOfSections={4}
              yAxisTextStyle={{ color: '#94a3b8', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#94a3b8', fontSize: 9 }}
              xAxisColor="#ddd6fe"
              yAxisColor="#ddd6fe"
              rulesColor="#ede9fe"
              rulesType="dashed"
            />
          </View>
        ) : (
          <Text className="mt-4 text-center text-slate-500">
            Brak danych z ostatnich 14 dni. Uzupełniaj Dziennik, żeby zobaczyć wykres.
          </Text>
        )}
      </Card>

      <Card>
        <Text className="text-lg font-semibold text-indigo-950">Odkryte wzorce</Text>
        {patterns.status === 'collecting' ? (
          <View className="mt-4">
            <Text className="text-slate-600">
              Zbieramy dane — wróć za kilka dni, żeby zobaczyć swoje wzorce.
            </Text>
            <View className="mt-3">
              <ProgressBar progress={patterns.nightsLogged / patterns.nightsNeeded} />
              <Text className="mt-2 text-xs text-slate-400">
                {patterns.nightsLogged}/{patterns.nightsNeeded} dni
              </Text>
            </View>
          </View>
        ) : patterns.insights.length > 0 ? (
          <View className="mt-4 gap-3">
            {patterns.insights.map((insight) => (
              <InsightRow key={insight.key} insight={insight} />
            ))}
          </View>
        ) : (
          <Text className="mt-4 text-slate-500">
            Nie wykryliśmy jeszcze wyraźnych wzorców. Zbieraj dane dalej, a wrócimy z nową analizą.
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center" accessible accessibilityLabel={`${label}: ${value}`}>
      <Text className="text-2xl font-bold text-indigo-950">{value}</Text>
      <Text className="mt-1 text-xs text-slate-500">{label}</Text>
    </View>
  );
}

const TREND_LABELS: Record<'up' | 'down' | 'flat', string> = {
  up: 'rosnąca',
  down: 'malejąca',
  flat: 'stabilna',
};

function TrendStat({ trend }: { trend: 'up' | 'down' | 'flat' | null }) {
  const arrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '▬';
  const color = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-400';

  return (
    <View
      className="items-center"
      accessible
      accessibilityLabel={`Trend vs poprzedni tydzień: ${trend ? TREND_LABELS[trend] : 'brak danych'}`}>
      <Text className={`text-2xl font-bold ${color}`}>{trend ? arrow : '–'}</Text>
      <Text className="mt-1 text-xs text-slate-500">vs poprz. tydzień</Text>
    </View>
  );
}

function InsightRow({ insight }: { insight: FactorInsight }) {
  const isWorse =
    insight.comparison.withAverage !== null &&
    insight.comparison.withoutAverage !== null &&
    insight.comparison.withAverage < insight.comparison.withoutAverage;

  return (
    <View className={`rounded-2xl border px-4 py-3 ${isWorse ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
      <Text className={`text-sm leading-5 ${isWorse ? 'text-rose-900' : 'text-emerald-900'}`}>
        {isWorse ? '⚠️ ' : '✨ '}
        {insight.message}
      </Text>
    </View>
  );
}
