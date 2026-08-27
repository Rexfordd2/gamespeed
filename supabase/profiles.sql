create table if not exists public.gamespeed_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null check (char_length(trim(display_name)) between 2 and 80),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_gamespeed_profiles_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_gamespeed_profiles_updated_at on public.gamespeed_profiles;
create trigger set_gamespeed_profiles_updated_at
before update on public.gamespeed_profiles
for each row
execute function public.set_gamespeed_profiles_updated_at();

alter table public.gamespeed_profiles enable row level security;

drop policy if exists "Users can read own GameSpeed profile" on public.gamespeed_profiles;
create policy "Users can read own GameSpeed profile"
on public.gamespeed_profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can insert own GameSpeed profile" on public.gamespeed_profiles;
create policy "Users can insert own GameSpeed profile"
on public.gamespeed_profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update own GameSpeed profile" on public.gamespeed_profiles;
create policy "Users can update own GameSpeed profile"
on public.gamespeed_profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke all on public.gamespeed_profiles from anon, authenticated;
grant select, insert, update on public.gamespeed_profiles to authenticated;
