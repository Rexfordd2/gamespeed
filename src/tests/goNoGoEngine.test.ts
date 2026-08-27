import { describe, expect, it } from 'vitest';
import {
  createGoNoGoRng,
  createGoNoGoRound,
  createTrial,
  deriveGoNoGoMetrics,
  getGoNoGoPrompt,
  MIN_GONOGO_STIMULUS_MS,
  normalizeGoNoGoConfig,
  respondGoNoGo,
  tickGoNoGo,
} from '../utils/goNoGoEngine';
import { GoNoGoTrialConfig } from '../types/goNoGo';
import { getAnimalInstinct } from '../config/animalInstincts';
import { getGoNoGoConfigForLadder } from '../modes/goNoGo';

const colorConfig = (): GoNoGoTrialConfig => ({
  goProbability: 0.5,
  stimulusMs: 800,
  isiMinMs: 500,
  isiMaxMs: 500,
  ruleSet: 'color',
  distractorCount: 0,
  errorLockoutMs: 80,
});

const advanceToStimulus = (
  start: ReturnType<typeof createGoNoGoRound>,
  kind: 'go' | 'nogo',
  rng = createGoNoGoRng(7),
) => {
  const spawned = tickGoNoGo(start, start.phaseEndsAtMs, rng, kind);
  expect(spawned.state.phase).toBe('stimulus');
  expect(spawned.state.trial?.kind).toBe(kind);
  return spawned.state;
};

