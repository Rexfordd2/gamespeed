export interface ThemeAsset {
  type: 'image' | 'sound';
  path: string;
  name: string;
}

export interface ThemeTarget {
  id: string;
  name: string;
  color: string;
  icon: ThemeAsset;
  sound: ThemeAsset;
}

export interface ThemeBackground {
  gradient: string;
  overlay: {
    top: string;
    left: string;
    right: string;
    bottom: string;
  };
}

export interface ThemeAudio {
  music: ThemeAudioCueMap & {
    backgroundLoop: ThemeAudioCue;
  };
  gameplay: ThemeAudioCueMap & {
    hit: ThemeAudioCue;
    miss: ThemeAudioCue;
    success: ThemeAudioCue;
  };
  training: ThemeAudioCueMap;
  mode: ThemeAudioCueMap;
  ui: ThemeAudioCueMap;
}

export type ThemeAudioFallbackEffect = 'hit' | 'miss' | 'success';

export interface ThemeAudioCue {
  src: string;
  loop?: boolean;
  volume?: number;
  fallbackEffect?: ThemeAudioFallbackEffect;
}

export type ThemeAudioCueMap = Record<string, ThemeAudioCue>;

export interface BaseThemeConfig {
  name: string;
  backgroundColor: string;
  targetColor: string;
  textColor: string;
  icon: {
    type: 'image' | 'emoji';
    path: string;
    fallbackPath?: string;
  };
}

export interface JungleThemeConfig extends BaseThemeConfig {
  background: {
    gradient: string;
    overlay: {
      top: string;
      left: string;
      right: string;
      bottom: string;
    };
  };
  audio: ThemeAudio;
}

export type ThemeConfig = BaseThemeConfig | JungleThemeConfig;