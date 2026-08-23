-- This is a single-user personal app. Practice transcripts must appear on
-- every device with no sign-in step, so drop the per-user ownership model
-- and let the browser's publishable key read and write rows directly.

drop policy if exists "Users can read their own practice sessions" on public.practice_sessions;
drop policy if exists "Users can create their own practice sessions" on public.practice_sessions;
drop policy if exists "Users can update their own practice sessions" on public.practice_sessions;
drop policy if exists "Users can delete their own practice sessions" on public.practice_sessions;

drop index if exists public.practice_sessions_user_scenario_started_idx;

alter table public.practice_sessions drop column if exists user_id;

create index if not exists practice_sessions_scenario_started_idx
  on public.practice_sessions (scenario, started_at desc);

grant select, insert, update, delete on table public.practice_sessions to anon, authenticated;

-- RLS stays enabled so the table is never accidentally exposed by default,
-- but the policy is intentionally open: anyone with the app URL can read and
-- write transcripts. Acceptable here because the app is personal and its
-- OpenAI endpoints are already unauthenticated.
create policy "Anyone can read practice sessions"
  on public.practice_sessions for select to anon, authenticated using (true);

create policy "Anyone can write practice sessions"
  on public.practice_sessions for insert to anon, authenticated with check (true);

create policy "Anyone can update practice sessions"
  on public.practice_sessions for update to anon, authenticated using (true) with check (true);

create policy "Anyone can delete practice sessions"
  on public.practice_sessions for delete to anon, authenticated using (true);
