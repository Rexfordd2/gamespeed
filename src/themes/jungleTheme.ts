export const jungleTheme = {
  name: 'Jungle',
  backgroundColor: '#14532d',
  targetColor: '#facc15',
  textColor: '#ffffff',
  icon: {
    type: 'emoji',
    path: '🌿',
  },
  background: {
    gradient: 'bg-gradient-to-br from-[#14532d] to-[#022c22]',
    overlay: {
      top: '/assets/images/jungle-top.png',
      left: '/assets/images/jungle-left.png',
      right: '/assets/images/jungle-right.png',
      bottom: '/assets/images/jungle-bottom.png',
    },
  },
  audio: {
    background: '/assets/audio/jungle-ambient.mp3',
    effects: {
      hit: '/assets/audio/hawk-screech.mp3',
      miss: '/assets/audio/vine-snap.mp3',
      success: '/assets/audio/growl.mp3',
    },
  },
}; 