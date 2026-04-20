# Landing Rebuild: GameSpeed Homepage

## Objective

Rebuild the landing page into a conversion-focused homepage for two core audiences:

- Athletes
- Gamers

The redesign keeps the jungle aesthetic as flavor while shifting the message toward performance outcomes:

- Reaction speed
- Peripheral awareness
- Decision speed

## Implementation Structure

Homepage orchestration lives in `src/components/StartScreen.tsx`, which now composes modular landing sections:

1. `LandingHero`
2. `LandingDemoShell`
3. `LandingWhyItMatters`
4. Training section with `AuthPanel` + `GameModeSelector`
5. `LandingSocialProof`
6. `LandingProgression`
7. `LandingFaq`
8. `LandingFinalCta`

Supporting content source:

- `src/content/landingContent.ts`

This file centralizes all homepage copy and section data to make messaging iteration fast without reworking component logic.

## Conversion Logic

## 1) First-screen clarity and intent

- Hero headline and supporting text position GameSpeed as a performance platform, not a generic warm-up.
- Persona toggle (`Athlete` / `Gamer`) customizes the value narrative without changing core product framing.
- Primary CTA uses specific action language: `Run the 60-Second Test`.

## 2) Specific CTA and reduced friction

- Primary CTA routes directly to `reactionBenchmark` via existing `onStart` game flow.
- Secondary CTA `Watch Demo` scrolls to an interactive first-run shell that explains exactly how a session works.
- Demo shell includes a fast action path (`Run Benchmark Now`) for visitors ready to start immediately.

## 3) Persona relevance paths

- The `LandingWhyItMatters` section is persona-adaptive and switches content based on the hero toggle.
- Athlete and gamer cards each map to concrete performance outcomes in their context.

## 4) Trust and benchmark framing

- `LandingSocialProof` combines benchmark framing, structured proof stats, and testimonials.
- Messaging teaches users to compare trend lines over time, guiding realistic expectations and sustained use.
- `AuthPanel` remains integrated in the training section so account creation feels tied to saving progress.

## 5) Retention and progression hooks

- `LandingProgression` introduces streak, leaderboard, and milestone loops.
- Final CTA repeats the benchmark action while offering a stats path for returning users.

## Styling and UX Notes

- Mobile-first layout with stacked cards and large touch targets.
- Premium dark UI with neon/jungle accents through the existing theme system.
- Jungle visuals remain present through `JungleBackground`, but copy hierarchy is now performance-first.
- Existing game stack, mode system, and start flow are reused to avoid unnecessary dependencies or regressions.
