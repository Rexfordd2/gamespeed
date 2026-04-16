import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useTheme } from '../context/ThemeContext';
import { JungleThemeConfig } from '../types/theme';
import { FallbackEffect, playFallbackEffect } from '../utils/audioFallback';

interface AudioContextType {
  playEffect: (effect: 'hit' | 'miss' | 'success') => void;
  ensureAudioReady: () => Promise<void>;
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
  isMuted: boolean;
  isReady: boolean;
  toggleMute: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioManager');
  return ctx;
};

interface AudioManagerProps {
  children: ReactNode;
}

export const AudioManager = ({ children }: AudioManagerProps) => {
  const { theme } = useTheme();
  const jungleTheme = theme as JungleThemeConfig;
  const backgroundSource = jungleTheme.audio.background;
  const { hit, miss, success } = jungleTheme.audio.effects;

  const bgRef = useRef<HTMLAudioElement | null>(null);
  const fxRef = useRef<Record<'hit' | 'miss' | 'success', HTMLAudioElement> | null>(null);
  const hasInitializedRef = useRef(false);
  const initializePromiseRef = useRef<Promise<void> | null>(null);
  const shouldPlayBackgroundRef = useRef(false);
  const isMutedRef = useRef(true);
  const backgroundUnavailableRef = useRef(false);
  const unavailableEffectsRef = useRef<Set<FallbackEffect>>(new Set());
  const warnedAssetsRef = useRef<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const warnAssetIssue = useCallback((assetLabel: string, assetPath: string) => {
    if (warnedAssetsRef.current.has(assetPath)) return;
    warnedAssetsRef.current.add(assetPath);
    console.warn(`[assets] ${assetLabel} is unavailable: ${assetPath}`);
  }, []);

  useEffect(() => {
    backgroundUnavailableRef.current = false;
    unavailableEffectsRef.current.clear();

    const backgroundAudio = new Audio(backgroundSource);
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.25;
    backgroundAudio.preload = 'auto';
    backgroundAudio.muted = isMutedRef.current;
    const onBackgroundError = () => {
      backgroundUnavailableRef.current = true;
      warnAssetIssue('Background music', backgroundSource);
    };
    backgroundAudio.addEventListener('error', onBackgroundError);
    bgRef.current = backgroundAudio;

    const effects = {
      hit: new Audio(hit),
      miss: new Audio(miss),
      success: new Audio(success),
    };
    (Object.values(effects) as HTMLAudioElement[]).forEach(audio => {
      audio.preload = 'auto';
      audio.muted = isMutedRef.current;
    });
    const effectErrorHandlers: Array<() => void> = [];
    (Object.entries(effects) as Array<[FallbackEffect, HTMLAudioElement]>).forEach(([effectKey, audio]) => {
      const onError = () => {
        unavailableEffectsRef.current.add(effectKey);
        warnAssetIssue(`Effect "${effectKey}"`, audio.src || audio.currentSrc || effectKey);
      };
      effectErrorHandlers.push(onError);
      audio.addEventListener('error', onError);
    });
    fxRef.current = effects;

    return () => {
      backgroundAudio.removeEventListener('error', onBackgroundError);
      backgroundAudio.pause();
      backgroundAudio.currentTime = 0;
      (Object.values(effects) as HTMLAudioElement[]).forEach((a, index) => {
        a.removeEventListener('error', effectErrorHandlers[index]);
        a.pause();
        a.currentTime = 0;
      });

      if (bgRef.current === backgroundAudio) {
        bgRef.current = null;
      }
      if (fxRef.current === effects) {
        fxRef.current = null;
      }
    };
  }, [backgroundSource, hit, miss, success, warnAssetIssue]);

  const ensureAudioReady = useCallback(async () => {
    if (hasInitializedRef.current) return;
    if (initializePromiseRef.current) return initializePromiseRef.current;

    initializePromiseRef.current = (async () => {
      const bg = bgRef.current;
      if (!bg || backgroundUnavailableRef.current) {
        hasInitializedRef.current = true;
        setIsReady(true);
        return;
      }
      try {
        bg.muted = true;
        await bg.play();
        bg.pause();
        bg.currentTime = 0;
      } catch {
        // Browser may still block this call; keep behavior silent and retry on later interactions.
      } finally {
        bg.muted = isMutedRef.current;
      }

      hasInitializedRef.current = true;
      setIsReady(true);

      if (shouldPlayBackgroundRef.current && !isMutedRef.current) {
        bg.play().catch(() => undefined);
      }
    })();

    try {
      await initializePromiseRef.current;
    } finally {
      initializePromiseRef.current = null;
    }
  }, []);

  const playEffect = useCallback((effect: 'hit' | 'miss' | 'success') => {
    if (!hasInitializedRef.current || isMutedRef.current || !fxRef.current) return;

    if (unavailableEffectsRef.current.has(effect)) {
      playFallbackEffect(effect);
      return;
    }

    const a = fxRef.current[effect];
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {
      unavailableEffectsRef.current.add(effect);
      warnAssetIssue(`Effect "${effect}"`, a.src || a.currentSrc || effect);
      playFallbackEffect(effect);
    });
  }, [warnAssetIssue]);

  const startBackgroundMusic = useCallback(() => {
    shouldPlayBackgroundRef.current = true;
    if (!hasInitializedRef.current || isMutedRef.current || backgroundUnavailableRef.current) return;
    bgRef.current?.play().catch(() => undefined);
  }, []);

  const stopBackgroundMusic = useCallback(() => {
    shouldPlayBackgroundRef.current = false;
    bgRef.current?.pause();
    if (bgRef.current) bgRef.current.currentTime = 0;
  }, []);

  const toggleMute = useCallback(async () => {
    await ensureAudioReady();

    setIsMuted(prev => {
      const nextMuted = !prev;
      isMutedRef.current = nextMuted;

      if (bgRef.current) {
        bgRef.current.muted = nextMuted;
      }
      if (fxRef.current) {
        (Object.values(fxRef.current) as HTMLAudioElement[]).forEach(audio => {
          audio.muted = nextMuted;
        });
      }

      if (nextMuted) {
        bgRef.current?.pause();
      } else if (shouldPlayBackgroundRef.current) {
        bgRef.current?.play().catch(() => undefined);
      }

      return nextMuted;
    });
  }, [ensureAudioReady]);

  const contextValue = useMemo(
    () => ({
      playEffect,
      ensureAudioReady,
      startBackgroundMusic,
      stopBackgroundMusic,
      isMuted,
      isReady,
      toggleMute,
    }),
    [
      ensureAudioReady,
      isMuted,
      isReady,
      playEffect,
      startBackgroundMusic,
      stopBackgroundMusic,
      toggleMute,
    ],
  );

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};
