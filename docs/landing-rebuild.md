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

Homepage orchestration lives in `src/components/StartScreen.tsx`, which composes:

1. Top section, one of:
   - `start/FirstRunQuickstart`: explanation, Athlete/Gamer persona, one goal choice, "Run 60-second baseline". Nothing else sits above the first benchmark.
   - `start/ReturningSummary`: GameSpeed Score, recommended session, one Start CTA.
2. Night-before low-stimulation option (when the guardrail window is active)
3. Returning-athlete progress details
4. `GameModeSelector` (Choose Your Instinct)
5. `start/MoreSettings`: sport pack, night-before guardrail, cue intensity, haptics. Collapsed on first run, open for returning athletes.
6. Sleep check-in and leaderboard (after first completion only)
7. `LandingDemoShell`, `LandingWhyItMatters`, `LandingProgression`, `LandingFaq`, `LandingFinalCta`

The account prompt ("Save my progress") appears on the result screen after the first session, not on the homepage.

Supporting content source:

- `src/content/landingContent.ts`

This file centralizes all homepage copy and section data to make messaging iteration fast without reworking component logic.

## Conversion Logic

## 1) First-screen clarity and intent

- First-run headline: "Measure how quickly you see, decide and react."
- Persona toggle (`Athlete` / `Gamer`) customizes the goal list and the value narrative below the fold.
- Primary CTA uses specific action language: `Run 60-second baseline`.

## 2) Specific CTA and reduced friction

- At most two decisions (persona when the experiment variant doesn't preselect one, then goal) before the benchmark starts.
- Primary CTA routes directly to `reactionBenchmark` via existing `onStart` game flow.
- Below-the-fold CTAs (demo shell, final CTA) scroll back to the first-run section instead of starting a different flow.

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
