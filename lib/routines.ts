import { supabase, type RoutineChecklistItem } from './supabase';

export const DEFAULT_ROUTINE_TITLES = [
  'Brak ekranu 30 min przed snem',
  'Przygaszone światło',
  'Bez kofeiny po 15:00',
  'Ten sam czas snu co wczoraj',
];

export async function seedDefaultRoutineItems(userId: string): Promise<RoutineChecklistItem[]> {
  const rows = DEFAULT_ROUTINE_TITLES.map((title, index) => ({
    user_id: userId,
    title,
    is_active: true,
    sort_order: index,
  }));

  const { data, error } = await supabase.from('routine_checklist_items').insert(rows).select();
  if (error || !data) return [];
  return data;
}
