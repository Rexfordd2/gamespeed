import { GoNoGoRoundState } from '../types/goNoGo';
import { getGoNoGoPrompt } from '../utils/goNoGoEngine';

interface CaimanControlBoardProps {
  round: GoNoGoRoundState;
  disabled?: boolean;
  reducedMotion?: boolean;
  lowStimulus?: boolean;
  accentColor: string;
  textColor: string;
  onRespond: () => void;
}

export const CaimanControlBoard = ({
  round,
  disabled = false,
  reducedMotion = false,
  lowStimulus = false,
  accentColor,
  textColor,
  onRespond,
}: CaimanControlBoardProps) => {
  const stimulus = round.trial?.stimulus;
  const showing = round.phase === 'stimulus' && stimulus && !round.trial?.responded;
  const prompt =
    round.phase === 'isi'
      ? 'Still.'
      : round.feedback === 'falsePositive'
        ? 'Hold the fake.'
        : round.feedback === 'missedGo'
          ? 'The live cue got away.'
          : round.feedback === 'correctInhibition'
            ? 'Clean hold.'
            : showing
              ? getGoNoGoPrompt(round.config)
              : getGoNoGoPrompt(round.config);

  const ariaLabel = !showing
    ? round.phase === 'isi'
      ? 'Caiman Control still. Wait for the real cue.'
      : round.feedback === 'falsePositive'
        ? 'Caiman Control false start. Hold next no-go.'
        : 'Caiman Control waiting.'
    : stimulus.kind === 'go'
      ? 'Caiman Control go cue. Strike.'
      : 'Caiman Control no-go cue. Hold. Do not tap.';

  return (
    <div
      className="absolute inset-0 z-[12] flex flex-col items-center justify-center px-4 pb-6 pt-2"
      style={{ touchAction: 'manipulation' }}
    >
      <p
        className="mb-4 max-w-[22rem] px-2 text-center text-[11px] uppercase tracking-[0.18em] sm:text-xs"
        style={{ color: textColor, opacity: 0.74 }}
      >
        {prompt}
      </p>
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={onRespond}
        className="relative flex min-h-[12.5rem] w-full max-w-[22rem] items-center justify-center rounded-[2rem] touch-manipulation"
        style={{
          minHeight: 'min(58vmin, 22rem)',
          maxHeight: 'calc(100dvh - 12.5rem)',
          backgroundColor: 'transparent',
          border: 'none',
        }}
      >
        {showing && stimulus && (
          <>
            {round.trial?.distractors.map((distractor, index) => (
              <span
                key={`${round.trial?.id}-d${index}`}
                aria-hidden="true"
                className="pointer-events-none absolute h-8 w-8 rounded-full"
                style={{
                  transform: `translate(${distractor.dx}px, ${distractor.dy}px)`,
                  backgroundColor: distractor.color,
                  opacity: lowStimulus ? 0.2 : 0.45,
                }}
              />
            ))}
            <span
              aria-hidden="true"
              className="relative z-[1] flex items-center justify-center font-black tracking-[0.18em]"
              style={{
                width: 'min(42vmin, 10.5rem)',
                height: 'min(42vmin, 10.5rem)',
                borderRadius: stimulus.shape === 'diamond' ? 18 : '50%',
                transform: stimulus.shape === 'diamond' ? 'rotate(45deg)' : undefined,
                backgroundColor: `${stimulus.color}${lowStimulus ? '33' : '3d'}`,
                border: `3px solid ${stimulus.color}`,
                boxShadow: reducedMotion || lowStimulus ? 'none' : `0 0 28px ${stimulus.color}66`,
                color: textColor,
              }}
            >
              <span style={{ transform: stimulus.shape === 'diamond' ? 'rotate(-45deg)' : undefined }}>
                {stimulus.label}
              </span>
            </span>
          </>
        )}
        {round.phase === 'isi' && (
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: accentColor, opacity: 0.55 }}
          />
        )}
      </button>
    </div>
  );
};
