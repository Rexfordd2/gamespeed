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

The current SVG files are intentional fallback visuals that keep the experience polished if premium art has not been dropped in yet.

## Path safety

All runtime paths are built from `import.meta.env.BASE_URL`, so the same assets work in:

- local dev (`/`)
- GitHub Pages (`/gamespeed/`)
