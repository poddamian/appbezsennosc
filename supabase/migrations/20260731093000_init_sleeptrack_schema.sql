-- SleepTrack core schema: sleep entries, evening factors, and routine checklists.
-- Run via the Supabase CLI (supabase db push) or paste into the SQL editor.

create extension if not exists pgcrypto;

-- 1. sleep_entries
create table if not exists public.sleep_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  bedtime time,
  wake_time time,
  sleep_quality smallint check (sleep_quality between 1 and 5),
  times_woken integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists sleep_entries_user_id_date_idx
  on public.sleep_entries (user_id, date);

-- 2. evening_factors
create table if not exists public.evening_factors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  caffeine_after_3pm boolean not null default false,
  alcohol boolean not null default false,
  screen_time_before_bed_minutes integer,
  stress_level smallint check (stress_level between 1 and 5),
  exercise_today boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists evening_factors_user_id_date_idx
  on public.evening_factors (user_id, date);

-- 3. routine_checklist_items
create table if not exists public.routine_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create index if not exists routine_checklist_items_user_id_idx
  on public.routine_checklist_items (user_id);

-- 4. routine_completions
create table if not exists public.routine_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checklist_item_id uuid not null references public.routine_checklist_items (id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  unique (checklist_item_id, date)
);

create index if not exists routine_completions_user_id_date_idx
  on public.routine_completions (user_id, date);

-- Row Level Security: every user may only see and modify their own rows.

alter table public.sleep_entries enable row level security;
alter table public.evening_factors enable row level security;
alter table public.routine_checklist_items enable row level security;
alter table public.routine_completions enable row level security;

-- sleep_entries policies
create policy "sleep_entries_select_own"
  on public.sleep_entries for select
  using (auth.uid() = user_id);

create policy "sleep_entries_insert_own"
  on public.sleep_entries for insert
  with check (auth.uid() = user_id);

create policy "sleep_entries_update_own"
  on public.sleep_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sleep_entries_delete_own"
  on public.sleep_entries for delete
  using (auth.uid() = user_id);

-- evening_factors policies
create policy "evening_factors_select_own"
  on public.evening_factors for select
  using (auth.uid() = user_id);

create policy "evening_factors_insert_own"
  on public.evening_factors for insert
  with check (auth.uid() = user_id);

create policy "evening_factors_update_own"
  on public.evening_factors for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "evening_factors_delete_own"
  on public.evening_factors for delete
  using (auth.uid() = user_id);

-- routine_checklist_items policies
create policy "routine_checklist_items_select_own"
  on public.routine_checklist_items for select
  using (auth.uid() = user_id);

create policy "routine_checklist_items_insert_own"
  on public.routine_checklist_items for insert
  with check (auth.uid() = user_id);

create policy "routine_checklist_items_update_own"
  on public.routine_checklist_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "routine_checklist_items_delete_own"
  on public.routine_checklist_items for delete
  using (auth.uid() = user_id);

-- routine_completions policies
create policy "routine_completions_select_own"
  on public.routine_completions for select
  using (auth.uid() = user_id);

create policy "routine_completions_insert_own"
  on public.routine_completions for insert
  with check (auth.uid() = user_id);

create policy "routine_completions_update_own"
  on public.routine_completions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "routine_completions_delete_own"
  on public.routine_completions for delete
  using (auth.uid() = user_id);
