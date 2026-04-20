create table if not exists public.user_rounds (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  client_round_id text not null,
  round_ts timestamptz not null,
  mode text not null,
  mode_name text not null,
  score integer not null check (score >= 0),
  misses integer not null check (misses >= 0),
  accuracy integer not null check (accuracy between 0 and 100),
  best_streak integer not null check (best_streak >= 0),
  median_reaction_time_ms integer,
  benchmark_score integer,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_round_id)
);

create index if not exists user_rounds_user_id_round_ts_idx
  on public.user_rounds (user_id, round_ts desc);

alter table public.user_rounds enable row level security;

drop policy if exists "Users can insert own rounds" on public.user_rounds;
create policy "Users can insert own rounds"
on public.user_rounds
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can read own rounds" on public.user_rounds;
create policy "Users can read own rounds"
on public.user_rounds
for select
to authenticated
using (auth.uid() = user_id);

grant select, insert on public.user_rounds to authenticated;
