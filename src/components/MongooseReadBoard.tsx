import { PointerEvent, useCallback, useEffect, useRef } from 'react';
import { ChoiceResponseKind, ChoiceRoundState } from '../types/choiceReaction';
import {
  DEFAULT_CHOICE_HOLD_MS,
  classifyPointerGesture,
  getChoicePrompt,
  getChoiceRuleLegend,
} from '../utils/choiceReactionEngine';

interface MongooseReadBoardProps {
  round: ChoiceRoundState;
  disabled?: boolean;
  reducedMotion?: boolean;
  lowStimulus?: boolean;
  accentColor: string;
  textColor: string;
  onRespond: (response: ChoiceResponseKind) => void;
}

const TOUCH_SWIPE_PX = 34;
const MOUSE_SWIPE_PX = 26;

export const MongooseReadBoard = ({
  round,
  disabled = false,
  reducedMotion = false,
  lowStimulus = false,
  accentColor,
  textColor,
  onRespond,
}: MongooseReadBoardProps) => {
  const stimulus = round.trial?.stimulus;
  const showing = round.phase === 'stimulus' && stimulus && !round.trial?.responded;
  const legend = getChoiceRuleLegend({ ...round.config, ruleSet: round.activeRuleSet });
  const keepLegend =
    round.phase === 'briefing' || Boolean(round.activeRuleSet.keepLegendVisible);
  const holdMs = round.config.holdMs ?? DEFAULT_CHOICE_HOLD_MS;

  const pointerRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startedAt: number;
    holdFired: boolean;
  } | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const onRespondRef = useRef(onRespond);
  onRespondRef.current = onRespond;

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  useEffect(() => () => clearHoldTimer(), []);

  const fireResponse = useCallback(
    (response: Exclude<ChoiceResponseKind, 'nogo'>) => {
      if (disabled) return;
      onRespondRef.current(response);
    },
    [disabled],
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    try {
      (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    } catch {
      // jsdom does not implement setPointerCapture.
    }
    pointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: Date.now(),
      holdFired: false,
    };
    clearHoldTimer();
    holdTimerRef.current = window.setTimeout(() => {
      const pointer = pointerRef.current;
      if (!pointer || pointer.holdFired) return;
      pointer.holdFired = true;
      fireResponse('hold');
    }, holdMs);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.holdFired) return;
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    const minDistancePx = event.pointerType === 'touch' ? TOUCH_SWIPE_PX : MOUSE_SWIPE_PX;
    if (Math.hypot(dx, dy) >= minDistancePx) {
      clearHoldTimer();
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    const pointer = pointerRef.current;
    clearHoldTimer();
    pointerRef.current = null;
    if (!pointer || pointer.holdFired) return;
    const elapsedMs = Math.max(0, Date.now() - pointer.startedAt);
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    const minDistancePx = event.pointerType === 'touch' ? TOUCH_SWIPE_PX : MOUSE_SWIPE_PX;
    fireResponse(
      classifyPointerGesture({
        dx,
        dy,
        elapsedMs,
        minDistancePx,
        holdMs,
      }),
    );
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    clearHoldTimer();
    pointerRef.current = null;
  };

  const prompt = getChoicePrompt(round);
  const sportSymbol = stimulus?.sportCue?.symbol;
  const cueLabel = sportSymbol || stimulus?.label || '';

  const ariaLabel = round.phase === 'briefing'
    ? `Mongoose Read rules. ${legend.map(entry => `${entry.stimulus.label} ${entry.responseLabel}`).join('. ')}.`
    : round.phase === 'isi'
      ? 'Mongoose Read still. Wait for the cue.'
      : showing && stimulus
        ? `Mongoose Read ${stimulus.label} cue`
        : round.feedback === 'wrongResponse'
          ? 'Mongoose Read wrong response.'
          : round.feedback === 'omission'
            ? 'Mongoose Read omission. Too late.'
            : round.feedback === 'premature'
              ? 'Mongoose Read false start. Wait for the cue.'
              : 'Mongoose Read waiting.';

  const shape = stimulus?.shape ?? 'circle';

  return (
    <div
      className="absolute inset-0 z-[12] flex flex-col items-center justify-center px-4 pb-6 pt-2"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      onContextMenu={event => event.preventDefault()}
    >
      <p
        className="mb-3 max-w-[22rem] px-2 text-center text-[11px] uppercase tracking-[0.18em] sm:text-xs"
        style={{ color: textColor, opacity: 0.74 }}
      >
        {prompt}
      </p>
      {keepLegend && (
        <ul
          className="mb-4 grid w-full max-w-[22rem] grid-cols-2 gap-2 sm:grid-cols-4"
          aria-label="Mongoose Read active rules"
        >
          {legend.map(entry => (
            <li
              key={`${entry.stimulus.id}-${entry.response}`}
              className="rounded-xl px-2 py-2 text-center"
              style={{
                backgroundColor: `${entry.stimulus.color ?? accentColor}22`,
                border: `1px solid ${entry.stimulus.color ?? accentColor}66`,
              }}
            >
              <p className="text-[10px] font-black tracking-[0.14em]" style={{ color: textColor }}>
                {entry.stimulus.sportCue?.symbol ?? entry.stimulus.label}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] opacity-75" style={{ color: textColor }}>
                {entry.responseLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div
        role="application"
        aria-label={ariaLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="relative flex min-h-[12.5rem] w-full max-w-[22rem] items-center justify-center rounded-[2rem] select-none"
        style={{
          minHeight: 'min(58vmin, 22rem)',
          maxHeight: 'calc(100dvh - 12.5rem)',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {showing && stimulus && (
          <span
            aria-hidden="true"
            className="relative z-[1] flex items-center justify-center font-black tracking-[0.18em]"
            style={{
              width: 'min(42vmin, 10.5rem)',
              height: 'min(42vmin, 10.5rem)',
              borderRadius: shape === 'square' ? 18 : shape === 'diamond' ? 18 : '50%',
              transform: shape === 'diamond' ? 'rotate(45deg)' : undefined,
              backgroundColor: `${stimulus.color ?? accentColor}${lowStimulus ? '33' : '3d'}`,
              border: `3px solid ${stimulus.color ?? accentColor}`,
              boxShadow:
                reducedMotion || lowStimulus ? 'none' : `0 0 28px ${stimulus.color ?? accentColor}66`,
              color: textColor,
              pointerEvents: 'none',
            }}
          >
            <span style={{ transform: shape === 'diamond' ? 'rotate(-45deg)' : undefined }}>
              {cueLabel}
            </span>
          </span>
        )}
        {round.phase === 'isi' && (
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: accentColor, opacity: 0.55, pointerEvents: 'none' }}
          />
        )}
        {round.phase === 'briefing' && (
          <p className="px-4 text-center text-sm font-semibold" style={{ color: textColor, opacity: 0.82 }}>
            Fast is only useful when the decision is right.
          </p>
        )}
      </div>
    </div>
  );
};
