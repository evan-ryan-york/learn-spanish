create table if not exists public.practice_sessions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario text not null,
  level smallint not null check (level between 1 and 5),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  turns jsonb not null check (jsonb_typeof(turns) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists practice_sessions_user_scenario_started_idx
  on public.practice_sessions (user_id, scenario, started_at desc);

alter table public.practice_sessions enable row level security;

revoke all on table public.practice_sessions from anon, authenticated;
grant select, insert, update, delete on table public.practice_sessions to authenticated;

create policy "Users can read their own practice sessions"
  on public.practice_sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own practice sessions"
  on public.practice_sessions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own practice sessions"
  on public.practice_sessions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own practice sessions"
  on public.practice_sessions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
