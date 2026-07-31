import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '../lib/auth';
import { getTodayDateString } from '../lib/journal';
import { supabase, type RoutineChecklistItem } from '../lib/supabase';
import { Card } from './Card';

export function RoutineChecklist() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const today = getTodayDateString();

  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<RoutineChecklistItem[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    const [{ data: itemsData }, { data: completionsData }] = await Promise.all([
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

    setItems(itemsData ?? []);
    setCompletedIds(new Set((completionsData ?? []).map((row) => row.checklist_item_id)));
    setIsLoading(false);
  }, [userId, today]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(item: RoutineChecklistItem) {
    if (!userId) return;
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

    if (error) await load();
  }

  if (isLoading || items.length === 0) {
    return null;
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
    </Card>
  );
}
