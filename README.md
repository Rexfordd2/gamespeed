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

**Host:** GitHub Pages  
**Trigger:** Push to `master` branch  
**Workflow:** `.github/workflows/deploy.yml`  
**Base path:** `/gamespeed/` for production builds (GitHub Pages)

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

## Launch Scope

This version is a **client-side-only browser game**. The following are explicitly **out of scope** for the current release:

- User authentication / accounts
- Database / leaderboard backend
- Payment / subscription
- Analytics / event tracking

When any of these are added, document the required environment variables in `.env.example`.

---

## Contributing

Run `npm run verify` before pushing. The CI pipeline enforces the same checks and will block deployment if any step fails.
