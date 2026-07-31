import { addDays, getTodayDateString } from './journal';
import type { EveningFactors, SleepEntry } from './supabase';

const SLEEP_QUALITY_SCALE_MAX = 5;
export const MIN_NIGHTS_PER_GROUP = 5;
export const SIGNIFICANT_DIFFERENCE_POINTS = 0.5;
export const MIN_TOTAL_NIGHTS_FOR_PATTERNS = 7;
export const SCREEN_TIME_HIGH_THRESHOLD_MINUTES = 30;
export const HIGH_STRESS_THRESHOLD = 4;

/**
 * A "night" pairs one day's evening_factors with the sleep_entries row
 * logged the following morning: evening_factors.date is the evening
 * before bed, sleep_entries.date is the day the user wakes up and rates
 * that same night's sleep.
 */
export type NightRecord = {
  date: string;
  sleepQuality: number;
  timesWoken: number;
  caffeineAfter3pm: boolean;
  alcohol: boolean;
  screenTimeMinutes: number | null;
  stressLevel: number | null;
  exerciseToday: boolean;
};

export function buildNightPairs(
  sleepEntries: SleepEntry[],
  eveningFactors: EveningFactors[]
): NightRecord[] {
  const sleepByDate = new Map(sleepEntries.map((entry) => [entry.date, entry]));
  const nights: NightRecord[] = [];

  for (const evening of eveningFactors) {
    const sleep = sleepByDate.get(addDays(evening.date, 1));
    if (!sleep || sleep.sleep_quality === null) continue;

    nights.push({
      date: evening.date,
      sleepQuality: sleep.sleep_quality,
      timesWoken: sleep.times_woken,
      caffeineAfter3pm: evening.caffeine_after_3pm,
      alcohol: evening.alcohol,
      screenTimeMinutes: evening.screen_time_before_bed_minutes,
      stressLevel: evening.stress_level,
      exerciseToday: evening.exercise_today,
    });
  }

  return nights;
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export type FactorComparison = {
  withAverage: number | null;
  withoutAverage: number | null;
  withCount: number;
  withoutCount: number;
  /** withoutAverage - withAverage: positive means the factor is associated with worse sleep. */
  differencePoints: number | null;
  differencePercentOfScale: number | null;
  hasEnoughData: boolean;
  isSignificant: boolean;
};

export function compareGroups(withGroup: number[], withoutGroup: number[]): FactorComparison {
  const withAverage = average(withGroup);
  const withoutAverage = average(withoutGroup);
  const hasEnoughData = withGroup.length >= MIN_NIGHTS_PER_GROUP && withoutGroup.length >= MIN_NIGHTS_PER_GROUP;
  const differencePoints =
    withAverage !== null && withoutAverage !== null ? withoutAverage - withAverage : null;
  const differencePercentOfScale =
    differencePoints !== null ? (differencePoints / SLEEP_QUALITY_SCALE_MAX) * 100 : null;

  return {
    withAverage,
    withoutAverage,
    withCount: withGroup.length,
    withoutCount: withoutGroup.length,
    differencePoints,
    differencePercentOfScale,
    hasEnoughData,
    isSignificant:
      hasEnoughData && differencePoints !== null && Math.abs(differencePoints) > SIGNIFICANT_DIFFERENCE_POINTS,
  };
}

function partitionSleepQuality(
  nights: NightRecord[],
  predicate: (night: NightRecord) => boolean | null
): { withGroup: number[]; withoutGroup: number[] } {
  const withGroup: number[] = [];
  const withoutGroup: number[] = [];

  for (const night of nights) {
    const result = predicate(night);
    if (result === null) continue;
    (result ? withGroup : withoutGroup).push(night.sleepQuality);
  }

  return { withGroup, withoutGroup };
}

type FactorSpec = {
  key: string;
  conditionPhrase: string;
  predicate: (night: NightRecord) => boolean | null;
};

const FACTOR_SPECS: FactorSpec[] = [
  {
    key: 'caffeine_after_3pm',
    conditionPhrase: 'piłeś/aś kawę lub kofeinę po 15:00',
    predicate: (night) => night.caffeineAfter3pm,
  },
  {
    key: 'alcohol',
    conditionPhrase: 'piłeś/aś alkohol',
    predicate: (night) => night.alcohol,
  },
  {
    key: 'screen_time',
    conditionPhrase: `spędzałeś/aś ponad ${SCREEN_TIME_HIGH_THRESHOLD_MINUTES} min przed ekranem przed snem`,
    predicate: (night) =>
      night.screenTimeMinutes === null ? null : night.screenTimeMinutes > SCREEN_TIME_HIGH_THRESHOLD_MINUTES,
  },
  {
    key: 'stress',
    conditionPhrase: 'odczuwałeś/aś wysoki poziom stresu',
    predicate: (night) => (night.stressLevel === null ? null : night.stressLevel >= HIGH_STRESS_THRESHOLD),
  },
  {
    key: 'exercise',
    conditionPhrase: 'ćwiczyłeś/aś danego dnia',
    predicate: (night) => night.exerciseToday,
  },
];

export type FactorInsight = {
  key: string;
  message: string;
  comparison: FactorComparison;
};

function buildInsightMessage(conditionPhrase: string, comparison: FactorComparison): string | null {
  if (!comparison.isSignificant || comparison.withAverage === null || comparison.withoutAverage === null) {
    return null;
  }

  const isWorse = comparison.withAverage < comparison.withoutAverage;
  const direction = isWorse ? 'niższa' : 'wyższa';
  const percent = Math.round(Math.abs(comparison.differencePercentOfScale ?? 0));

  return (
    `W dni, gdy ${conditionPhrase}, Twoja jakość snu była średnio o ${percent}% ${direction} ` +
    `(${comparison.withAverage.toFixed(1)} vs ${comparison.withoutAverage.toFixed(1)} na 5).`
  );
}

export function analyzeFactors(nights: NightRecord[]): FactorInsight[] {
  const insights: FactorInsight[] = [];

  for (const spec of FACTOR_SPECS) {
    const { withGroup, withoutGroup } = partitionSleepQuality(nights, spec.predicate);
    const comparison = compareGroups(withGroup, withoutGroup);
    const message = buildInsightMessage(spec.conditionPhrase, comparison);
    if (message) {
      insights.push({ key: spec.key, message, comparison });
    }
  }

  return insights.sort(
    (a, b) => Math.abs(b.comparison.differencePoints ?? 0) - Math.abs(a.comparison.differencePoints ?? 0)
  );
}

export type PatternsResult =
  | { status: 'collecting'; nightsLogged: number; nightsNeeded: number }
  | { status: 'ready'; insights: FactorInsight[] };

export function computePatterns(nights: NightRecord[]): PatternsResult {
  if (nights.length < MIN_TOTAL_NIGHTS_FOR_PATTERNS) {
    return { status: 'collecting', nightsLogged: nights.length, nightsNeeded: MIN_TOTAL_NIGHTS_FOR_PATTERNS };
  }

  return { status: 'ready', insights: analyzeFactors(nights) };
}

export type ChartPoint = { date: string; label: string; value: number };

export function buildSleepQualityChartData(
  sleepEntries: SleepEntry[],
  referenceDate: Date = new Date(),
  days = 14
): ChartPoint[] {
  const todayStr = getTodayDateString(referenceDate);
  const byDate = new Map(sleepEntries.map((entry) => [entry.date, entry]));
  const points: ChartPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDays(todayStr, -offset);
    const entry = byDate.get(date);
    if (!entry || entry.sleep_quality === null) continue;
    const [, month, day] = date.split('-');
    points.push({ date, value: entry.sleep_quality, label: `${day}.${month}` });
  }

  return points;
}

