import { JungleThemeConfig } from '../types/theme';
import { jungleAssetManifest, jungleVisualFallbacks } from './assetManifest';

// import.meta.env.BASE_URL resolves to the `base` value set in vite.config.ts.
// For production this is `/` on Vercel root-domain deployments.
// Using it here keeps asset URLs consistent with the configured build base.
export const jungleTheme: JungleThemeConfig = {
  name: 'jungle',
  backgroundColor: '#06120f',
  targetColor: '#4ade80',
  textColor: '#ffffff',
  icon: {
    type: 'image',
    path: jungleAssetManifest.icons.target,
    fallbackPath: jungleVisualFallbacks.icon.target,
  },
  background: {
    gradient: 'bg-gradient-to-b from-[#06120f] via-[#0b2d1f] to-[#03100c]',
    overlay: {
      top: jungleAssetManifest.backgrounds.overlays.top,
      left: jungleAssetManifest.backgrounds.overlays.left,
      right: jungleAssetManifest.backgrounds.overlays.right,
      bottom: jungleAssetManifest.backgrounds.overlays.bottom,
    },
  },
  audio: {
    music: {
      backgroundLoop: {
        src: jungleAssetManifest.audio.music.rainforestLoop,
        loop: true,
        volume: 0.25,
      },
    },
    gameplay: {
      hit: {
        src: jungleAssetManifest.audio.gameplay.targetHit,
        fallbackEffect: 'hit',
      },
      miss: {
        src: jungleAssetManifest.audio.gameplay.targetMiss,
        fallbackEffect: 'miss',
      },
      success: {
        src: jungleAssetManifest.audio.gameplay.roundComplete,
        fallbackEffect: 'success',
      },
    },
    // Anticipation/countdown/reaction timing cues can be added here.
    training: {},
    mode: {
      'swipe-left': {
        src: jungleAssetManifest.audio.mode.swipeLeft,
        fallbackEffect: 'hit',
      },
      'swipe-right': {
        src: jungleAssetManifest.audio.mode.swipeRight,
        fallbackEffect: 'hit',
      },
      'swipe-up': {
        src: jungleAssetManifest.audio.mode.swipeUp,
        fallbackEffect: 'hit',
      },
      'swipe-down': {
        src: jungleAssetManifest.audio.mode.swipeDown,
        fallbackEffect: 'hit',
      },
      'hold-lock': {
        src: jungleAssetManifest.audio.mode.holdLock,
        fallbackEffect: 'hit',
      },
      'sequence-preview': {
        src: jungleAssetManifest.audio.mode.sequencePreview,
        fallbackEffect: 'hit',
      },
      'sequence-input': {
        src: jungleAssetManifest.audio.mode.sequenceInput,
        fallbackEffect: 'hit',
      },
      'sequence-success': {
        src: jungleAssetManifest.audio.mode.sequenceSuccess,
        fallbackEffect: 'success',
      },
      'sequence-fail': {
        src: jungleAssetManifest.audio.mode.sequenceFail,
        fallbackEffect: 'miss',
      },
    },
    // Menu/system interaction cues can be added here.
    ui: {},
  },
};
