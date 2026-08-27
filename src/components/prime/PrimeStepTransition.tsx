import { PrimeStep } from '../../types/prime';
import { useTheme } from '../../context/ThemeContext';
import { JungleButton } from '../JungleButton';
import { JungleBackground } from '../JungleBackground';
import { motion } from 'framer-motion';

interface PrimeStepTransitionProps {
  step: PrimeStep;
  stepNumber: number;
  totalSteps: number;
  elapsedLabel: string;
  progressPercent: number;
  reducedMotion: boolean;
  canSkip: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  onSkip?: () => void;
  onCancel: () => void;
}

export const PrimeStepTransition = ({
  step,
  stepNumber,
  totalSteps,
  elapsedLabel,
  progressPercent,
  reducedMotion,
  canSkip,
  primaryLabel,
  onPrimary,
  onSkip,
  onCancel,
}: PrimeStepTransitionProps) => {
  const { theme } = useTheme();

  return (
    <div
      className="relative w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <JungleBackground />
      <motion.main
        className="relative z-10 mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col justify-center gap-4 py-4"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.22 }}
      >
        <section
          className="rounded-3xl p-5 sm:p-6"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.9)',
            border: `1px solid ${theme.targetColor}55`,
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: theme.targetColor }}>
            Step {stepNumber} of {totalSteps} · {elapsedLabel}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight" style={{ color: theme.textColor }}>
            {step.title}
          </h1>
          <p className="mt-1 text-sm font-semibold" style={{ color: theme.textColor, opacity: 0.78 }}>
            {step.experienceName}
          </p>
          <p className="mt-4 text-base leading-relaxed" style={{ color: theme.textColor, opacity: 0.86 }}>
            {step.instruction}
          </p>
          {step.durationSeconds ? (
            <p className="mt-3 text-xs uppercase tracking-[0.14em]" style={{ color: theme.textColor, opacity: 0.6 }}>
              {step.kind === 'drill' ? `${step.durationSeconds}s round` : `${step.durationSeconds}s cue`}
            </p>
          ) : null}
          <div className="mt-4 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: `${theme.textColor}22` }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progressPercent}%`, backgroundColor: theme.targetColor }}
            />
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <JungleButton onClick={onPrimary} className="w-full min-h-14 px-5 py-3 text-lg font-extrabold">
              {primaryLabel}
            </JungleButton>
            {canSkip && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="ui-secondary-button min-h-12 px-5 text-sm"
                style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
              >
                Skip
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="ui-secondary-button min-h-12 px-5 text-sm"
              style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
            >
              Cancel Prime
            </button>
          </div>
        </section>
      </motion.main>
    </div>
  );
};
