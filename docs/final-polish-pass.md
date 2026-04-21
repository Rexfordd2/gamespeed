# Final Polish Pass (Public Build)

## What changed

- Completed a mobile-first UI/UX refinement pass across start, gameplay, results, and stats surfaces.
- Added a dedicated benchmark methodology route at `/benchmark` and moved heavy trust/validation content off the homepage.
- Updated Sequence Memory so numbered circles are only visible during preview; numbers are hidden during repeat/input.
- Added universal streak-based pace scaling for all timing-sensitive modes through one centralized utility.
- Added/updated tests for streak scaling, sequence input visuals, and benchmark page routing.

## Why

- Improve real-world usability on small screens without losing desktop polish.
- Keep the homepage conversion-focused and uncluttered.
- Increase challenge depth for high-performing users with consistent, maintainable difficulty ramping.
- Align Sequence Memory with true recall behavior (memory-first repeat phase).

## Files affected

- `src/App.tsx`
- `src/components/StartScreen.tsx`
- `src/components/Game.tsx`
- `src/components/GameHeader.tsx`
- `src/components/EndScreen.tsx`
- `src/components/StatsScreen.tsx`
- `src/components/BenchmarkPage.tsx` (new)
- `src/components/GameModeSelector.tsx`
- `src/components/landing/LandingHero.tsx`
- `src/components/landing/LandingDemoShell.tsx`
- `src/components/landing/LandingWhyItMatters.tsx`
- `src/components/landing/LandingFaq.tsx`
- `src/components/landing/LandingProgression.tsx`
- `src/components/landing/LandingFinalCta.tsx`
- `src/utils/streakScaling.ts` (new)
- `src/tests/streakScaling.test.ts` (new)
- `src/tests/appFlow.integration.test.tsx`

## Streak scaling caps and exceptions

- Centralized helper: `src/utils/streakScaling.ts`.
- Rule implementation:
  - Streak `<= 15`: baseline pace (`1x`).
  - Streak `16+`: multiplier compounds by `1.2x` each increment.
- Cap constant:
  - `STREAK_SPEED_MAX_MULTIPLIER = 6` (conservative playability guard).
- Applied to:
  - Spawn interval pacing for non-sequence modes.
  - Target lifespan pacing for non-sequence modes.
  - Sequence Memory preview-step pace and feedback transition pace.
- Mode-specific timing note:
  - Hold Track `hold.requiredMs` is unchanged; only prompt pace changes.

## Mobile-specific UX decisions

- Reduced vertical spacing/padding on mobile to keep primary content above the fold.
- Increased thumb-target reliability with consistent minimum button heights on critical CTAs.
- Tightened card layouts and stacking behavior for drill cards, result cards, and stats cards.
- Improved gameplay header compactness and tap affordances on small screens.
- Kept semantic controls/buttons and existing keyboard interactions intact.
