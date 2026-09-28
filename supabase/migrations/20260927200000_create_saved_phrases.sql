-- Phrases the learner asks to remember during English clarification mode.
-- Same open, no-sign-in access model as practice_sessions.

create table if not exists public.saved_phrases (
  id text primary key,
  spanish text not null,
  english text not null,
  scenario text not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_phrases_created_idx
  on public.saved_phrases (created_at desc);

alter table public.saved_phrases enable row level security;

grant select, insert, update, delete on table public.saved_phrases to anon, authenticated;

create policy "Anyone can read saved phrases"
  on public.saved_phrases for select to anon, authenticated using (true);

create policy "Anyone can write saved phrases"
  on public.saved_phrases for insert to anon, authenticated with check (true);

create policy "Anyone can update saved phrases"
  on public.saved_phrases for update to anon, authenticated using (true) with check (true);

create policy "Anyone can delete saved phrases"
  on public.saved_phrases for delete to anon, authenticated using (true);
