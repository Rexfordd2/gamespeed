import { ComprehensionRoundState } from '../types/rapidComprehension';

interface ChameleonReadBoardProps {
  round: ComprehensionRoundState;
  disabled?: boolean;
  reducedMotion?: boolean;
  lowStimulus?: boolean;
  accentColor: string;
  textColor: string;
  onRespond: (choiceId: string) => void;
}

const shapeStyle = (shape: 'circle' | 'triangle' | 'square' | 'diamond' | undefined) => {
  if (shape === 'triangle') {
    return { borderRadius: 8, clipPath: 'polygon(50% 8%, 92% 88%, 8% 88%)' as const };
  }
  if (shape === 'diamond') {
    return { borderRadius: 10, transform: 'rotate(45deg)' };
  }
  if (shape === 'square') {
    return { borderRadius: 12 };
  }
  return { borderRadius: '50%' };
};

export const ChameleonReadBoard = ({
  round,
  disabled = false,
  reducedMotion = false,
  lowStimulus = false,
  accentColor,
  textColor,
  onRespond,
}: ChameleonReadBoardProps) => {
  const trial = round.trial;
  const item = trial?.item;
  const encoding = round.phase === 'encoding' && item;
  const delaying = round.phase === 'delay';
  const asking = round.phase === 'question' && item && !trial?.responded;

  const prompt =
    round.phase === 'encoding'
      ? 'Adapt before the picture changes.'
      : round.phase === 'delay'
        ? 'Hold the picture.'
        : round.feedback === 'correct'
          ? 'Clean read.'
          : round.feedback === 'wrong'
            ? 'Wrong read.'
            : round.feedback === 'encodingFailure'
              ? 'The picture got away.'
              : round.feedback === 'premature'
                ? 'Wait for the question.'
                : asking
                  ? item?.question ?? 'Answer from what you just saw.'
                  : 'Adapt before the picture changes.';

  const ariaLabel = encoding
    ? `Chameleon Read encoding. ${item.encodeHeadline}`
    : delaying
      ? 'Chameleon Read delay. Hold the picture.'
      : asking
        ? `Chameleon Read question. ${item.question}`
        : round.feedback === 'encodingFailure'
          ? 'Chameleon Read encoding failure.'
          : 'Chameleon Read waiting.';

  const tokens = item?.encodeTokens ?? [];
  const sequence = item?.encodeSequence ?? [];

  const handleBoardTap = () => {
    if (disabled) return;
    if (encoding || delaying) {
      onRespond('premature');
    }
  };

  return (
    <div
      className="absolute inset-0 z-[12] flex flex-col items-center justify-center px-4 pb-6 pt-2"
      style={{ touchAction: 'manipulation' }}
      onClick={handleBoardTap}
    >
      <p
        className="mb-3 max-w-[22rem] px-2 text-center text-[11px] uppercase tracking-[0.18em] sm:text-xs"
        style={{ color: textColor, opacity: 0.74 }}
      >
        {prompt}
      </p>
      <div
        role="application"
        aria-label={ariaLabel}
        className="relative flex w-full max-w-[22rem] flex-col items-center justify-center rounded-[2rem] px-2"
        style={{
          minHeight: 'min(58vmin, 22rem)',
          maxHeight: 'calc(100dvh - 12.5rem)',
        }}
      >
        {encoding && item?.encodeRuleText && (
          <p className="mb-3 max-w-[20rem] text-center text-sm font-semibold" style={{ color: textColor }}>
            {item.encodeRuleText}
          </p>
        )}
        {encoding && sequence.length > 0 && (
          <p className="mb-3 text-center text-lg font-black tracking-[0.12em]" style={{ color: textColor }}>
            {sequence.join(' → ')}
          </p>
        )}
        {encoding && tokens.length > 0 && (
          <div
            className={item?.family === 'spatialComprehension' ? 'grid grid-cols-2 gap-3' : 'flex flex-wrap items-center justify-center gap-3'}
          >
            {item?.family === 'spatialComprehension'
              ? [0, 1].flatMap(row =>
                  [0, 1].map(col => {
                    const token = tokens.find(entry => entry.row === row && entry.col === col);
                    return (
                      <span
                        key={`cell-${row}-${col}`}
                        aria-hidden="true"
                        className="flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20"
                        style={{
                          border: `1px solid ${textColor}33`,
                          borderRadius: 16,
                          backgroundColor: token ? `${token.color}${lowStimulus ? '33' : '3d'}` : 'transparent',
                        }}
                      >
                        {token && (
                          <span
                            className="h-8 w-8 sm:h-10 sm:w-10"
                            style={{
                              backgroundColor: token.color,
                              boxShadow: reducedMotion || lowStimulus ? 'none' : `0 0 16px ${token.color}66`,
                              ...shapeStyle(token.shape),
                            }}
                          />
                        )}
                      </span>
                    );
                  }),
                )
              : tokens.map(token => (
                  <span key={token.id} className="flex flex-col items-center gap-1">
                    <span
                      aria-hidden="true"
                      className="flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16"
                      style={{
                        backgroundColor: `${token.color}${lowStimulus ? '33' : '3d'}`,
                        border: `2px solid ${token.color}`,
                        boxShadow: reducedMotion || lowStimulus ? 'none' : `0 0 18px ${token.color}55`,
                        ...shapeStyle(token.shape),
                      }}
                    />
                    <span className="max-w-[6.5rem] text-center text-[10px] uppercase tracking-[0.12em]" style={{ color: textColor }}>
                      {token.sportCue?.symbol ?? token.label}
                      {token.motion && token.motion !== 'still' ? ` · ${token.motion}` : ''}
                      {token.flashes ? ` · ×${token.flashes}` : ''}
                    </span>
                  </span>
                ))}
          </div>
        )}
        {encoding && item && sequence.length === 0 && tokens.length === 0 && (
          <p className="text-center text-sm font-semibold" style={{ color: textColor }}>
            {item.encodeHeadline}
          </p>
        )}
        {delaying && (
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: accentColor, opacity: 0.55 }}
          />
        )}
        {asking && item && (
          <div className="flex w-full flex-col gap-2">
            <p className="mb-1 text-center text-sm font-semibold" style={{ color: textColor }}>
              {item.question}
            </p>
            {item.choices.map(choice => (
              <button
                key={choice.id}
                type="button"
                disabled={disabled}
                onClick={event => {
                  event.stopPropagation();
                  onRespond(choice.id);
                }}
                aria-label={`Chameleon Read answer ${choice.label}`}
                className="min-h-12 w-full rounded-2xl px-3 py-3 text-sm font-semibold touch-manipulation"
                style={{
                  color: textColor,
                  border: `1px solid ${accentColor}66`,
                  backgroundColor: `${accentColor}18`,
                }}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
