import { forwardRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { PlayerGoal, PlayerPersona } from '../../types/game';
import { JungleButton } from '../JungleButton';

type GoalOption = {
  id: PlayerGoal;
  label: string;
  hint: string;
};

export const GOALS_BY_PERSONA: Record<PlayerPersona, GoalOption[]> = {
  athlete: [
    { id: 'firstStepQuickness', label: 'First-step quickness', hint: 'Explode into the first movement faster.' },
    { id: 'peripheralAwareness', label: 'Peripheral awareness', hint: 'Read and react to wider visual cues.' },
    { id: 'gameSpeedDecisions', label: 'Game-speed decisions', hint: 'Process cues and choose under time pressure.' },
  ],
  gamer: [
    { id: 'rawReaction', label: 'Raw reaction', hint: 'Lower your response time on first cue.' },
    { id: 'flickResponse', label: 'Flick response', hint: 'Improve snap movement and target acquisition.' },
    { id: 'focusUnderPressure', label: 'Focus under pressure', hint: 'Stay accurate while pace ramps up.' },
  ],
};

const PERSONA_LABELS: Record<PlayerPersona, string> = {
  athlete: 'Athlete',
  gamer: 'Gamer',
};

export const FIRST_RUN_HEADLINE = 'Measure how quickly you see, decide and react.';
export const FIRST_RUN_CTA_LABEL = 'Run 60-second baseline';

interface FirstRunQuickstartProps {
  personaOrder: PlayerPersona[];
  persona: PlayerPersona | null;
  onPersonaSelect: (persona: PlayerPersona) => void;
  goal: PlayerGoal | null;
  onGoalSelect: (goal: PlayerGoal) => void;
  onStart: () => void;
  isNightGuardrailActive: boolean;
}

export const FirstRunQuickstart = forwardRef<HTMLElement, FirstRunQuickstartProps>(
  ({ personaOrder, persona, onPersonaSelect, goal, onGoalSelect, onStart, isNightGuardrailActive }, ref) => {
    const { theme } = useTheme();
    const canStart = !!persona && !!goal;

    return (
      <section
        ref={ref}
        aria-label="First benchmark"
        data-testid="first-run-quickstart"
        className="rounded-3xl p-4 sm:p-6 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(6, 12, 18, 0.82)',
          border: `1px solid ${theme.targetColor}55`,
          boxShadow: '0 20px 52px rgba(0, 0, 0, 0.4)',
        }}
      >
        <p
          className="font-display text-sm font-extrabold uppercase tracking-[0.2em]"
          style={{ color: theme.targetColor }}
        >
          GameSpeed
        </p>
        <h1
          className="font-display mt-1.5 text-2xl font-extrabold leading-tight sm:text-4xl"
          style={{ color: theme.textColor }}
        >
          {FIRST_RUN_HEADLINE}
        </h1>

        <div className="mt-4" role="group" aria-label="I train as">
          <div
            className="inline-flex w-full max-w-md rounded-xl border p-1"
            style={{ borderColor: `${theme.targetColor}40`, backgroundColor: 'rgba(2, 8, 6, 0.72)' }}
          >
            {personaOrder.map(option => {
              const isActive = persona === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onPersonaSelect(option)}
                  className="min-h-11 flex-1 rounded-lg px-3 text-sm font-semibold uppercase tracking-[0.1em]"
                  style={{
                    color: isActive ? '#06120F' : theme.textColor,
                    backgroundColor: isActive ? theme.targetColor : 'transparent',
                    opacity: isActive ? 1 : 0.75,
                  }}
                >
                  {PERSONA_LABELS[option]}
                </button>
              );
            })}
          </div>
        </div>

        <fieldset className="mt-4">
          <legend
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: theme.targetColor }}
          >
            Pick one goal
          </legend>
          {persona ? (
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
              {GOALS_BY_PERSONA[persona].map(option => {
                const isSelected = goal === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onGoalSelect(option.id)}
                    className="rounded-xl px-3 py-2 text-left"
                    style={{
                      backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.16)' : 'rgba(5, 12, 16, 0.64)',
                      border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.85)' : `${theme.textColor}2b`}`,
                    }}
                  >
                    <span className="block text-sm font-semibold" style={{ color: theme.textColor }}>
                      {option.label}
                    </span>
                    <span className="block text-xs leading-snug" style={{ color: theme.textColor, opacity: 0.7 }}>
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm" style={{ color: theme.textColor, opacity: 0.75 }}>
              Choose Athlete or Gamer to see goals.
            </p>
          )}
        </fieldset>

        <JungleButton
          onClick={onStart}
          disabled={!canStart}
          className="mt-4 w-full min-h-[52px] px-6 text-base font-bold sm:w-auto"
        >
          {FIRST_RUN_CTA_LABEL}
        </JungleButton>
        <p className="mt-2 text-xs" style={{ color: theme.textColor, opacity: 0.68 }}>
          {isNightGuardrailActive
            ? 'Bedtime window: this baseline runs in low-stimulation mode. No signup needed.'
            : 'No signup needed. Settings can wait until after your first result.'}
        </p>
      </section>
    );
  },
);

FirstRunQuickstart.displayName = 'FirstRunQuickstart';
