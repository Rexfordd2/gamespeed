import { JungleThemeConfig } from '../types/theme';
import { jungleAssetManifest, jungleVisualFallbacks } from './assetManifest';

// import.meta.env.BASE_URL resolves to the `base` value set in vite.config.ts
// ('/gamespeed/' for GitHub Pages, '/' for a root domain deployment).
// Using it here ensures asset URLs are always correct regardless of hosting target.
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
    // Mode-specific cues (Swipe Strike, Hold Track, Sequence Memory) can live here.
    mode: {},
    // Menu/system interaction cues can be added here.
    ui: {},
  },
};
