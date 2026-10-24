import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create table auth.users(id uuid primary key);
create table public.user_rounds(user_id uuid, client_round_id text, round_ts timestamptz);
grant insert on public.user_rounds to service_role;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to authenticated;
insert into auth.users values ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');`);
const migration = await readFile(new URL('../supabase/athlete_houze_enrollments.sql', import.meta.url),'utf8');
await db.exec(migration);
await db.exec(migration);
await db.exec(`set role service_role;
insert into public.athlete_houze_enrollments(user_id,status) values ('11111111-1111-4111-8111-111111111111','linked'),('22222222-2222-4222-8222-222222222222','linked');
insert into public.athlete_houze_round_deliveries(user_id,client_round_id,status) values ('11111111-1111-4111-8111-111111111111','round-one','accepted'),('22222222-2222-4222-8222-222222222222','round-two','accepted');
insert into public.user_rounds values ('11111111-1111-4111-8111-111111111111','queued-round',now() + interval '1 second');
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);`);
for (const table of ['athlete_houze_enrollments','athlete_houze_round_deliveries']) {
 const {rows} = await db.query(`select user_id from public.${table}`);
 assert.equal(rows.length,table === 'athlete_houze_round_deliveries' ? 2 : 1); assert.equal(rows[0].user_id,'11111111-1111-4111-8111-111111111111');
 await assert.rejects(db.exec(`update public.${table} set updated_at = now()`), /permission denied/);
 await assert.rejects(db.exec(`delete from public.${table}`), /permission denied/);
}
await assert.rejects(db.exec(`insert into public.athlete_houze_enrollments(user_id,status) values ('11111111-1111-4111-8111-111111111111','linked')`), /permission denied/);
const queued = await db.query("select status from public.athlete_houze_round_deliveries where client_round_id='queued-round'");
assert.equal(queued.rows[0].status,'pending');
await db.exec('reset role; set role anon');
await assert.rejects(db.exec('select * from public.athlete_houze_enrollments'), /permission denied/);

await db.exec('reset role; set role service_role');
await assert.rejects(
  db.exec(`update public.athlete_houze_round_deliveries set attempt_count = 9 where client_round_id = 'round-one'`),
  /check constraint/,
);
await assert.rejects(
  db.exec(`update public.athlete_houze_round_deliveries set status = 'held' where client_round_id = 'round-one'`),
  /check constraint/,
);
await assert.rejects(
  db.exec(`update public.athlete_houze_round_deliveries set next_attempt_at = null where client_round_id = 'round-one'`),
  /null value/,
);
await db.exec(`update public.athlete_houze_round_deliveries set status = 'failed', attempt_count = 1, next_attempt_at = now() where client_round_id = 'round-one'`);
const leased = await db.query(`update public.athlete_houze_round_deliveries set status = 'sending', attempt_count = 2, next_attempt_at = now() + interval '2 minutes' where client_round_id = 'round-one' and status = 'failed' and attempt_count = 1 returning status, attempt_count`);
assert.equal(leased.rows[0].status, 'sending');
assert.equal(leased.rows[0].attempt_count, 2);
await db.exec(`update public.athlete_houze_round_deliveries set status = 'accepted' where client_round_id = 'round-one' and status = 'sending'`);

await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false)`);
await assert.rejects(
  db.exec(`update public.athlete_houze_round_deliveries set attempt_count = 3 where client_round_id = 'round-one'`),
  /permission denied/,
);
await db.exec(`select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false)`);
const other = await db.query(`select client_round_id from public.athlete_houze_round_deliveries where client_round_id = 'round-one'`);
assert.equal(other.rows.length, 0);

await db.exec('reset role; set role service_role');
await db.exec(`update public.athlete_houze_enrollments set linked_at = now(), backfill_consented = false where user_id = '11111111-1111-4111-8111-111111111111'`);
await db.exec(`insert into public.user_rounds values ('11111111-1111-4111-8111-111111111111','historical-round', now() - interval '2 days')`);
const historical = await db.query(`select 1 from public.athlete_houze_round_deliveries where client_round_id = 'historical-round'`);
assert.equal(historical.rows.length, 0);
await db.exec(`insert into public.user_rounds values ('11111111-1111-4111-8111-111111111111','fresh-round', now() + interval '1 second')`);
await db.exec(`insert into public.user_rounds values ('11111111-1111-4111-8111-111111111111','fresh-round', now() + interval '2 seconds')`);
const fresh = await db.query(`select status, attempt_count, count(*)::int as n from public.athlete_houze_round_deliveries where client_round_id = 'fresh-round' group by status, attempt_count`);
assert.equal(fresh.rows.length, 1);
assert.equal(fresh.rows[0].status, 'pending');
assert.equal(fresh.rows[0].attempt_count, 0);
assert.equal(fresh.rows[0].n, 1);

const rollback = await readFile(new URL('../supabase/rollbacks/athlete_houze_enrollments_rollback.sql', import.meta.url), 'utf8');
await assert.rejects(db.exec(rollback), /REFUSE: Houze integration rows exist/);
await db.close();

const empty = new PGlite();
await empty.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create table auth.users(id uuid primary key);
create table public.user_rounds(user_id uuid, client_round_id text, round_ts timestamptz);
grant insert on public.user_rounds to service_role;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
insert into auth.users values ('11111111-1111-4111-8111-111111111111');`);
await empty.exec(migration);
await empty.exec(rollback);
const gone = await empty.query(`select to_regclass('public.athlete_houze_enrollments') as enrollments, to_regclass('public.athlete_houze_round_deliveries') as deliveries, to_regprocedure('public.queue_houze_round()') as queue`);
assert.equal(gone.rows[0].enrollments, null);
assert.equal(gone.rows[0].deliveries, null);
assert.equal(gone.rows[0].queue, null);
await empty.exec(migration);
await empty.exec(`set role service_role; insert into public.athlete_houze_enrollments(user_id,status) values ('11111111-1111-4111-8111-111111111111','linked')`);
await empty.close();
console.log('PASS: migration rerun; server writes; owner-only reads; client forgery/update/delete denied; anonymous reads denied; retry bounds; withheld history; duplicate queue; rollback refusal and empty rollback.');
