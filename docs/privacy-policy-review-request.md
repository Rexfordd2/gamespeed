# GameSpeed privacy policy — founder and legal review request

**Status: not published.** Nothing in this file appears in the app. `/privacy` shows a "Privacy policy not yet published" notice until an approved policy replaces it.

Before this change, `/privacy` (and every unknown path) silently rendered the homepage because of the SPA rewrite in `vercel.json`. Visitors had no policy and no indication that none existed.

## What the code stores today

Taken from the source on this branch. Reviewers should confirm it against the production Supabase project and any tag manager configuration before writing policy text.

| Data | Where | When | Source |
| --- | --- | --- | --- |
| Round results (mode, score, misses, accuracy, streaks, reaction times, readiness metrics, sport) | Browser `localStorage` | Every round, with or without an account | `src/utils/sessionStats.ts` |
| Conversion events (event name, device type, host, path, experiment variant, round payload) | Browser `localStorage`; also pushed to `window.dataLayer` if a page script defines it | Landing, test start/completion, signup prompt, share, return visit | `src/lib/analytics.ts` |
| Preferences (sport, cue intensity, haptics, night guardrail, sleep check-ins, intro flags) | Browser `localStorage` | When set | `src/App.tsx`, `src/utils/*` |
| Email address (magic-link sign-in) | Supabase Auth | Only when a user signs in | `src/context/AuthContext.tsx` |
| Profile: email, display name | Supabase `gamespeed_profiles` (row-level security: own row only) | After sign-in | `supabase/profiles.sql` |
| Round history (same fields as local rounds) | Supabase `user_rounds` (own rows only) | After sign-in; local rounds are uploaded when the user signs in | `src/utils/roundSync.ts`, `supabase/user_rounds.sql` |
| Coach Mode athlete names and results | Browser `localStorage` | When a coach uses Coach Mode | `src/utils/coachStore.ts` |

`index.html` loads no third-party analytics or tag manager on this branch.

## Decisions needed before publishing

1. Which entity is the data controller (GameSpeed, Athlete Houze, or another company) and the contact address for privacy requests.
2. Whether GameSpeed is directed at or used by people under 13 or under 18, and what consent or guardian flow applies. Coach Mode stores athlete names locally.
3. Retention and deletion for `gamespeed_profiles` and `user_rounds`, and how a user requests deletion.
4. Whether GameSpeed shares any data with Athlete Houze. The Athlete Houze integration registry lists GameSpeed as a `live_ingest` signed source, but this repository contains no code that sends data to Athlete Houze. Confirm whether a sender runs elsewhere before the policy describes any transfer.
5. Whether a tag manager will populate `window.dataLayer` in production.
6. Whether the Athlete Houze privacy policy should be extended to cover GameSpeed instead of a separate policy. It does not mention GameSpeed today.

When the policy is approved, replace `PrivacyStatusPage` in `src/components/PublicNoticePage.tsx` with the approved text or a link to it.
