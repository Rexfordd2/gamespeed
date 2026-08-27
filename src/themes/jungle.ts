import { JungleThemeConfig } from '../types/theme';
import { jungleAssetManifest, jungleVisualFallbacks } from './assetManifest';

// import.meta.env.BASE_URL resolves to the `base` value set in vite.config.ts.
// For production this is `/` on Vercel root-domain deployments.
// Using it here keeps asset URLs consistent with the configured build base.
export const jungleTheme: JungleThemeConfig = {
  name: 'jungle',
  backgroundColor: '#06120F',
  targetColor: '#52F28C',
  textColor: '#EAE9DF',
  icon: {
    type: 'image',
    path: jungleAssetManifest.icons.target,
    fallbackPath: jungleAssetManifest.icons.targetFallback ?? jungleVisualFallbacks.icon.target,
  },
  background: {
    gradient: 'bg-gradient-to-b from-[#020806] via-[#06120F] to-[#0B2118]',
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
        src: jungleAssetManifest.audio.music.backgroundLoop.src,
        fallbackSrc: jungleAssetManifest.audio.music.backgroundLoop.fallbackSrc,
        loop: true,
        volume: 0.25,
      },
    },
    gameplay: {
      hit: {
        src: jungleAssetManifest.audio.gameplay.hit.src,
        fallbackSrc: jungleAssetManifest.audio.gameplay.hit.fallbackSrc,
        fallbackEffect: 'hit',
      },
      miss: {
        src: jungleAssetManifest.audio.gameplay.miss.src,
        fallbackSrc: jungleAssetManifest.audio.gameplay.miss.fallbackSrc,
        fallbackEffect: 'miss',
      },
      success: {
        src: jungleAssetManifest.audio.gameplay.success.src,
        fallbackSrc: jungleAssetManifest.audio.gameplay.success.fallbackSrc,
        fallbackEffect: 'success',
      },
    },
    // Anticipation/countdown/reaction timing cues can be added here.
    training: {},
    mode: {
      'swipe-left': {
        src: jungleAssetManifest.audio.mode.swipeLeft.src,
        fallbackSrc: jungleAssetManifest.audio.mode.swipeLeft.fallbackSrc,
        fallbackEffect: 'hit',
      },
      'swipe-right': {
        src: jungleAssetManifest.audio.mode.swipeRight.src,
        fallbackSrc: jungleAssetManifest.audio.mode.swipeRight.fallbackSrc,
        fallbackEffect: 'hit',
      },
      'swipe-up': {
        src: jungleAssetManifest.audio.mode.swipeUp.src,
        fallbackSrc: jungleAssetManifest.audio.mode.swipeUp.fallbackSrc,
        fallbackEffect: 'hit',
      },
      'swipe-down': {
        src: jungleAssetManifest.audio.mode.swipeDown.src,
        fallbackSrc: jungleAssetManifest.audio.mode.swipeDown.fallbackSrc,
        fallbackEffect: 'hit',
      },
      'hold-lock': {
        src: jungleAssetManifest.audio.mode.holdLock.src,
        fallbackSrc: jungleAssetManifest.audio.mode.holdLock.fallbackSrc,
        fallbackEffect: 'growl',
      },
      'sequence-preview': {
        src: jungleAssetManifest.audio.mode.sequencePreview.src,
        fallbackSrc: jungleAssetManifest.audio.mode.sequencePreview.fallbackSrc,
        fallbackEffect: 'hiss',
      },
      'sequence-input': {
        src: jungleAssetManifest.audio.mode.sequenceInput.src,
        fallbackSrc: jungleAssetManifest.audio.mode.sequenceInput.fallbackSrc,
        fallbackEffect: 'hiss',
      },
      'sequence-success': {
        src: jungleAssetManifest.audio.mode.sequenceSuccess.src,
        fallbackSrc: jungleAssetManifest.audio.mode.sequenceSuccess.fallbackSrc,
        fallbackEffect: 'success',
      },
      'sequence-fail': {
        src: jungleAssetManifest.audio.mode.sequenceFail.src,
        fallbackSrc: jungleAssetManifest.audio.mode.sequenceFail.fallbackSrc,
        fallbackEffect: 'miss',
      },
      'instinct-hiss': {
        src: jungleAssetManifest.audio.mode.instinctHiss.src,
        fallbackSrc: jungleAssetManifest.audio.mode.instinctHiss.fallbackSrc,
        fallbackEffect: 'hiss',
      },
      'instinct-growl': {
        src: jungleAssetManifest.audio.mode.instinctGrowl.src,
        fallbackSrc: jungleAssetManifest.audio.mode.instinctGrowl.fallbackSrc,
        fallbackEffect: 'growl',
      },
      'instinct-water': {
        src: jungleAssetManifest.audio.mode.instinctWater.src,
        fallbackSrc: jungleAssetManifest.audio.mode.instinctWater.fallbackSrc,
        fallbackEffect: 'waterThud',
      },
    },
    // Menu/system interaction cues can be added here.
    ui: {},
  },
};
