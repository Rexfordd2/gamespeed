import { JungleThemeConfig } from '../types/theme';

export const jungleTheme: JungleThemeConfig = {
  name: 'jungle',
  backgroundColor: '#1a472a',
  targetColor: '#4ade80',
  textColor: '#ffffff',
  icon: {
    type: 'image',
    path: '/assets/monkey.png'
  },
  background: {
    gradient: 'bg-gradient-to-b from-green-900 to-green-800',
    overlay: {
      top: '/assets/jungle-top.png',
      left: '/assets/jungle-left.png',
      right: '/assets/jungle-right.png',
      bottom: '/assets/jungle-bottom.png'
    }
  },
  audio: {
    background: '/assets/jungle-music.mp3',
    effects: {
      hit: '/assets/hit.mp3',
      miss: '/assets/miss.mp3',
      success: '/assets/success.mp3'
    }
  }
}; 