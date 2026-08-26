# Sport Pack Asset System

Sport presentation is config-first in `src/config/sportPacks.ts`.

Each `SportPack` defines:

- `id`
- `displayName`
- `accentTokens`
- `iconSet` (sport icon and target skin references)
- `hudLabels`
- `cueVocabulary`
- `introCopy` and `howToCopy`
- optional `audioCueMap`

Runtime resolution happens in:

- `src/config/sportPacks.ts` (`getSportPackAssets`)
- `src/config/assetRegistry.ts` (safe asset lookups + fallbacks)

## Add A New Sport Pack

1. Add the new sport key to `SportType` in `src/config/sports.ts`.
2. Add manifest references in `public/assets/asset-map.json`:
   - `references.sportToSportIcon`
   - `references.sportToTargetSkin`
   - optional cue assets under `groups.audioCues`
3. Add a `baseSportPack(...)` entry in `src/config/sportPacks.ts` with sport-specific copy and vocabulary.
4. If needed, override `iconSet.sport.assetId` or `iconSet.targetSkin.assetId` in that pack.
5. Add the sport to `SPORT_ORDER` in `src/config/sports.ts`.
6. Run quality gates:
   - `npm run validate-assets`
   - `npm run verify`

## Fallback Rules

- Missing sport icon -> sport icon fallback path -> default shared icon.
- Missing target skin -> target fallback path -> default shared icon.
- Missing runtime image file in UI -> second image fallback -> built-in glyph (`◉`).

This keeps all sport packs render-safe even with incomplete contractor asset drops.
