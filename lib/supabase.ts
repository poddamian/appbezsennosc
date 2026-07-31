import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export type SleepEntry = {
  id: string;
  user_id: string;
  date: string;
  bedtime: string | null;
  wake_time: string | null;
  sleep_quality: number | null;
  times_woken: number;
  created_at: string;
};

export type EveningFactors = {
  id: string;
  user_id: string;
  date: string;
  caffeine_after_3pm: boolean;
  alcohol: boolean;
  screen_time_before_bed_minutes: number | null;
  stress_level: number | null;
  exercise_today: boolean;
  created_at: string;
};

export type RoutineChecklistItem = {
  id: string;
  user_id: string;
  title: string;
  is_active: boolean;
  sort_order: number;
};

export type RoutineCompletion = {
  id: string;
  user_id: string;
  checklist_item_id: string;
  date: string;
  completed: boolean;
};

export type UserSettings = {
  user_id: string;
  notifications_enabled: boolean;
  evening_reminder_hour: number;
  evening_reminder_minute: number;
  morning_reminder_hour: number;
  morning_reminder_minute: number;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      sleep_entries: {
        Row: SleepEntry;
        Insert: Partial<Pick<SleepEntry, 'id' | 'created_at'>> &
          Omit<SleepEntry, 'id' | 'created_at' | 'times_woken'> & { times_woken?: number };
        Update: Partial<SleepEntry>;
        Relationships: [];
      };
      evening_factors: {
        Row: EveningFactors;
        Insert: Partial<Pick<EveningFactors, 'id' | 'created_at'>> &
          Omit<
            EveningFactors,
            'id' | 'created_at' | 'caffeine_after_3pm' | 'alcohol' | 'exercise_today'
          > & {
            caffeine_after_3pm?: boolean;
            alcohol?: boolean;
            exercise_today?: boolean;
          };
        Update: Partial<EveningFactors>;
        Relationships: [];
      };
      routine_checklist_items: {
        Row: RoutineChecklistItem;
        Insert: Partial<Pick<RoutineChecklistItem, 'id' | 'is_active' | 'sort_order'>> &
          Omit<RoutineChecklistItem, 'id' | 'is_active' | 'sort_order'>;
        Update: Partial<RoutineChecklistItem>;
        Relationships: [];
      };
      routine_completions: {
        Row: RoutineCompletion;
        Insert: Partial<Pick<RoutineCompletion, 'id' | 'completed'>> &
          Omit<RoutineCompletion, 'id' | 'completed'>;
        Update: Partial<RoutineCompletion>;
        Relationships: [];
      };
      user_settings: {
        Row: UserSettings;
        Insert: Partial<
          Pick<
            UserSettings,
            | 'notifications_enabled'
            | 'evening_reminder_hour'
            | 'evening_reminder_minute'
            | 'morning_reminder_hour'
            | 'morning_reminder_minute'
            | 'updated_at'
          >
        > &
          Pick<UserSettings, 'user_id'>;
        Update: Partial<UserSettings>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
