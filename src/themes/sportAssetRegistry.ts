import { resolveTargetSkinFallbackPath, resolveTargetSkinPath } from '../config/assetRegistry';

const svgToDataUri = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;

const targetIconFallbackSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <defs>
      <radialGradient id="core" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#9BF2AE" />
        <stop offset="62%" stop-color="#34D399" />
        <stop offset="100%" stop-color="#0F766E" />
      </radialGradient>
      <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#DCFCE7" />
        <stop offset="100%" stop-color="#4ADE80" />
      </linearGradient>
    </defs>
    <circle cx="64" cy="64" r="57" fill="url(#core)" opacity="0.18" />
    <circle cx="64" cy="64" r="42" fill="none" stroke="url(#ring)" stroke-width="10" />
    <circle cx="64" cy="64" r="16" fill="#ECFDF5" />
    <path d="M40 63c4-10 12-16 24-16s20 6 24 16" fill="none" stroke="#052E2B" stroke-width="6" stroke-linecap="round" />
  </svg>
`;

export const SPORT_ASSET_KEYS = {
  targetDefault: 'target.default',
  targetFallback: 'target.fallback',
} as const;

export type SportAssetKey = (typeof SPORT_ASSET_KEYS)[keyof typeof SPORT_ASSET_KEYS];

const sportAssetPathRegistry: Partial<Record<SportAssetKey, string>> = {
  [SPORT_ASSET_KEYS.targetDefault]: resolveTargetSkinPath('soccer'),
  [SPORT_ASSET_KEYS.targetFallback]: resolveTargetSkinFallbackPath('soccer'),
};

const isRegisteredSportAssetKey = (assetKey: SportAssetKey | string) =>
  assetKey in sportAssetPathRegistry || assetKey in sportAssetDataFallbacks;

const sportAssetDataFallbacks: Partial<Record<SportAssetKey, string>> = {
  [SPORT_ASSET_KEYS.targetFallback]: svgToDataUri(targetIconFallbackSvg),
};

export const resolveSportAssetPath = (
  assetKey: SportAssetKey | null | undefined,
  fallbackAssetKey: SportAssetKey = SPORT_ASSET_KEYS.targetFallback,
) => {
  if (assetKey && sportAssetPathRegistry[assetKey]) {
    return sportAssetPathRegistry[assetKey] as string;
  }
  if (assetKey && sportAssetDataFallbacks[assetKey]) {
    return sportAssetDataFallbacks[assetKey];
  }
  if (sportAssetPathRegistry[fallbackAssetKey]) {
    return sportAssetPathRegistry[fallbackAssetKey] as string;
  }
  return sportAssetDataFallbacks[fallbackAssetKey] ?? '';
};

export const isSportAssetKey = (assetKey: string): assetKey is SportAssetKey =>
  isRegisteredSportAssetKey(assetKey);

