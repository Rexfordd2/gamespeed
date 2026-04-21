# GameSpeed Asset Pack

This directory is production-facing and organized by media type so assets can be replaced without changing code.

## Folder layout

```text
assets/
  icons/
    target-primate.svg
  backgrounds/
    overlays/
      canopy-top.svg
      canopy-left.svg
      canopy-right.svg
      canopy-bottom.svg
  audio/
    music/
      rainforest-loop.mp3
    effects/
      target-hit.mp3
      target-miss.mp3
      round-complete.mp3
  ui/
    hud-vignette.svg
```

## Required files for premium release

- `audio/music/rainforest-loop.mp3` (loopable ambience, ~60-120s)
- `audio/effects/target-hit.mp3` (tight positive feedback, <180ms)
- `audio/effects/target-miss.mp3` (subtle negative cue, <220ms)
- `audio/effects/round-complete.mp3` (short completion signature, <400ms)

## Audio cue channels

- `music`: long-form loops/atmosphere (stored in `audio/music/`)
- `gameplay`: immediate hit/miss/round success cues (stored in `audio/effects/`)
- `training`: reaction/anticipation/countdown/directional timing cues (stored in `audio/effects/`)
- `mode`: per-mode sensory cues (Swipe Strike / Hold Track / Sequence Memory) in `audio/effects/`
- `ui`: menu/system confirmation cues in `audio/effects/`

Recommended filename prefixes in `audio/effects/`:

- `training-*` for training cues (`training-countdown-3.mp3`, `training-ready-go.mp3`)
- `<mode>-*` for mode cues (`swipe-direction-left.mp3`, `sequence-step-correct.mp3`)
- `ui-*` or `system-*` for UI/system cues

This keeps the runtime cue registry explicit and lets new sensory game modes add assets without breaking existing file contracts.

Detailed production target specs live in `audio/SPEC.md`.

The current SVG files are intentional fallback visuals that keep the experience polished if premium art has not been dropped in yet.

## Path safety

All runtime paths are built from `import.meta.env.BASE_URL`, so the same assets work in:

- local dev (`/`)
- Vercel production (`/`)
