# Asset Pipeline (Contractor Delivery)

GameSpeed supports contractor-delivered packs through a centralized manifest and validator.

## Workflow

1. Drop files into standardized folders under `public/assets/`.
2. Update `public/assets/asset-map.json` once for new IDs/references.
3. Run `npm run validate-assets`.
4. Run `npm run test`.

## Standard folders

- `public/assets/sport-icons/`
- `public/assets/mode-icons/`
- `public/assets/target-skins/`
- `public/assets/hud-badges/`
- `public/assets/audio-cues/music/`
- `public/assets/audio-cues/gameplay/`
- `public/assets/audio-cues/training/`
- `public/assets/audio-cues/mode/`
- `public/assets/audio-cues/ui/`

Legacy folders remain supported for fallback compatibility:

- `public/assets/icons/`
- `public/assets/audio/music/`
- `public/assets/audio/effects/`
- `public/assets/backgrounds/overlays/`
- `public/assets/ui/`

## Naming rules

- Lowercase kebab-case only.
- Pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*\.(svg|png|webp|mp3|wav|ogg)$`
- IDs in `asset-map.json` should also be kebab-case.

## Supported formats

- Visual categories: `svg`, `png`, `webp`
- Audio categories: `mp3`, `wav`, `ogg`

## Required dimensions

- Sport icons: `256x256`
- Mode icons: `256x256`
- Target skins: `256x256`
- HUD badges: `128x40`
- Legacy shared visuals:
  - Canopy top/bottom: `1920x256`
  - Canopy left/right: `256x1920`
  - HUD vignette: `1920x1080`

## Fallback behavior

- **Mode icons**: `mode-icons/*` -> glyph fallback.
- **Target skins**: `target-skins/*` -> `icons/target-primate.svg` -> embedded SVG fallback.
- **Audio cues**: `audio-cues/*` -> legacy file path -> synthesized effect fallback.
- **Shared visuals**: loaded from map with stable fallback IDs.

## Validator checks

`npm run validate-assets` verifies:

- missing required assets
- duplicate asset IDs (per group)
- unsupported file names/formats in managed folders
- missing sport/mode references in `asset-map.json`

The validator exits non-zero on errors and reports warnings for extra unmapped files.