const TREND_EPSILON = 0.05;

export type WeeklySummary = {
  averageSleepQuality: number | null;
  averageTimesWoken: number | null;
  previousAverageSleepQuality: number | null;
  daysLoggedThisWeek: number;
  daysLoggedPreviousWeek: number;
  trend: 'up' | 'down' | 'flat' | null;
};

export function computeWeeklySummary(
  sleepEntries: SleepEntry[],
  referenceDate: Date = new Date()
): WeeklySummary {
  const todayStr = getTodayDateString(referenceDate);
  const byDate = new Map(sleepEntries.map((entry) => [entry.date, entry]));

  const thisWeekQualities: number[] = [];
  const thisWeekWakes: number[] = [];
  const previousWeekQualities: number[] = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const entry = byDate.get(addDays(todayStr, -offset));
    if (!entry) continue;
    if (entry.sleep_quality !== null) thisWeekQualities.push(entry.sleep_quality);
    thisWeekWakes.push(entry.times_woken);
  }

  for (let offset = 7; offset < 14; offset += 1) {
    const entry = byDate.get(addDays(todayStr, -offset));
    if (entry?.sleep_quality !== null && entry?.sleep_quality !== undefined) {
      previousWeekQualities.push(entry.sleep_quality);
    }
  }

  const averageSleepQuality = average(thisWeekQualities);
  const previousAverageSleepQuality = average(previousWeekQualities);

  let trend: WeeklySummary['trend'] = null;
  if (averageSleepQuality !== null && previousAverageSleepQuality !== null) {
    const delta = averageSleepQuality - previousAverageSleepQuality;
    trend = delta > TREND_EPSILON ? 'up' : delta < -TREND_EPSILON ? 'down' : 'flat';
  }

  return {
    averageSleepQuality,
    averageTimesWoken: average(thisWeekWakes),
    previousAverageSleepQuality,
    daysLoggedThisWeek: thisWeekQualities.length,
    daysLoggedPreviousWeek: previousWeekQualities.length,
    trend,
  };
}
