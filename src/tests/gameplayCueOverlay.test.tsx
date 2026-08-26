import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameplayCueOverlay } from '../components/GameplayCueOverlay';
import { getGameplayCueSet } from '../utils/gameplayCues';

describe('GameplayCueOverlay', () => {
  it('renders sport-specific cue copy from the cue set', () => {
    const soccerCueSet = getGameplayCueSet('soccer', 'quickTap');
    render(
      <GameplayCueOverlay
        cueIntensity="guided"
        cueSet={soccerCueSet}
        preRoundCueText={soccerCueSet.focus}
        phaseCue={{ text: soccerCueSet.tactical, type: 'tactical' }}
        streakCue={{ text: soccerCueSet.reset, type: 'reset' }}
      />,
    );

    expect(screen.getAllByText('Focus cue: first touch cue').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tactical cue: press trigger').length).toBeGreaterThan(0);
    expect(screen.getByText('Reset cue: breathe, re-center, passing lane read')).toBeInTheDocument();
  });

  it('renders only pre-round and micro HUD for minimal intensity', () => {
    const cueSet = getGameplayCueSet('soccer', 'quickTap');
    render(
      <GameplayCueOverlay
        cueIntensity="minimal"
        cueSet={cueSet}
        preRoundCueText={cueSet.focus}
        phaseCue={{ text: cueSet.tactical, type: 'tactical' }}
        streakCue={{ text: cueSet.reset, type: 'reset' }}
      />,
    );

    expect(screen.getByTestId('gameplay-pre-round-cue')).toBeInTheDocument();
    expect(screen.getByTestId('gameplay-micro-hud')).toBeInTheDocument();
    expect(screen.queryByTestId('gameplay-phase-cue')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gameplay-streak-cue')).not.toBeInTheDocument();
  });

  it('renders all cue timings for guided intensity', () => {
    const cueSet = getGameplayCueSet('boxing', 'swipeStrike');
    render(
      <GameplayCueOverlay
        cueIntensity="guided"
        cueSet={cueSet}
        preRoundCueText={cueSet.focus}
        phaseCue={{ text: cueSet.tactical, type: 'tactical' }}
        streakCue={{ text: cueSet.reset, type: 'reset' }}
      />,
    );

    expect(screen.getByTestId('gameplay-pre-round-cue')).toBeInTheDocument();
    expect(screen.getByTestId('gameplay-phase-cue')).toBeInTheDocument();
    expect(screen.getByTestId('gameplay-streak-cue')).toBeInTheDocument();
    expect(screen.getByTestId('gameplay-micro-hud')).toBeInTheDocument();
  });

  it('uses safe-area positioning and constrained width for mobile safety', () => {
    const cueSet = getGameplayCueSet('volleyball', 'holdTrack');
    render(
      <GameplayCueOverlay
        cueIntensity="standard"
        cueSet={cueSet}
        preRoundCueText={null}
        phaseCue={null}
        streakCue={null}
      />,
    );

    const microHud = screen.getByTestId('gameplay-micro-hud');
    const styleAttr = microHud.getAttribute('style') ?? '';

    expect(styleAttr).toContain('--cue-safe-right');
    expect(styleAttr).toContain('--cue-safe-bottom');
    expect(styleAttr).toContain('max-width: min(56vw, 250px)');
  });
});
