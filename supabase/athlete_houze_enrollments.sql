create table if not exists public.athlete_houze_enrollments (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null check (status in ('linked', 'disconnected')),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.athlete_houze_enrollments enable row level security;

drop policy if exists "Users read own Houze enrollment" on public.athlete_houze_enrollments;
create policy "Users read own Houze enrollment"
on public.athlete_houze_enrollments
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own Houze enrollment" on public.athlete_houze_enrollments;
create policy "Users insert own Houze enrollment"
on public.athlete_houze_enrollments
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own Houze enrollment" on public.athlete_houze_enrollments;
create policy "Users update own Houze enrollment"
on public.athlete_houze_enrollments
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table if not exists public.athlete_houze_round_deliveries (
  user_id uuid not null references auth.users (id) on delete cascade,
  client_round_id text not null,
  status text not null check (status in ('accepted', 'unattached', 'failed')),
  receiver_status integer,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, client_round_id)
);

alter table public.athlete_houze_round_deliveries enable row level security;

drop policy if exists "Users read own Houze deliveries" on public.athlete_houze_round_deliveries;
create policy "Users read own Houze deliveries"
on public.athlete_houze_round_deliveries
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own Houze deliveries" on public.athlete_houze_round_deliveries;
create policy "Users insert own Houze deliveries"
on public.athlete_houze_round_deliveries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own Houze deliveries" on public.athlete_houze_round_deliveries;
create policy "Users update own Houze deliveries"
on public.athlete_houze_round_deliveries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
