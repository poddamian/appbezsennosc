import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useAuth } from '../lib/auth';
import { getSupabaseErrorMessage } from '../lib/errors';
import { getTodayDateString } from '../lib/journal';
import { supabase, type RoutineChecklistItem } from '../lib/supabase';
import { Card } from './Card';
import { EmptyState } from './EmptyState';
import { InlineError } from './InlineError';

export function RoutineChecklist() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const today = getTodayDateString();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [items, setItems] = useState<RoutineChecklistItem[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setLoadError(null);

    const [itemsResult, completionsResult] = await Promise.all([
      supabase
        .from('routine_checklist_items')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('routine_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('completed', true),
    ]);

    if (itemsResult.error || completionsResult.error) {
      setLoadError(getSupabaseErrorMessage(itemsResult.error ?? completionsResult.error));
      setIsLoading(false);
      return;
    }

    setItems(itemsResult.data ?? []);
    setCompletedIds(new Set((completionsResult.data ?? []).map((row) => row.checklist_item_id)));
    setIsLoading(false);
  }, [userId, today]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(item: RoutineChecklistItem) {
    if (!userId) return;
    setToggleError(null);
    const wasCompleted = completedIds.has(item.id);

    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (wasCompleted) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });

    const { error } = await supabase.from('routine_completions').upsert(
      {
        user_id: userId,
        checklist_item_id: item.id,
        date: today,
        completed: !wasCompleted,
      },
      { onConflict: 'checklist_item_id,date' }
    );

    if (error) {
      setToggleError(getSupabaseErrorMessage(error));
      await load();
    }
  }

  if (isLoading) {
    return (
      <Card>
        <View className="items-center py-2" accessibilityRole="progressbar" accessibilityLabel="Ładowanie rutyny">
          <ActivityIndicator color="#6d28d9" />
        </View>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <Text className="text-lg font-semibold text-indigo-950">Rutyna wieczorna</Text>
        <InlineError message={loadError} />
        <Pressable
          onPress={load}
          accessibilityRole="button"
          accessibilityLabel="Spróbuj ponownie"
          className="mt-3 items-center rounded-2xl bg-violet-100 py-2.5">
          <Text className="font-semibold text-violet-900">Spróbuj ponownie</Text>
        </Pressable>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          emoji="📝"
          title="Nie masz jeszcze ustawionej rutyny wieczornej"
          description="Dodaj kilka nawyków w Profilu, żeby odhaczać je tutaj każdego dnia."
          actionLabel="Ustaw rutynę"
          onAction={() => router.push('/routine-settings')}
        />
      </Card>
    );
  }

  return (
    <Card>
      <Text className="text-lg font-semibold text-indigo-950">Rutyna wieczorna</Text>
      <View className="mt-4 gap-2">
        {items.map((item) => {
          const checked = completedIds.has(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => toggle(item)}
              accessibilityRole="checkbox"
              accessibilityLabel={item.title}
              accessibilityState={{ checked }}
              className={`flex-row items-center rounded-2xl border px-4 py-3 ${
                checked ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white'
              }`}>
              <View
                className={`mr-3 h-6 w-6 items-center justify-center rounded-full border-2 ${
                  checked ? 'border-violet-600 bg-violet-600' : 'border-slate-300'
                }`}>
                {checked ? <Text className="text-xs font-bold text-white">✓</Text> : null}
              </View>
              <Text className={`flex-1 text-base ${checked ? 'text-violet-900 line-through' : 'text-slate-800'}`}>
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {toggleError ? <InlineError message={toggleError} /> : null}
    </Card>
  );
}
