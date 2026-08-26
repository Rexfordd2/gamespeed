# GameSpeed Contractor Asset Pack

This folder is now organized around **contractor drop-zones** so icon/skin/audio deliveries can be added without hand-editing many source files.

## Single source of truth

All runtime and validator references come from:

- `public/assets/asset-map.json`

If you are adding a new sport, mode, or cue file, update this map once and run:

- `npm run validate-assets`

## Standardized folder structure

```text
assets/
  asset-map.json
  sport-icons/        # sport picker / sport branding icons
  mode-icons/         # drill cards
  target-skins/       # in-game target visual skins
  hud-badges/         # protocol/score/streak badge art
  audio-cues/
    music/
    gameplay/
    training/
    mode/
    ui/

  # Backward-compatible legacy fallbacks
  icons/
  backgrounds/overlays/
  audio/music/
  audio/effects/
  ui/
```

## Naming rules

- Lowercase kebab-case only.
- Allowed filename pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*\.(svg|png|webp|mp3|wav|ogg)$`
- Use semantic names, not tool/export names (for example `quick-tap.svg`, not `icon-final-v7.svg`).

## Supported formats

- Visuals (`sport-icons`, `mode-icons`, `target-skins`, `hud-badges`): `svg`, `png`, `webp`
- Audio (`audio-cues/*`): `mp3`, `wav`, `ogg`

## Required dimensions

- Sport icons: `256x256`
- Mode icons: `256x256`
- Target skins: `256x256`
- HUD badges: `128x40`
- Overlay / vignette legacy shared visuals:
  - `canopy-top`, `canopy-bottom`: `1920x256`
  - `canopy-left`, `canopy-right`: `256x1920`
  - `hud-vignette`: `1920x1080`

## Fallback rules

- Runtime attempts standardized `audio-cues/*` first, then falls back to legacy `audio/music` and `audio/effects`.
- Target skins resolve via `target-skins/*`, then fallback to `icons/target-primate.svg`, then final in-app SVG fallback.
- Mode icons resolve via `mode-icons/*`, then fallback to existing glyph icons.
- Missing audio still degrades safely to synthesized fallback effects.

Detailed cue production specs remain in `audio/SPEC.md`.
