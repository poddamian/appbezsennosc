import Slider from '@react-native-community/slider';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Card } from '../../components/Card';
import { EmojiScale, type EmojiOption } from '../../components/EmojiScale';
import { ErrorState } from '../../components/ErrorState';
import { InlineError } from '../../components/InlineError';
import { LoadingScreen } from '../../components/LoadingScreen';
import { RoutineChecklist } from '../../components/RoutineChecklist';
import { Stepper } from '../../components/Stepper';
import { TimeStepper } from '../../components/TimeStepper';
import { ToggleRow } from '../../components/ToggleRow';
import { useAuth } from '../../lib/auth';
import { getSupabaseErrorMessage } from '../../lib/errors';
import {
  dbTimeToTimeValue,
  formatPolishDate,
  getTodayDateString,
  timeValueToDbTime,
  type TimeValue,
} from '../../lib/journal';
import { supabase, type EveningFactors, type SleepEntry } from '../../lib/supabase';

const SLEEP_QUALITY_OPTIONS: EmojiOption[] = [
  { value: 1, emoji: '😩', label: 'Bardzo źle' },
  { value: 2, emoji: '😪', label: 'Źle' },
  { value: 3, emoji: '😐', label: 'Średnio' },
  { value: 4, emoji: '🙂', label: 'Dobrze' },
  { value: 5, emoji: '😄', label: 'Świetnie' },
];

const STRESS_OPTIONS: EmojiOption[] = [
  { value: 1, emoji: '😌', label: 'Spokojnie' },
  { value: 2, emoji: '🙂', label: 'Lekko' },
  { value: 3, emoji: '😐', label: 'Średnio' },
  { value: 4, emoji: '😟', label: 'Mocno' },
  { value: 5, emoji: '😫', label: 'Bardzo' },
];

const DEFAULT_BEDTIME: TimeValue = { hour: 22, minute: 30 };
const DEFAULT_WAKE_TIME: TimeValue = { hour: 7, minute: 0 };
const EVENING_SECTION_START_HOUR = 18;

function emojiFor(options: EmojiOption[], value: number | null | undefined) {
  return options.find((option) => option.value === value)?.emoji ?? '–';
}

