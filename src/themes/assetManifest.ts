import {
  resolveAudioCueAsset,
  resolveSharedVisualPath,
  resolveTargetSkinFallbackPath,
  resolveTargetSkinPath,
} from '../config/assetRegistry';

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

export const jungleAssetManifest = {
  icons: {
    target: resolveTargetSkinPath('soccer'),
    targetFallback: resolveTargetSkinFallbackPath('soccer'),
  },
  backgrounds: {
    overlays: {
      top: resolveSharedVisualPath('canopy-top', 'backgrounds/overlays/canopy-top.svg'),
      left: resolveSharedVisualPath('canopy-left', 'backgrounds/overlays/canopy-left.svg'),
      right: resolveSharedVisualPath('canopy-right', 'backgrounds/overlays/canopy-right.svg'),
      bottom: resolveSharedVisualPath('canopy-bottom', 'backgrounds/overlays/canopy-bottom.svg'),
    },
  },
  audio: {
    music: {
      backgroundLoop: resolveAudioCueAsset('music', 'backgroundLoop'),
    },
    gameplay: {
      hit: resolveAudioCueAsset('gameplay', 'hit'),
      miss: resolveAudioCueAsset('gameplay', 'miss'),
      success: resolveAudioCueAsset('gameplay', 'success'),
    },
    training: {},
    mode: {
      swipeLeft: resolveAudioCueAsset('mode', 'swipe-left'),
      swipeRight: resolveAudioCueAsset('mode', 'swipe-right'),
      swipeUp: resolveAudioCueAsset('mode', 'swipe-up'),
      swipeDown: resolveAudioCueAsset('mode', 'swipe-down'),
      holdLock: resolveAudioCueAsset('mode', 'hold-lock'),
      sequencePreview: resolveAudioCueAsset('mode', 'sequence-preview'),
      sequenceInput: resolveAudioCueAsset('mode', 'sequence-input'),
      sequenceSuccess: resolveAudioCueAsset('mode', 'sequence-success'),
      sequenceFail: resolveAudioCueAsset('mode', 'sequence-fail'),
    },
    ui: {},
  },
  ui: {
    vignetteMask: resolveSharedVisualPath('hud-vignette', 'ui/hud-vignette.svg'),
  },
} as const;

export const jungleVisualFallbacks = {
  icon: {
    target: svgToDataUri(targetIconFallbackSvg),
  },
  overlays: {
    top: 'linear-gradient(180deg, rgba(2, 14, 11, 0.88) 0%, rgba(8, 56, 35, 0.34) 58%, rgba(0, 0, 0, 0) 100%)',
    left: 'linear-gradient(90deg, rgba(2, 14, 11, 0.86) 0%, rgba(8, 56, 35, 0.28) 58%, rgba(0, 0, 0, 0) 100%)',
    right: 'linear-gradient(270deg, rgba(2, 14, 11, 0.86) 0%, rgba(8, 56, 35, 0.28) 58%, rgba(0, 0, 0, 0) 100%)',
    bottom: 'linear-gradient(0deg, rgba(2, 14, 11, 0.9) 0%, rgba(8, 56, 35, 0.32) 54%, rgba(0, 0, 0, 0) 100%)',
  },
} as const;
