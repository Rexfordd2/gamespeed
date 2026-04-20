# GameSpeed

A browser-based eye-training and reaction game with multiple game modes, built with React, TypeScript, Vite, and Tailwind CSS.

Live: **https://rexfordd2.github.io/gamespeed/**

---

## Game Modes

| Mode | Status | Description |
|---|---|---|
| Quick Tap | Ready | Single target — tap before it disappears |
| Multi Target | Ready | Five targets at once — hit as many as you can |
| Swipe Strike | Ready | Moving targets — swipe in the shown direction before escape |
| Hold Track | Ready | Hold a moving target through its path |
| Sequence Memory | Ready | Watch a sequence, then replay it in order |

---

## Local Development

**Requirements:** Node >= 18

```bash
npm install
# copy env vars and fill with your Supabase values
# cp .env.example .env.local
npm run dev        # dev server at http://localhost:5173/
```

---

## Available Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run lint` | ESLint — zero-warning policy |
| `npm run test` | Vitest unit test suite |
| `npm run verify` | Run all checks then build (pre-commit gate) |
| `npm run prepare-assets` | Validate production asset structure and report missing files |

---

## Deployment

**Host:** Vercel (recommended for auth-enabled app)

Env vars are covered in the [Auth + Cloud Sync](#auth--cloud-sync-supabase) section below.

The CI pipeline runs typecheck → lint → test → build. A deploy is only triggered after all quality gates pass.

Current base behavior in `vite.config.ts`:
- `npm run dev` uses `/` for cleaner local development
- `npm run build` uses `/gamespeed/` for GitHub Pages compatibility

To deploy to a different host (e.g. Vercel, Netlify) at a root domain, set the build base to `/` in `vite.config.ts`.
Asset URLs in `src/themes/jungle.ts` already use `import.meta.env.BASE_URL`, so they follow `base` automatically.

---

## Project Structure

```
src/
  components/   React UI components
  modes/        Target generation logic per game mode
  themes/       Visual and audio theme config
  types/        Shared TypeScript interfaces
  utils/        Game mode registry and descriptions
  context/      React context providers
  tests/        Vitest unit tests
public/
  assets/       Production assets by type (`icons/`, `backgrounds/`, `audio/`, `ui/`)
scripts/
  prepare-assets.js          Verifies required production asset file paths
```

---

## Asset System

Asset paths are centrally managed in `src/themes/assetManifest.ts` and resolved with `import.meta.env.BASE_URL`.

- **Visuals:** production-path SVGs ship in `public/assets/icons/`, `public/assets/backgrounds/overlays/`, and `public/assets/ui/`.
- **Audio:** expected in `public/assets/audio/music/` and `public/assets/audio/effects/`.
- **Runtime fallback behavior:** if icon/overlay/audio files are missing, the UI still renders with intentional fallback visuals and synthesized effect tones (no broken-image icons or hard runtime failures).

See `public/assets/README.md` for the exact production file list and naming.

---

## Auth + Cloud Sync (Supabase)

The app uses Supabase Auth for identity, a `profiles` table for profile data, and a `user_rounds` table for append-only round sync.

> **Nothing auth/cloud-related works until you complete *both* the Supabase setup *and* the host env vars below.**

### 1. Supabase project setup

1. Create a project at [supabase.com](https://supabase.com) (or use an existing one).
2. **Redirect URLs** — in the Supabase Dashboard go to **Authentication → URL Configuration** and add every URL the app will be served from:
   - `http://localhost:5173` (local dev)
   - `https://<your-vercel-app>.vercel.app` (production)
   - Any custom domain you point at the deployment
   
   Without these entries magic-link emails will fail silently or redirect to an error page.
3. **Database tables** — open the SQL Editor and run, in order:
   - `supabase/profiles.sql`
   - `supabase/user_rounds.sql`
   
   This creates:
   - `public.profiles` keyed by `auth.users.id`
   - `public.user_rounds` for append-only per-user round writes (idempotent via `client_round_id`)
   - automatic `updated_at` trigger on profiles
   - row-level security policies so users can only access/insert their own rows

### 2. Host environment variables

Set these wherever the app is deployed **and** in `.env.local` for local dev:

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` `public` key |

**Vercel:** Project Settings → Environment Variables (set for Production + Preview + Development).

If either variable is missing the app still runs — auth UI is hidden and round sync is skipped.

### Auth flow (v1)
- Magic-link sign in via email
- Persistent session across reloads (Supabase client session storage)
- Sign out from the start screen account panel
- Profile onboarding if no `profiles` row exists yet

### Round sync (v1)
- Local stats are always written first (primary UX)
- If authenticated, a fire-and-forget insert to `user_rounds` happens after local write
- Idempotent via `client_round_id` unique constraint — safe to retry
- No cloud-read or merge path yet

---

## Conversion Analytics

Landing/first-run conversion instrumentation, experiment variants (A/B/C), and metric comparison instructions are documented in [`docs/conversion-analysis.md`](docs/conversion-analysis.md).

---

## Contributing

Run `npm run verify` before pushing. The CI pipeline enforces the same checks and will block deployment if any step fails.
