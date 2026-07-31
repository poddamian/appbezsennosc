-- Per-user app preferences: evening/morning reminder times and whether
-- local notifications are enabled. One row per user, created the first
-- time they go through the notifications onboarding screen.

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  notifications_enabled boolean not null default false,
  evening_reminder_hour smallint not null default 21 check (evening_reminder_hour between 0 and 23),
  evening_reminder_minute smallint not null default 0 check (evening_reminder_minute between 0 and 59),
  morning_reminder_hour smallint not null default 9 check (morning_reminder_hour between 0 and 23),
  morning_reminder_minute smallint not null default 0 check (morning_reminder_minute between 0 and 59),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "user_settings_update_own"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_settings_delete_own"
  on public.user_settings for delete
  using (auth.uid() = user_id);
