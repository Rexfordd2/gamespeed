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
import { JungleThemeConfig, ThemeAudioCue, ThemeAudio } from '../types/theme';
import { playFallbackEffect } from '../utils/audioFallback';

type GameplayEffect = 'hit' | 'miss' | 'success';
type AudioChannel = 'music' | 'gameplay' | 'training' | 'mode' | 'ui';
type TriggerableChannel = Exclude<AudioChannel, 'music'>;
type CueId = `${AudioChannel}:${string}`;

interface AudioContextType {
  playEffect: (effect: GameplayEffect) => void;
  playCue: (channel: TriggerableChannel, cue: string) => void;
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

// Keep v1 behavior explicit while leaving a single place to extend cue trigger routes.
const V1_TRIGGER_MAP = {
  backgroundLoop: { channel: 'music', cue: 'backgroundLoop' },
  effect: {
    hit: { channel: 'gameplay', cue: 'hit' },
    miss: { channel: 'gameplay', cue: 'miss' },
    success: { channel: 'gameplay', cue: 'success' },
  },
} as const;

export const AudioManager = ({ children }: AudioManagerProps) => {
  const { theme } = useTheme();
  const jungleTheme = theme as JungleThemeConfig;
  const audioConfig = jungleTheme.audio;

  const cuesRef = useRef<Map<CueId, HTMLAudioElement>>(new Map());
  const cueConfigsRef = useRef<Map<CueId, ThemeAudioCue>>(new Map());
  const cueLabelsRef = useRef<Map<CueId, string>>(new Map());
  const backgroundCueIdRef = useRef<CueId | null>(null);
  const hasInitializedRef = useRef(false);
  const initializePromiseRef = useRef<Promise<void> | null>(null);
  const shouldPlayBackgroundRef = useRef(false);
  const isMutedRef = useRef(true);
  const unavailableCueIdsRef = useRef<Set<CueId>>(new Set());
  const warnedAssetsRef = useRef<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const buildCueId = useCallback(
    (channel: AudioChannel, cueName: string) => `${channel}:${cueName}` as CueId,
    [],
  );

  const warnAssetIssue = useCallback((assetLabel: string, assetPath: string) => {
    if (warnedAssetsRef.current.has(assetPath)) return;
    warnedAssetsRef.current.add(assetPath);
    console.warn(`[assets] ${assetLabel} is unavailable: ${assetPath}`);
  }, []);

  const getBackgroundAudio = useCallback(() => {
    const backgroundCueId = backgroundCueIdRef.current;
    if (!backgroundCueId) return null;
    return cuesRef.current.get(backgroundCueId) ?? null;
  }, []);

  const triggerCuePlayback = useCallback(
    (cueId: CueId) => {
      if (!hasInitializedRef.current || isMutedRef.current) return;

      const cueAudio = cuesRef.current.get(cueId);
      if (!cueAudio) return;

      const cueConfig = cueConfigsRef.current.get(cueId);
      if (!cueConfig) return;

      if (unavailableCueIdsRef.current.has(cueId)) {
        if (cueConfig.fallbackEffect) {
          playFallbackEffect(cueConfig.fallbackEffect);
        }
        return;
      }

      cueAudio.currentTime = 0;
      cueAudio.play().catch(() => {
        unavailableCueIdsRef.current.add(cueId);
        warnAssetIssue(cueLabelsRef.current.get(cueId) ?? cueId, cueConfig.src);
        if (cueConfig.fallbackEffect) {
          playFallbackEffect(cueConfig.fallbackEffect);
        }
      });
    },
    [warnAssetIssue],
  );

  useEffect(() => {
    hasInitializedRef.current = false;
    initializePromiseRef.current = null;
    setIsReady(false);
    unavailableCueIdsRef.current.clear();

    const nextCueElements = new Map<CueId, HTMLAudioElement>();
    const nextCueConfigs = new Map<CueId, ThemeAudioCue>();
    const nextCueLabels = new Map<CueId, string>();
    const errorHandlers: Array<{ audio: HTMLAudioElement; onError: () => void }> = [];

    const registerChannel = (channel: AudioChannel, channelCues: ThemeAudio[AudioChannel]) => {
      Object.entries(channelCues).forEach(([cueName, cueConfig]) => {
        const cueId = buildCueId(channel, cueName);
        const cueAudio = new Audio(cueConfig.src);
        cueAudio.preload = 'auto';
        cueAudio.muted = isMutedRef.current;
        cueAudio.loop = Boolean(cueConfig.loop);
        cueAudio.volume = cueConfig.volume ?? 1;

        const onError = () => {
          unavailableCueIdsRef.current.add(cueId);
          const cueLabel = `${channel} cue "${cueName}"`;
          nextCueLabels.set(cueId, cueLabel);
          warnAssetIssue(cueLabel, cueConfig.src);
        };

        cueAudio.addEventListener('error', onError);
        errorHandlers.push({ audio: cueAudio, onError });

        nextCueElements.set(cueId, cueAudio);
        nextCueConfigs.set(cueId, cueConfig);
        nextCueLabels.set(cueId, `${channel} cue "${cueName}"`);
      });
    };

    registerChannel('music', audioConfig.music);
    registerChannel('gameplay', audioConfig.gameplay);
    registerChannel('training', audioConfig.training);
    registerChannel('mode', audioConfig.mode);
    registerChannel('ui', audioConfig.ui);

    const preferredBackgroundCueId = buildCueId(
      V1_TRIGGER_MAP.backgroundLoop.channel,
      V1_TRIGGER_MAP.backgroundLoop.cue,
    );
    if (nextCueElements.has(preferredBackgroundCueId)) {
      backgroundCueIdRef.current = preferredBackgroundCueId;
    } else {
      const firstMusicCue = Array.from(nextCueElements.keys()).find(cueId =>
        cueId.startsWith('music:'),
      );
      backgroundCueIdRef.current = firstMusicCue ?? null;
    }

    cuesRef.current = nextCueElements;
    cueConfigsRef.current = nextCueConfigs;
    cueLabelsRef.current = nextCueLabels;

    return () => {
      errorHandlers.forEach(({ audio, onError }) => {
        audio.removeEventListener('error', onError);
        audio.pause();
        audio.currentTime = 0;
      });

      cuesRef.current = new Map();
      cueConfigsRef.current = new Map();
      cueLabelsRef.current = new Map();
      backgroundCueIdRef.current = null;
    };
  }, [audioConfig, buildCueId, warnAssetIssue]);

  const ensureAudioReady = useCallback(async () => {
    if (hasInitializedRef.current) return;
    if (initializePromiseRef.current) return initializePromiseRef.current;

    initializePromiseRef.current = (async () => {
      const bg = getBackgroundAudio();
      const backgroundCueId = backgroundCueIdRef.current;
      if (!bg || !backgroundCueId || unavailableCueIdsRef.current.has(backgroundCueId)) {
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
  }, [getBackgroundAudio]);

  const playCue = useCallback(
    (channel: TriggerableChannel, cue: string) => {
      // Future modes hook in here: playCue('mode', 'swipe-direction-left') or playCue('training', 'countdown-3').
      triggerCuePlayback(buildCueId(channel, cue));
    },
    [buildCueId, triggerCuePlayback],
  );

  const playEffect = useCallback(
    (effect: GameplayEffect) => {
      const mappedCue = V1_TRIGGER_MAP.effect[effect];
      playCue(mappedCue.channel, mappedCue.cue);
    },
    [playCue],
  );

  const startBackgroundMusic = useCallback(() => {
    shouldPlayBackgroundRef.current = true;
    const bg = getBackgroundAudio();
    const backgroundCueId = backgroundCueIdRef.current;
    if (!bg || !backgroundCueId) return;
    if (!hasInitializedRef.current || isMutedRef.current || unavailableCueIdsRef.current.has(backgroundCueId)) {
      return;
    }
    bg.play().catch(() => undefined);
  }, [getBackgroundAudio]);

  const stopBackgroundMusic = useCallback(() => {
    shouldPlayBackgroundRef.current = false;
    const bg = getBackgroundAudio();
    bg?.pause();
    if (bg) bg.currentTime = 0;
  }, [getBackgroundAudio]);

  const toggleMute = useCallback(async () => {
    await ensureAudioReady();

    setIsMuted(prev => {
      const nextMuted = !prev;
      isMutedRef.current = nextMuted;

      cuesRef.current.forEach(audio => {
        audio.muted = nextMuted;
      });

      if (nextMuted) {
        getBackgroundAudio()?.pause();
      } else if (shouldPlayBackgroundRef.current) {
        getBackgroundAudio()?.play().catch(() => undefined);
      }

      return nextMuted;
    });
  }, [ensureAudioReady, getBackgroundAudio]);

  const contextValue = useMemo(
    () => ({
      playEffect,
      playCue,
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
      playCue,
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
