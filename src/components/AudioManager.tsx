import { createContext, useContext, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { JungleThemeConfig } from '../types/theme';

interface AudioContextType {
  playEffect: (effect: 'hit' | 'miss' | 'success') => void;
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioManager = () => {
  const { theme } = useTheme();
  const jungleTheme = theme as JungleThemeConfig;
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const effectsRef = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    // Create audio elements
    backgroundMusicRef.current = new Audio(jungleTheme.audio.background);
    backgroundMusicRef.current.loop = true;
    backgroundMusicRef.current.volume = 0.3;

    effectsRef.current = {
      hit: new Audio(jungleTheme.audio.effects.hit),
      miss: new Audio(jungleTheme.audio.effects.miss),
      success: new Audio(jungleTheme.audio.effects.success)
    };

    // Start background music
    startBackgroundMusic();

    return () => {
      stopBackgroundMusic();
      Object.values(effectsRef.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, [jungleTheme]);

  const playEffect = (effect: 'hit' | 'miss' | 'success') => {
    const audio = effectsRef.current[effect];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(console.error);
    }
  };

  const startBackgroundMusic = () => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.play().catch(console.error);
    }
  };

  const stopBackgroundMusic = () => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }
  };

  return (
    <AudioContext.Provider value={{ playEffect, startBackgroundMusic, stopBackgroundMusic }}>
      {null}
    </AudioContext.Provider>
  );
}; 