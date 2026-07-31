import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { InlineError } from '../components/InlineError';
import { LoadingScreen } from '../components/LoadingScreen';
import { useAuth } from '../lib/auth';
import { getSupabaseErrorMessage } from '../lib/errors';
import { seedDefaultRoutineItems } from '../lib/routines';
import { supabase, type RoutineChecklistItem } from '../lib/supabase';

export default function RoutineSettingsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [items, setItems] = useState<RoutineChecklistItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from('routine_checklist_items')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) {
      setLoadError(getSupabaseErrorMessage(error));
      setIsLoading(false);
      return;
    }

    if (data && data.length === 0) {
      setItems(await seedDefaultRoutineItems(userId));
    } else {
      setItems(data ?? []);
    }

    setIsLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function toggleActive(item: RoutineChecklistItem) {
    setMutationError(null);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i)));
    const { error } = await supabase
      .from('routine_checklist_items')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);
    if (error) {
      setMutationError(getSupabaseErrorMessage(error));
      await load();
    }
  }

  async function removeItem(item: RoutineChecklistItem) {
    setMutationError(null);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const { error } = await supabase.from('routine_checklist_items').delete().eq('id', item.id);
    if (error) {
      setMutationError(getSupabaseErrorMessage(error));
      await load();
    }
  }

  async function addItem() {
    const title = newTitle.trim();
    if (!title || !userId) return;

    setMutationError(null);
    setIsAdding(true);
    const sortOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
    const { data, error } = await supabase
      .from('routine_checklist_items')
      .insert({ user_id: userId, title, is_active: true, sort_order: sortOrder })
      .select()
      .single();
    setIsAdding(false);

    if (error || !data) {
      setMutationError(getSupabaseErrorMessage(error));
      return;
    }
    setItems((prev) => [...prev, data]);
    setNewTitle('');
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={load} />;
  }

  return (
    <ScrollView
      className="flex-1 bg-indigo-50"
      contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}>
      <Text className="text-sm text-slate-500">
        Zaznacz pozycje, które chcesz widzieć w checkliście na ekranie Dziennik. Usunięte pozycje znikają
        również z historii wypełnień.
      </Text>

      {items.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="Brak pozycji rutyny"
          description="Dodaj pierwszą pozycję poniżej, żeby zacząć budować swoją rutynę wieczorną."
        />
      ) : (
        items.map((item) => (
          <View
            key={item.id}
            className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${
              item.is_active ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white'
            }`}>
            <Pressable
              onPress={() => toggleActive(item)}
              accessibilityRole="switch"
              accessibilityLabel={item.title}
              accessibilityState={{ checked: item.is_active }}
              className="flex-1 flex-row items-center gap-3">
              <View
                className={`h-7 w-12 justify-center rounded-full p-1 ${
                  item.is_active ? 'bg-violet-500' : 'bg-slate-200'
                }`}>
                <View className="h-5 w-5 rounded-full bg-white" style={{ marginLeft: item.is_active ? 20 : 0 }} />
              </View>
              <Text className={`flex-1 text-base ${item.is_active ? 'text-violet-900' : 'text-slate-500'}`}>
                {item.title}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => removeItem(item)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Usuń ${item.title}`}
              className="px-2 py-2">
              <Text className="text-lg text-rose-500">✕</Text>
            </Pressable>
          </View>
        ))
      )}

      {mutationError ? <InlineError message={mutationError} /> : null}

      <View className="mt-4 flex-row items-center gap-3">
        <TextInput
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="Nowa pozycja rutyny"
          accessibilityLabel="Nowa pozycja rutyny"
          className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
        />
        <Pressable
          onPress={addItem}
          disabled={isAdding || newTitle.trim().length === 0}
          accessibilityRole="button"
          accessibilityLabel="Dodaj pozycję"
          accessibilityState={{ disabled: isAdding || newTitle.trim().length === 0, busy: isAdding }}
          className="items-center rounded-2xl bg-indigo-900 px-4 py-3 disabled:opacity-50">
          {isAdding ? <ActivityIndicator color="white" /> : <Text className="font-semibold text-white">Dodaj</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}
