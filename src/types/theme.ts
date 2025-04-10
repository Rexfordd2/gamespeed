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
  background: string;
  effects: {
    hit: string;
    miss: string;
    success: string;
  };
}

export interface BaseThemeConfig {
  name: string;
  backgroundColor: string;
  targetColor: string;
  textColor: string;
  icon: {
    type: 'emoji' | 'image';
    path: string;
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
  audio: {
    background: string;
    effects: {
      hit: string;
      miss: string;
      success: string;
    };
  };
}

export type ThemeConfig = BaseThemeConfig | JungleThemeConfig; 