# Houze integration candidate — 2026-10-22

This is a candidate on PR #7, not a production certification.

## Changes

- Enrollment and delivery receipts are server-written. Browser credentials can only read their owner's rows under RLS.
- A saved, consented source round queues a delivery in the same database transaction. Immediate delivery is best effort; the sharing panel exposes bounded retries, pending/held counts, and stopping future sharing.
- Pre-link rounds are withheld unless backfill was explicitly consented. The product UI opts into new rounds only.
- A 200 duplicate is attached only when the receipt also identifies an athlete. Held duplicates are not counted as success.
- Receiver calls have timeouts and reject redirects. A failed receipt write is reported.
- API files are now included in TypeScript checking.

## Configuration and rollout

1. Review `supabase/athlete_houze_enrollments.sql`, then run `npm run test:houze-rls`. The fixture uses an isolated PostgreSQL engine, synthetic IDs, two owners, client write denials, server writes and atomic queuing. It is not a live Supabase test.
2. Apply the migration to an isolated test project first. The current live GameSpeed project was inspected and had neither integration table. Do not apply an older client-writable version.
3. Set server-only `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`), `ATHLETE_HOUZE_REPORT_URL`, and the source-specific `ATHLETE_HOUZE_REPORT_HMAC_SECRET`. Use environment-specific databases and secrets. Never use a `VITE_` prefix for privileged keys.
4. Deploy the matching Houze receiver before enabling sender delivery. Test with synthetic accounts through both deployed apps.
5. Prove pairing, one saved round, duplicate, outage/retry, stopped sharing, revoked Houze link, reconnect without backfill, and isolation between two families. Confirm persisted evidence in Houze Graph and Intelligence.
6. Only then release the production candidate and repeat a synthetic production smoke test.

## Remaining limitations

- Retries are user initiated from the sharing panel. No unattended worker or scheduled recovery is deployed.
- Stopping sharing blocks subsequent sender attempts. An in-flight delivery may finish. Previously shared Houze records remain; the user can revoke the receiver link from Houze.
- Houze pairing race is corrected in candidate `34b36affc4d0b2327c9225b58de557a7af01cbb7`: conditional code claim precedes identity linking. Thirteen unit tests and two isolated PostgreSQL concurrency tests passed. Hosted acceptance on that exact candidate is still required.
- If Houze accepts a pairing but the local enrollment write fails, the user needs a new pairing code. This is reported, not shown as connected.
- Physical-device camera acceptance, Vanta arcade, all-sport intelligence behavior, and deployed three-source certification are separate release gates.

## Infrastructure observations

- Production Houze Neon project `spring-king-25884763`, branch `br-wispy-mud-adomcgko`, database `neondb`: 39 migration records, max ID 48. IDs are not a migration count. No production migration was applied in this review.
- Secrets source is a Sites-managed repository for project `appgprj_6a91af84ef808191a28ec15d3792b328`, inspected at `e28ac496fe02e9cf9e487c3e5ccea802d05d0281`. It is accessible with Sites' source workflow; absence from GitHub is not absence of source.
- Secrets has configured production coaching/auth entries and 40 local coaching/assessment/rate-limit checks passed. That is not live-model acceptance. The inspected Houze contract has no Secrets source/event registration and Secrets has no Houze enrollment/outbox tables.

## Browser follow-up

The deployed GameSpeed candidate at `8b3fa69` completed a Quick Tap round, recorded a hit, and held the round timer during pause. Targets still aged during pause; the follow-up shifts target and spawn timestamps on resume. A long-pause regression verifies the target remains hittable. Quick Tap also incorrectly checked off the baseline benchmark; checklist completion now derives from an actual Reaction Benchmark round. Results display timing spread and best streak instead of ambiguous Vision/Control percentages. These follow-up changes require their own Preview acceptance.
