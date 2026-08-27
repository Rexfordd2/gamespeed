import { AnimatePresence, motion } from 'framer-motion';
import { getAnimalInstinct } from '../config/animalInstincts';
import { resolveSemanticAccent } from '../config/designTokens';
import { framerTransition } from '../config/motion';
import { getModeIconVisual } from '../config/modeManifest';
import { GameModeType } from '../types/game';

interface InstinctIntroProps {
  mode: GameModeType;
  phase: 'silhouette' | 'title' | 'wait' | 'pulse' | 'go' | null;
  pulseCount?: number;
  onSkip?: () => void;
  canSkip?: boolean;
}

export const InstinctIntro = ({
  mode,
  phase,
  pulseCount = 0,
  onSkip,
  canSkip = false,
}: InstinctIntroProps) => {
  const instinct = getAnimalInstinct(mode);
  const accent = resolveSemanticAccent(instinct.accent);
  const icon = getModeIconVisual(mode);

  if (!phase) return null;

  return (
    <div
      className="absolute inset-0 z-[40] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(2, 8, 6, 0.88)' }}
      role="status"
      aria-live="polite"
      data-testid="instinct-intro"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          className="flex flex-col items-center px-6 text-center"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={framerTransition.ui}
        >
          {(phase === 'silhouette' || phase === 'title') && (
            <>
              {icon.path ? (
                <img src={icon.path} alt="" aria-hidden="true" className="mb-5 h-24 w-24 object-contain opacity-90" />
              ) : (
                <span className="mb-5 text-5xl" style={{ color: accent }} aria-hidden="true">
                  {icon.glyph}
                </span>
              )}
            </>
          )}

          {(phase === 'title' || phase === 'wait' || phase === 'pulse' || phase === 'go') && (
            <>
              <p className="font-display text-4xl font-extrabold uppercase tracking-[0.08em] sm:text-5xl" style={{ color: '#EAE9DF' }}>
                {instinct.experienceName}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
                {instinct.ability}
              </p>
            </>
          )}

          {phase === 'wait' && (
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: '#EAE9DF', opacity: 0.85 }}>
              {instinct.introCue}
            </p>
          )}

          {phase === 'pulse' && (
            <div className="mt-8 flex items-center gap-3">
              {[1, 2, 3].map(step => (
                <span
                  key={step}
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: accent,
                    opacity: pulseCount >= step ? 1 : 0.25,
                    boxShadow: pulseCount >= step ? `0 0 14px ${accent}` : 'none',
                  }}
                />
              ))}
            </div>
          )}

          {phase === 'go' && (
            <p className="font-display mt-6 text-5xl font-black uppercase tracking-[0.12em]" style={{ color: accent }}>
              GO
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {canSkip && onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="ui-secondary-button absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 px-4 py-2 text-xs uppercase tracking-[0.14em]"
        >
          Skip
        </button>
      )}
    </div>
  );
};
