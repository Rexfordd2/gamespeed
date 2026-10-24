-- Rollback for supabase/athlete_houze_enrollments.sql.
-- Do not place this file in supabase/migrations. Supabase applies that
-- directory forward. Do not run it against Athlete Houze Neon, the isolated
-- QA database, or a sender database that already holds integration rows.
--
-- Production order:
-- 1. Release the Houze receiver that accepts gamespeed.round.completed.
--    source_app is unconstrained text; no Houze table is added for GameSpeed.
-- 2. Apply the forward file on an isolated database and run
--    npm run test:houze-rls.
-- 3. Apply that same forward file to the GameSpeed production database.
--    It adds tables and does not rewrite existing product rows.
-- 4. Set server-only ATHLETE_HOUZE_REPORT_URL, the source HMAC, and
--    HOUZE_RECOVERY_SECRET or CRON_SECRET. Confirm the scheduler invoked
--    GET /api/athlete-houze/recover. An unwired route is not recovery.
-- 5. Enable sender traffic only after that invocation succeeds.
--
-- This script refuses while any enrollment or delivery row exists. Use it
-- only before the first production pairing, or after those rows have been
-- removed by an explicit later decision.

do $$
declare
  enrollments bigint := 0;
  deliveries bigint := 0;
begin
  if to_regclass('public.athlete_houze_enrollments') is not null then
    select count(*) into enrollments from public.athlete_houze_enrollments;
  end if;
  if to_regclass('public.athlete_houze_round_deliveries') is not null then
    select count(*) into deliveries from public.athlete_houze_round_deliveries;
  end if;
  if enrollments + deliveries > 0 then
    raise exception 'REFUSE: Houze integration rows exist (enrollments %, deliveries %). Disable the sender and keep the tables.', enrollments, deliveries;
  end if;
end $$;

drop trigger if exists queue_houze_round on public.user_rounds;
drop function if exists public.queue_houze_round();
drop table if exists public.athlete_houze_round_deliveries;
drop table if exists public.athlete_houze_enrollments;
