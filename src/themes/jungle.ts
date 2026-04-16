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
    background: jungleAssetManifest.audio.music.backgroundLoop,
    effects: {
      hit: jungleAssetManifest.audio.effects.hit,
      miss: jungleAssetManifest.audio.effects.miss,
      success: jungleAssetManifest.audio.effects.success,
    },
  },
};