export default function JournalScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sleepEntry, setSleepEntry] = useState<SleepEntry | null>(null);
  const [eveningFactors, setEveningFactors] = useState<EveningFactors | null>(null);

  const [editingMorning, setEditingMorning] = useState(false);
  const [editingEvening, setEditingEvening] = useState(false);

  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [timesWoken, setTimesWoken] = useState(0);
  const [bedtime, setBedtime] = useState<TimeValue | null>(null);
  const [wakeTime, setWakeTime] = useState<TimeValue | null>(null);
  const [morningError, setMorningError] = useState<string | null>(null);
  const [isSavingMorning, setIsSavingMorning] = useState(false);

  const [caffeineAfter3pm, setCaffeineAfter3pm] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [screenTime, setScreenTime] = useState(30);
  const [stressLevel, setStressLevel] = useState<number | null>(3);
  const [exerciseToday, setExerciseToday] = useState(false);
  const [eveningError, setEveningError] = useState<string | null>(null);
  const [isSavingEvening, setIsSavingEvening] = useState(false);

  const today = getTodayDateString();
  const currentHour = new Date().getHours();
  const showEveningSection = currentHour >= EVENING_SECTION_START_HOUR;

  const loadToday = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setLoadError(null);

    const [sleepResult, eveningResult] = await Promise.all([
      supabase.from('sleep_entries').select('*').eq('user_id', userId).eq('date', today).maybeSingle(),
      supabase.from('evening_factors').select('*').eq('user_id', userId).eq('date', today).maybeSingle(),
    ]);

    if (sleepResult.error || eveningResult.error) {
      setLoadError(getSupabaseErrorMessage(sleepResult.error ?? eveningResult.error));
      setIsLoading(false);
      return;
    }

    setSleepEntry(sleepResult.data ?? null);
    setEveningFactors(eveningResult.data ?? null);
    setIsLoading(false);
  }, [userId, today]);

  useFocusEffect(
    useCallback(() => {
      loadToday();
    }, [loadToday])
  );

  function startEditingMorning() {
    setSleepQuality(sleepEntry?.sleep_quality ?? null);
    setTimesWoken(sleepEntry?.times_woken ?? 0);
    setBedtime(dbTimeToTimeValue(sleepEntry?.bedtime ?? null));
    setWakeTime(dbTimeToTimeValue(sleepEntry?.wake_time ?? null));
    setMorningError(null);
    setEditingMorning(true);
  }

  function startEditingEvening() {
    setCaffeineAfter3pm(eveningFactors?.caffeine_after_3pm ?? false);
    setAlcohol(eveningFactors?.alcohol ?? false);
    setScreenTime(eveningFactors?.screen_time_before_bed_minutes ?? 30);
    setStressLevel(eveningFactors?.stress_level ?? 3);
    setExerciseToday(eveningFactors?.exercise_today ?? false);
    setEveningError(null);
    setEditingEvening(true);
  }

  async function handleSaveMorning() {
    if (!userId) return;
    if (sleepQuality === null) {
      setMorningError('Wybierz, jak spałeś/aś.');
      return;
    }
    setMorningError(null);
    setIsSavingMorning(true);

    const { data, error } = await supabase
      .from('sleep_entries')
      .upsert(
        {
          user_id: userId,
          date: today,
          sleep_quality: sleepQuality,
          times_woken: timesWoken,
          bedtime: timeValueToDbTime(bedtime),
          wake_time: timeValueToDbTime(wakeTime),
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    setIsSavingMorning(false);

    if (error || !data) {
      setMorningError('Nie udało się zapisać. Spróbuj ponownie.');
      return;
    }

    setSleepEntry(data);
    setEditingMorning(false);
  }

  async function handleSaveEvening() {
    if (!userId) return;
    setEveningError(null);
    setIsSavingEvening(true);

    const { data, error } = await supabase
      .from('evening_factors')
      .upsert(
        {
          user_id: userId,
          date: today,
          caffeine_after_3pm: caffeineAfter3pm,
          alcohol,
          screen_time_before_bed_minutes: screenTime,
          stress_level: stressLevel,
          exercise_today: exerciseToday,
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    setIsSavingEvening(false);

    if (error || !data) {
      setEveningError('Nie udało się zapisać. Spróbuj ponownie.');
      return;
    }

    setEveningFactors(data);
    setEditingEvening(false);
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={loadToday} />;
  }

  const morningDone = Boolean(sleepEntry) && !editingMorning;
  const eveningDone = Boolean(eveningFactors) && !editingEvening;
  const bothDone = morningDone && eveningDone;

  return (
    <ScrollView
      className="flex-1 bg-indigo-50"
      contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
      <View>
        <Text className="text-sm font-medium text-violet-500">Dziś, {formatPolishDate()}</Text>
        <Text className="mt-1 text-3xl font-bold text-indigo-950">Dziennik</Text>
      </View>

      <RoutineChecklist />

      {bothDone ? (
        <Card>
          <Text className="text-lg font-semibold text-indigo-950">Dzisiejszy wpis zapisany ✓</Text>
          <Text className="mt-2 text-slate-600">
            Sen: {emojiFor(SLEEP_QUALITY_OPTIONS, sleepEntry?.sleep_quality)} · Wybudzenia:{' '}
            {sleepEntry?.times_woken} · Stres: {emojiFor(STRESS_OPTIONS, eveningFactors?.stress_level)}
          </Text>
          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={startEditingMorning}
              accessibilityRole="button"
              accessibilityLabel="Edytuj poranny wpis"
              className="rounded-full bg-violet-100 px-4 py-2">
              <Text className="font-semibold text-violet-900">Edytuj poranny</Text>
            </Pressable>
            <Pressable
              onPress={startEditingEvening}
              accessibilityRole="button"
              accessibilityLabel="Edytuj wieczorny wpis"
              className="rounded-full bg-violet-100 px-4 py-2">
              <Text className="font-semibold text-violet-900">Edytuj wieczorny</Text>
            </Pressable>
          </View>
        </Card>
      ) : (
        <>
          {morningDone ? (
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-indigo-950">Poranny wpis zapisany ✓</Text>
                <Pressable
                  onPress={startEditingMorning}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Edytuj poranny wpis">
                  <Text className="font-semibold text-violet-700">Edytuj</Text>
                </Pressable>
              </View>
            </Card>
          ) : (
            <Card>
              <Text className="text-lg font-semibold text-indigo-950">Jak spałeś/aś tej nocy?</Text>

              <View className="mt-4">
                <EmojiScale options={SLEEP_QUALITY_OPTIONS} value={sleepQuality} onChange={setSleepQuality} />
              </View>

              <View className="mt-5 gap-3">
                <TimeStepper
                  label="Godzina zaśnięcia"
                  value={bedtime}
                  defaultValue={DEFAULT_BEDTIME}
                  onChange={setBedtime}
                />
                <TimeStepper
                  label="Godzina pobudki"
                  value={wakeTime}
                  defaultValue={DEFAULT_WAKE_TIME}
                  onChange={setWakeTime}
                />
              </View>

              <View className="mt-5">
                <Text className="mb-3 text-center text-sm text-slate-500">Liczba wybudzeń w nocy</Text>
                <Stepper value={timesWoken} onChange={setTimesWoken} />
              </View>

              {morningError ? <InlineError message={morningError} /> : null}

              <Pressable
                onPress={handleSaveMorning}
                disabled={isSavingMorning}
                accessibilityRole="button"
                accessibilityLabel="Zapisz poranny wpis"
                accessibilityState={{ disabled: isSavingMorning, busy: isSavingMorning }}
                className="mt-6 items-center rounded-2xl bg-indigo-900 py-4 disabled:opacity-50">
                {isSavingMorning ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-semibold text-white">Zapisz</Text>
                )}
              </Pressable>
            </Card>
          )}

          {showEveningSection ? (
            eveningDone ? (
              <Card>
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-indigo-950">Wieczorny wpis zapisany ✓</Text>
                  <Pressable
                    onPress={startEditingEvening}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Edytuj wieczorny wpis">
                    <Text className="font-semibold text-violet-700">Edytuj</Text>
                  </Pressable>
                </View>
              </Card>
            ) : (
              <Card>
                <Text className="text-lg font-semibold text-indigo-950">Jak wyglądał Twój dzień?</Text>

                <View className="mt-4 gap-3">
                  <ToggleRow
                    label="Piłem/am kawę/kofeinę po 15:00"
                    value={caffeineAfter3pm}
                    onChange={setCaffeineAfter3pm}
                  />
                  <ToggleRow label="Piłem/am alkohol" value={alcohol} onChange={setAlcohol} />
                  <ToggleRow label="Ćwiczyłem/am dzisiaj" value={exerciseToday} onChange={setExerciseToday} />
                </View>

                <View className="mt-5">
                  <Text className="text-sm text-slate-500">
                    Czas przed ekranem przed snem: {screenTime} min
                  </Text>
                  <Slider
                    minimumValue={0}
                    maximumValue={120}
                    step={5}
                    value={screenTime}
                    onValueChange={setScreenTime}
                    minimumTrackTintColor="#6d28d9"
                    maximumTrackTintColor="#ddd6fe"
                    thumbTintColor="#6d28d9"
                    accessibilityLabel="Czas przed ekranem przed snem"
                    accessibilityValue={{ min: 0, max: 120, now: screenTime, text: `${screenTime} minut` }}
                  />
                </View>

                <View className="mt-5">
                  <Text className="mb-3 text-sm text-slate-500">Poziom stresu</Text>
                  <EmojiScale options={STRESS_OPTIONS} value={stressLevel} onChange={setStressLevel} />
                </View>

                {eveningError ? <InlineError message={eveningError} /> : null}

                <Pressable
                  onPress={handleSaveEvening}
                  disabled={isSavingEvening}
                  accessibilityRole="button"
                  accessibilityLabel="Zapisz wieczorny wpis"
                  accessibilityState={{ disabled: isSavingEvening, busy: isSavingEvening }}
                  className="mt-6 items-center rounded-2xl bg-indigo-900 py-4 disabled:opacity-50">
                  {isSavingEvening ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-base font-semibold text-white">Zapisz</Text>
                  )}
                </Pressable>
              </Card>
            )
          ) : morningDone ? (
            <Card>
              <Text className="text-center text-slate-500">
                Wieczorną część dziennika uzupełnisz po 18:00.
              </Text>
            </Card>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
