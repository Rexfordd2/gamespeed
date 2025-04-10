import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export const AudioManager: React.FC = () => {
  const { theme } = useTheme();
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const effectsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    // Initialize background audio
    if ('audio' in theme) {
      backgroundAudioRef.current = new Audio(theme.audio.background);
      backgroundAudioRef.current.loop = true;
      backgroundAudioRef.current.volume = 0.3;

      // Initialize sound effects
      Object.entries(theme.audio.effects).forEach(([key, path]) => {
        effectsRef.current[key] = new Audio(path);
        effectsRef.current[key].volume = 0.5;
      });
    }

    return () => {
      // Cleanup audio elements
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
      Object.values(effectsRef.current).forEach(audio => {
        audio.pause();
      });
      effectsRef.current = {};
    };
  }, [theme]);

  const playEffect = (effect: 'hit' | 'miss' | 'success') => {
    if ('audio' in theme && effectsRef.current[effect]) {
      effectsRef.current[effect].currentTime = 0;
      effectsRef.current[effect].play();
    }
  };

  const startBackgroundMusic = () => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.play();
    }
  };

  const stopBackgroundMusic = () => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
    }
  };

  return null;
}; 