describe('go/no-go engine', () => {
  it('clamps stimulus duration so hard mode cannot become un-hittable', () => {
    const config = normalizeGoNoGoConfig({
      goProbability: 0.45,
      stimulusMs: 180,
      isiMinMs: 100,
      isiMaxMs: 120,
      ruleSet: 'color',
      distractorCount: 4,
    });
    expect(config.stimulusMs).toBeGreaterThanOrEqual(MIN_GONOGO_STIMULUS_MS);
    expect(config.isiMinMs).toBeGreaterThanOrEqual(420);
    expect(config.distractorCount).toBe(2);
    expect(getGoNoGoConfigForLadder(40).stimulusMs).toBeGreaterThanOrEqual(MIN_GONOGO_STIMULUS_MS);
  });

  it('scores a correct GO tap with reaction time and does not treat it as a miss', () => {
    const rng = createGoNoGoRng(3);
    const round = advanceToStimulus(createGoNoGoRound(colorConfig(), 1_000, rng), 'go', rng);
    const tapped = respondGoNoGo(round, round.trial!.shownAtMs + 210);
    expect(tapped.outcome).toBe('correctGo');
    expect(tapped.state.accumulator.correctGo).toBe(1);
    expect(tapped.state.accumulator.missedGo).toBe(0);
    expect(tapped.state.accumulator.goReactionTimesMs[0]).toBe(210);
    expect(tapped.state.accumulator.streak).toBe(1);
  });

  it('counts a GO timeout as missed GO, not as a false start', () => {
    const rng = createGoNoGoRng(4);
    const round = advanceToStimulus(createGoNoGoRound(colorConfig(), 1_000, rng), 'go', rng);
    const timedOut = tickGoNoGo(round, round.trial!.endsAtMs, rng);
    expect(timedOut.outcome).toBe('missedGo');
    expect(timedOut.state.accumulator.missedGo).toBe(1);
    expect(timedOut.state.accumulator.falsePositives).toBe(0);
    expect(timedOut.state.accumulator.prematureResponses).toBe(0);
  });

  it('counts a withheld NO-GO as a correct inhibition', () => {
    const rng = createGoNoGoRng(5);
    const round = advanceToStimulus(createGoNoGoRound(colorConfig(), 1_000, rng), 'nogo', rng);
    const held = tickGoNoGo(round, round.trial!.endsAtMs, rng);
    expect(held.outcome).toBe('correctInhibition');
    expect(held.state.accumulator.correctInhibitions).toBe(1);
    expect(held.state.accumulator.falsePositives).toBe(0);
    expect(held.state.accumulator.streak).toBe(1);
  });

  it('counts a NO-GO tap as a false positive, separate from missed GO', () => {
    const rng = createGoNoGoRng(6);
    const round = advanceToStimulus(createGoNoGoRound(colorConfig(), 1_000, rng), 'nogo', rng);
    const tapped = respondGoNoGo(round, round.trial!.shownAtMs + 80);
    expect(tapped.outcome).toBe('falsePositive');
    expect(tapped.state.accumulator.falsePositives).toBe(1);
    expect(tapped.state.accumulator.missedGo).toBe(0);
    expect(tapped.state.accumulator.correctGo).toBe(0);
  });

  it('does not let touch spam farm score during ISI or after a resolved trial', () => {
    const rng = createGoNoGoRng(8);
    let state = createGoNoGoRound(colorConfig(), 1_000, rng);
    const isiTap = respondGoNoGo(state, 1_010);
    expect(isiTap.outcome).toBe('premature');
    expect(isiTap.state.accumulator.correctGo).toBe(0);
    expect(isiTap.state.accumulator.prematureResponses).toBe(1);

    state = advanceToStimulus(isiTap.state, 'go', rng);
    const first = respondGoNoGo(state, state.trial!.shownAtMs + 100);
    expect(first.outcome).toBe('correctGo');
    const spam = respondGoNoGo(first.state, state.trial!.shownAtMs + 120);
    expect(spam.outcome).toBe('ignoredSpam');
    expect(spam.state.accumulator.correctGo).toBe(1);
    expect(spam.state.accumulator.ignoredSpam).toBe(1);
  });

  it('builds advanced rule sets without collapsing to a Quick Tap clone', () => {
    const similar = createTrial(
      { ...colorConfig(), ruleSet: 'similarHue' },
      1,
      createGoNoGoRng(9),
      'nogo',
    );
    expect(similar.stimulus.label).toBe('HOLD');
    expect(similar.stimulus.color).toBe('#5eead4');
    expect(similar.stimulus.color).not.toBe('#f87171');

    const shapedGo = createTrial(
      { ...colorConfig(), ruleSet: 'colorShape', distractorCount: 2 },
      2,
      createGoNoGoRng(10),
      'go',
    );
    expect(shapedGo.stimulus.shape).toBe('circle');
    expect(shapedGo.stimulus.color).toBe('#4ade80');
    expect(shapedGo.distractors).toHaveLength(2);

    const shapedNoGo = createTrial(
      { ...colorConfig(), ruleSet: 'colorShape' },
      3,
      createGoNoGoRng(11),
      'nogo',
    );
    expect(shapedNoGo.stimulus.label).toBe('HOLD');
    expect(shapedNoGo.kind).toBe('nogo');
  });

  it('reports reaction, control, and false-start metrics without a clinical claim', () => {
    const rng = createGoNoGoRng(12);
    let state = createGoNoGoRound(colorConfig(), 0, rng);
    state = advanceToStimulus(state, 'go', rng);
    state = respondGoNoGo(state, state.trial!.shownAtMs + 180).state;
    state = tickGoNoGo(state, state.phaseEndsAtMs, rng).state;
    state = advanceToStimulus(state, 'nogo', rng);
    state = tickGoNoGo(state, state.trial!.endsAtMs, rng).state;
    state = tickGoNoGo(state, state.phaseEndsAtMs, rng).state;
    state = advanceToStimulus(state, 'nogo', rng);
    state = respondGoNoGo(state, state.trial!.shownAtMs + 40).state;

    const metrics = deriveGoNoGoMetrics(state.accumulator);
    expect(metrics.correctGo).toBe(1);
    expect(metrics.correctInhibitions).toBe(1);
    expect(metrics.falsePositives).toBe(1);
    expect(metrics.missedGo).toBe(0);
    expect(metrics.goReactionTimeMs).toBe(180);
    expect(metrics.inhibitionAccuracyPct).toBe(50);
    expect(metrics.overallAccuracyPct).toBe(67);
    expect(metrics).not.toHaveProperty('impulseControlDiagnosis');
    expect(getGoNoGoPrompt(colorConfig())).toContain('Still until the moment is real');
  });

  it('keeps Caiman Control copy centralized and Prime-ready', () => {
    expect(getAnimalInstinct('goNoGo').experienceName).toBe('Caiman Control');
    expect(getAnimalInstinct('goNoGo').tagline).toContain('Still until the moment is real');
    expect(getGoNoGoConfigForLadder(0).ruleSet).toBe('color');
    expect(getGoNoGoConfigForLadder(0, { prime: true }).goProbability).toBe(0.7);
  });
});
