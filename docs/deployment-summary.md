# Deployment Summary

## Production Branch

- Current working branch validated in this repo: `master`.
- Use the branch configured as Production Branch in Vercel (commonly `master` here) before promoting.

## Commands Run

- `npm run verify` (runs `typecheck`, `lint`, `test`, then `build`)

## Required Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Optional:
  - `VITE_APP_ENV=production`
  - `VITE_LANDING_EXPERIMENT_VARIANT` (`A`/`B`/`C`) only if forcing a variant

## Known Caveats

- Social proof and testimonial data is intentionally placeholder launch content and is clearly marked in `src/content/credibilityContent.ts`.
- Leaderboard is currently a shell/placeholder model, also clearly labeled in the UI and source.
- If Supabase env vars are missing, gameplay still works locally, but account signup/sync remains disabled.
- Build passes, but Vite reports a JS bundle-size warning (~569 kB main chunk). This is not a launch blocker, but should be optimized in a follow-up.
