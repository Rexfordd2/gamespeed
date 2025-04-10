import { ThemeConfig } from '../types/theme';

export const jungleTheme: ThemeConfig = {
  id: 'jungle',
  name: 'Jungle Reflex',
  description: 'Test your reflexes in the heart of the jungle!',
  background: {
    type: 'color',
    value: 'bg-green-800',
  },
  targets: [
    {
      id: 'cheetah',
      name: 'Cheetah',
      color: 'bg-orange-500',
      icon: {
        type: 'image',
        path: '/assets/themes/jungle/cheetah.png',
        name: 'cheetah-icon',
      },
      sound: {
        type: 'sound',
        path: '/assets/themes/jungle/cheetah.mp3',
        name: 'cheetah-sound',
      },
    },
    {
      id: 'hawk',
      name: 'Hawk',
      color: 'bg-brown-500',
      icon: {
        type: 'image',
        path: '/assets/themes/jungle/hawk.png',
        name: 'hawk-icon',
      },
      sound: {
        type: 'sound',
        path: '/assets/themes/jungle/hawk.mp3',
        name: 'hawk-sound',
      },
    },
    {
      id: 'cobra',
      name: 'Cobra',
      color: 'bg-green-500',
      icon: {
        type: 'image',
        path: '/assets/themes/jungle/cobra.png',
        name: 'cobra-icon',
      },
      sound: {
        type: 'sound',
        path: '/assets/themes/jungle/cobra.mp3',
        name: 'cobra-sound',
      },
    },
  ],
  sounds: {
    click: {
      type: 'sound',
      path: '/assets/themes/jungle/click.mp3',
      name: 'click-sound',
    },
    timeout: {
      type: 'sound',
      path: '/assets/themes/jungle/timeout.mp3',
      name: 'timeout-sound',
    },
    gameOver: {
      type: 'sound',
      path: '/assets/themes/jungle/game-over.mp3',
      name: 'game-over-sound',
    },
  },
}; 