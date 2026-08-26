import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { JungleThemeConfig } from '../types/theme';
import { jungleAssetManifest, jungleVisualFallbacks } from '../themes/assetManifest';
import type { InstinctArena } from '../config/animalInstincts';

export type JungleBackgroundIntensity = 'low' | 'medium' | 'high';
export type JunglePerformanceTier = 'neutral' | 'combo' | 'miss' | 'apex';

interface JungleBackgroundProps {
  variant?: InstinctArena | 'default';
  intensity?: JungleBackgroundIntensity;
  mist?: boolean;
  rain?: boolean;
  particles?: boolean;
  animalEyes?: boolean;
  performanceTier?: JunglePerformanceTier;
  className?: string;
}

const arenaTint: Record<InstinctArena | 'default', string> = {
  default: 'radial-gradient(circle at 50% 40%, rgba(18, 59, 40, 0.28), transparent 58%)',
  clearing: 'radial-gradient(circle at 50% 48%, rgba(82, 242, 140, 0.08), transparent 52%)',
  canopy: 'radial-gradient(circle at 50% 20%, rgba(232, 164, 58, 0.1), transparent 55%)',
  riverbank: 'radial-gradient(circle at 50% 78%, rgba(76, 201, 240, 0.12), transparent 50%)',
  forestFloor: 'radial-gradient(circle at 40% 70%, rgba(18, 59, 40, 0.35), transparent 55%)',
  nightCanopy: 'radial-gradient(circle at 50% 30%, rgba(76, 201, 240, 0.08), transparent 48%)',
};

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);
  return reduced;
};

const useLowPowerEnvironment = () => {
  const [lowPower, setLowPower] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const saveData =
      typeof navigator !== 'undefined' &&
      Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    setLowPower(coarse || saveData);
  }, []);
  return lowPower;
};

export const JungleBackground = ({
  variant = 'default',
  intensity = 'medium',
  mist = true,
  rain = false,
  particles = true,
  animalEyes = true,
  performanceTier = 'neutral',
  className = '',
}: JungleBackgroundProps) => {
  const { theme } = useTheme();
  const jungleTheme = theme as JungleThemeConfig;
  const { overlays } = jungleVisualFallbacks;
  const reducedMotion = usePrefersReducedMotion();
  const lowPower = useLowPowerEnvironment();

  const showDecor = !reducedMotion && !lowPower && intensity !== 'low';
  const mistOpacity =
    performanceTier === 'miss' ? 0.22 : performanceTier === 'combo' ? 0.14 : performanceTier === 'apex' ? 0.1 : 0.16;
  const particleCount = intensity === 'high' && showDecor ? 8 : showDecor && particles ? 5 : 0;
  const lightBoost = performanceTier === 'combo' || performanceTier === 'apex' ? 0.08 : 0;

  const particleSeeds = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, index) => ({
        id: index,
        left: `${12 + ((index * 17) % 76)}%`,
        delay: `${index * 0.7}s`,
        duration: `${9 + (index % 4) * 2}s`,
        size: 2 + (index % 3),
      })),
    [particleCount],
  );

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <div className={`absolute inset-0 ${jungleTheme.background.gradient}`} />
      <div className="absolute inset-0" style={{ backgroundImage: arenaTint[variant], opacity: 0.9 }} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 38%, rgba(0,0,0,${0.36 - lightBoost}) 100%), url(${jungleAssetManifest.ui.vignetteMask})`,
          backgroundSize: 'cover',
          opacity: 0.78,
        }}
      />

      <div
        className="absolute top-0 left-0 right-0 h-48 bg-repeat-x"
        style={{
          backgroundImage: `${overlays.top}, url(${jungleTheme.background.overlay.top})`,
          backgroundSize: 'auto 100%',
          animation: showDecor ? 'leaf-sway 14s ease-in-out infinite' : undefined,
        }}
      />
      <div
        className="absolute top-0 left-0 bottom-0 w-48 bg-repeat-y"
        style={{
          backgroundImage: `${overlays.left}, url(${jungleTheme.background.overlay.left})`,
          backgroundSize: '100% auto',
          animation: showDecor ? 'leaf-sway 16s ease-in-out infinite reverse' : undefined,
        }}
      />
      <div
        className="absolute top-0 right-0 bottom-0 w-48 bg-repeat-y"
        style={{
          backgroundImage: `${overlays.right}, url(${jungleTheme.background.overlay.right})`,
          backgroundSize: '100% auto',
          animation: showDecor ? 'leaf-sway 15s ease-in-out infinite' : undefined,
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-48 bg-repeat-x"
        style={{
          backgroundImage: `${overlays.bottom}, url(${jungleTheme.background.overlay.bottom})`,
          backgroundSize: 'auto 100%',
        }}
      />

      {mist && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(234,233,223,0.03), rgba(150,255,102,0.04), rgba(234,233,223,0.02))',
            opacity: mistOpacity,
            animation: showDecor ? 'mist-drift 18s ease-in-out infinite' : undefined,
          }}
        />
      )}

      {rain && showDecor && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(185deg, transparent 0, transparent 10px, rgba(234,233,223,0.08) 11px, transparent 14px)',
            backgroundSize: '24px 48px',
            animation: 'mist-drift 8s linear infinite',
          }}
        />
      )}

      {particleSeeds.map(seed => (
        <span
          key={seed.id}
          className="absolute rounded-full"
          style={{
            left: seed.left,
            bottom: '8%',
            width: seed.size,
            height: seed.size,
            backgroundColor: indexParityColor(seed.id),
            animation: `particle-float ${seed.duration} ease-in-out ${seed.delay} infinite`,
          }}
        />
      ))}

      {animalEyes && (
        <>
          <span
            className="absolute rounded-full"
            style={{
              left: '18%',
              top: '34%',
              width: 5,
              height: 5,
              backgroundColor: '#96FF66',
              boxShadow: '8px 0 0 #96FF66',
              animation: showDecor ? 'eye-blink 7s ease-in-out infinite' : undefined,
              opacity: 0.45,
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              right: '22%',
              top: '48%',
              width: 4,
              height: 4,
              backgroundColor: '#E8A43A',
              boxShadow: '7px 0 0 #E8A43A',
              animation: showDecor ? 'eye-blink 9s ease-in-out 1.4s infinite' : undefined,
              opacity: performanceTier === 'miss' ? 0.2 : 0.4,
            }}
          />
        </>
      )}
    </div>
  );
};

const indexParityColor = (index: number) =>
  index % 2 === 0 ? 'rgba(150, 255, 102, 0.65)' : 'rgba(232, 164, 58, 0.55)';
