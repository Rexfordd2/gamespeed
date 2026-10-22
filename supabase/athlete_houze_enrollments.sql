create table if not exists public.athlete_houze_enrollments (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null check (status in ('linked', 'disconnected')),
  linked_at timestamptz not null default now(),
  backfill_consented boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.athlete_houze_enrollments enable row level security;

drop policy if exists "Users read own Houze enrollment" on public.athlete_houze_enrollments;
create policy "Users read own Houze enrollment"
on public.athlete_houze_enrollments
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own Houze enrollment" on public.athlete_houze_enrollments;

drop policy if exists "Users update own Houze enrollment" on public.athlete_houze_enrollments;

create table if not exists public.athlete_houze_round_deliveries (
  user_id uuid not null references auth.users (id) on delete cascade,
  client_round_id text not null,
  status text not null check (status in ('pending', 'accepted', 'unattached', 'failed')),
  receiver_status integer,
  updated_at timestamptz not null default now(),
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

drop policy if exists "Users update own Houze deliveries" on public.athlete_houze_round_deliveries;

-- A user JWT must never manufacture a successful server linkage or receipt.
revoke all on public.athlete_houze_enrollments, public.athlete_houze_round_deliveries from anon, authenticated;
grant select on public.athlete_houze_enrollments, public.athlete_houze_round_deliveries to authenticated;
grant select, insert, update, delete on public.athlete_houze_enrollments, public.athlete_houze_round_deliveries to service_role;

-- Queue atomically with the source round. No browser callback is required to
-- preserve the handoff, and unlinked or pre-consent history is not enqueued.
create or replace function public.queue_houze_round()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.athlete_houze_enrollments e
    where e.user_id = new.user_id and e.status = 'linked'
      and (e.backfill_consented or new.round_ts >= e.linked_at)
  ) then
    insert into public.athlete_houze_round_deliveries(user_id,client_round_id,status)
    values(new.user_id,new.client_round_id,'pending') on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.queue_houze_round() from public, anon, authenticated;
drop trigger if exists queue_houze_round on public.user_rounds;
create trigger queue_houze_round after insert on public.user_rounds
for each row execute function public.queue_houze_round();
