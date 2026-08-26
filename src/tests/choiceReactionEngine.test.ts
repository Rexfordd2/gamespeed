import { describe, expect, it } from 'vitest';
import {
  CHOICE_COLORS,
  LIVE_CHOICE_RESPONSE_KINDS,
  MIN_CHOICE_STIMULUS_MS,
  SIMILAR_CHOICE_COLORS,
  classifyPointerGesture,
  createChoiceRng,
  createChoiceRound,
  createTrial,
  deriveChoiceReactionMetrics,
  formatChoiceResponse,
  getChoiceRuleLegend,
  normalizeChoiceConfig,
  respondChoice,
  tickChoice,
} from '../utils/choiceReactionEngine';
import { ChoiceRoundConfig } from '../types/choiceReaction';
import { getAnimalInstinct } from '../config/animalInstincts';
import { CHOICE_PRIME_CONFIG, DEFAULT_CHOICE_STIMULI, getChoiceConfigForLadder } from '../modes/choiceReaction';

const threeMapConfig = (): ChoiceRoundConfig => ({
  ruleSet: {
    id: 'test-3',
    mappings: [
      { stimulusId: 'green', response: 'tap' },
      { stimulusId: 'yellow', response: 'swipeLeft' },
      { stimulusId: 'blue', response: 'swipeRight' },
    ],
  },
  stimuli: DEFAULT_CHOICE_STIMULI,
  stimulusMs: 800,
  isiMinMs: 500,
  isiMaxMs: 500,
  briefingMs: 1600,
});

const advancePastBriefing = (start: ReturnType<typeof createChoiceRound>, rng = createChoiceRng(7)) => {
  const isi = tickChoice(start, start.phaseEndsAtMs, rng);
  expect(isi.state.phase).toBe('isi');
  return isi.state;
};

const advanceToStimulus = (
  start: ReturnType<typeof createChoiceRound>,
  stimulusId: string,
  rng = createChoiceRng(7),
) => {
  const waiting = start.phase === 'briefing' ? advancePastBriefing(start, rng) : start;
  const spawned = tickChoice(waiting, waiting.phaseEndsAtMs, rng, stimulusId);
  expect(spawned.state.phase).toBe('stimulus');
  expect(spawned.state.trial?.stimulus.id).toBe(stimulusId);
  return spawned.state;
};

describe('choice-reaction engine', () => {
  it('clamps stimulus duration so hard mode cannot become un-hittable', () => {
    const config = normalizeChoiceConfig({
      ...threeMapConfig(),
      stimulusMs: 180,
      isiMinMs: 100,
      isiMaxMs: 120,
      briefingMs: 200,
    });
    expect(config.stimulusMs).toBeGreaterThanOrEqual(MIN_CHOICE_STIMULUS_MS);
    expect(config.isiMinMs).toBeGreaterThanOrEqual(420);
    expect(config.briefingMs).toBeGreaterThanOrEqual(1600);
    expect(getChoiceConfigForLadder(40).stimulusMs).toBeGreaterThanOrEqual(MIN_CHOICE_STIMULUS_MS);
  });

  it('keeps mappings config-driven instead of hard-coding green-tap everywhere', () => {
    const custom = normalizeChoiceConfig({
      ...threeMapConfig(),
      ruleSet: {
        id: 'custom',
        mappings: [
          { stimulusId: 'green', response: 'swipeRight' },
          { stimulusId: 'yellow', response: 'hold' },
        ],
      },
    });
    expect(custom.ruleSet.mappings).toEqual([
      { stimulusId: 'green', response: 'swipeRight' },
      { stimulusId: 'yellow', response: 'hold' },
    ]);
    const legend = getChoiceRuleLegend(custom);
    expect(legend.map(entry => `${entry.stimulus.id}:${entry.response}`)).toEqual([
      'green:swipeRight',
      'yellow:hold',
    ]);
    expect(formatChoiceResponse('nogo')).toBe('No response');
  });

  it('scores a correct tap with choice reaction time', () => {
    const rng = createChoiceRng(3);
    const round = advanceToStimulus(createChoiceRound(threeMapConfig(), 1_000, rng), 'green', rng);
    const tapped = respondChoice(round, round.trial!.shownAtMs + 210, 'tap');
    expect(tapped.outcome).toBe('correct');
    expect(tapped.state.accumulator.correct).toBe(1);
    expect(tapped.state.accumulator.choiceReactionTimesMs[0]).toBe(210);
    expect(tapped.state.accumulator.byResponse.tap?.correct).toBe(1);
  });

  it('scores swipe left, swipe right, swipe up, and swipe down as separate families', () => {
    const rng = createChoiceRng(11);
    const config: ChoiceRoundConfig = {
      ...threeMapConfig(),
      ruleSet: {
        id: 'swipes',
        mappings: [
          { stimulusId: 'green', response: 'swipeLeft' },
          { stimulusId: 'yellow', response: 'swipeRight' },
          { stimulusId: 'blue', response: 'swipeUp' },
          { stimulusId: 'red', response: 'swipeDown' },
        ],
      },
    };
    let state = createChoiceRound(config, 1_000, rng);
    state = advanceToStimulus(state, 'green', rng);
    expect(respondChoice(state, state.trial!.shownAtMs + 90, 'swipeLeft').outcome).toBe('correct');

    state = createChoiceRound(config, 2_000, rng);
    state = advanceToStimulus(state, 'yellow', rng);
    expect(respondChoice(state, state.trial!.shownAtMs + 90, 'swipeRight').outcome).toBe('correct');

    state = createChoiceRound(config, 3_000, rng);
    state = advanceToStimulus(state, 'blue', rng);
    expect(respondChoice(state, state.trial!.shownAtMs + 90, 'swipeUp').outcome).toBe('correct');

    state = createChoiceRound(config, 4_000, rng);
    state = advanceToStimulus(state, 'red', rng);
    expect(respondChoice(state, state.trial!.shownAtMs + 90, 'swipeDown').outcome).toBe('correct');
  });

  it('scores a hold family without treating it as a tap', () => {
    const rng = createChoiceRng(12);
    const config: ChoiceRoundConfig = {
      ...threeMapConfig(),
      ruleSet: {
        id: 'hold',
        mappings: [{ stimulusId: 'green', response: 'hold' }],
      },
    };
    const round = advanceToStimulus(createChoiceRound(config, 1_000, rng), 'green', rng);
    const tapped = respondChoice(round, round.trial!.shownAtMs + 80, 'tap');
    expect(tapped.outcome).toBe('wrongResponse');
    const holdRound = advanceToStimulus(createChoiceRound(config, 2_000, rng), 'green', rng);
    const held = respondChoice(holdRound, holdRound.trial!.shownAtMs + 400, 'hold');
    expect(held.outcome).toBe('correct');
    expect(held.state.accumulator.byResponse.hold?.correct).toBe(1);
  });

  it('counts a no-go withhold as correct and a no-go movement as a wrong response', () => {
    const rng = createChoiceRng(5);
    const config: ChoiceRoundConfig = {
      ...threeMapConfig(),
      ruleSet: {
        id: 'nogo',
        mappings: [
          { stimulusId: 'green', response: 'tap' },
          { stimulusId: 'red', response: 'nogo' },
        ],
      },
    };
    const nogoRound = advanceToStimulus(createChoiceRound(config, 1_000, rng), 'red', rng);
    const withheld = tickChoice(nogoRound, nogoRound.trial!.endsAtMs, rng);
    expect(withheld.outcome).toBe('correct');
    expect(withheld.state.accumulator.correct).toBe(1);
    expect(withheld.state.accumulator.choiceReactionTimesMs).toEqual([]);

    const moved = respondChoice(
      advanceToStimulus(createChoiceRound(config, 2_000, rng), 'red', rng),
      2_000,
      'tap',
    );
    expect(moved.outcome).toBe('wrongResponse');
    expect(moved.state.accumulator.wrongResponses).toBe(1);
  });

  it('counts a required-response timeout as an omission, not a false start', () => {
    const rng = createChoiceRng(4);
    const round = advanceToStimulus(createChoiceRound(threeMapConfig(), 1_000, rng), 'green', rng);
    const timedOut = tickChoice(round, round.trial!.endsAtMs, rng);
    expect(timedOut.outcome).toBe('omission');
    expect(timedOut.state.accumulator.omissions).toBe(1);
    expect(timedOut.state.accumulator.falseStarts).toBe(0);
  });

  it('does not let briefing taps or post-resolve spam farm score', () => {
    const rng = createChoiceRng(8);
    let state = createChoiceRound(threeMapConfig(), 1_000, rng);
    const briefingTap = respondChoice(state, 1_010, 'tap');
    expect(briefingTap.outcome).toBe('ignoredSpam');
    expect(briefingTap.state.accumulator.correct).toBe(0);

    state = advancePastBriefing(briefingTap.state, rng);
    const isiTap = respondChoice(state, state.phaseEndsAtMs - 10, 'tap');
    expect(isiTap.outcome).toBe('premature');
    expect(isiTap.state.accumulator.falseStarts).toBe(1);

    state = advanceToStimulus(isiTap.state, 'green', rng);
    const first = respondChoice(state, state.trial!.shownAtMs + 100, 'tap');
    expect(first.outcome).toBe('correct');
    const spam = respondChoice(first.state, state.trial!.shownAtMs + 120, 'tap');
    expect(spam.outcome).toBe('ignoredSpam');
    expect(spam.state.accumulator.correct).toBe(1);
  });

  it('classifies tap, swipe, and hold from pointer samples using existing swipe rules', () => {
    expect(
      classifyPointerGesture({ dx: 2, dy: 1, elapsedMs: 90, minDistancePx: 26, holdMs: 320 }),
    ).toBe('tap');
    expect(
      classifyPointerGesture({ dx: -48, dy: 4, elapsedMs: 110, minDistancePx: 26, holdMs: 320 }),
    ).toBe('swipeLeft');
    expect(
      classifyPointerGesture({ dx: 52, dy: 2, elapsedMs: 110, minDistancePx: 26, holdMs: 320 }),
    ).toBe('swipeRight');
    expect(
      classifyPointerGesture({ dx: 2, dy: -50, elapsedMs: 110, minDistancePx: 26, holdMs: 320 }),
    ).toBe('swipeUp');
    expect(
      classifyPointerGesture({ dx: 3, dy: 55, elapsedMs: 110, minDistancePx: 26, holdMs: 320 }),
    ).toBe('swipeDown');
    expect(
      classifyPointerGesture({ dx: 3, dy: 2, elapsedMs: 340, minDistancePx: 26, holdMs: 320 }),
    ).toBe('hold');
  });

  it('applies similar-hue difficulty without rewriting the mapping ids', () => {
    const trial = createTrial(
      { ...threeMapConfig(), similarStimuli: true },
      threeMapConfig().ruleSet,
      1,
      createChoiceRng(9),
      false,
      'yellow',
    );
    expect(trial.stimulus.id).toBe('yellow');
    expect(trial.stimulus.color).toBe(SIMILAR_CHOICE_COLORS.yellow);
    expect(trial.stimulus.color).not.toBe(CHOICE_COLORS.yellow);
    expect(trial.expected).toBe('swipeLeft');
  });

  it('keeps sport-pack cues as stimulus data so the engine still scores by mapping id', () => {
    const config: ChoiceRoundConfig = {
      ...threeMapConfig(),
      stimuli: [
        {
          id: 'green',
          kind: 'symbol',
          label: 'COVER 2',
          color: CHOICE_COLORS.green,
          sportCue: { kind: 'coverage', symbol: 'C2' },
        },
      ],
      ruleSet: { id: 'sport', mappings: [{ stimulusId: 'green', response: 'tap' }] },
    };
    const trial = createTrial(config, config.ruleSet, 4, createChoiceRng(2), false, 'green');
    expect(trial.stimulus.sportCue?.symbol).toBe('C2');
    expect(trial.expected).toBe('tap');
  });

  it('reports decision accuracy separately from mean choice RT and switch cost', () => {
    const rng = createChoiceRng(12);
    const config: ChoiceRoundConfig = {
      ...threeMapConfig(),
      switchAfterTrials: 1,
      alternateRuleSet: {
        id: 'switched',
        mappings: [
          { stimulusId: 'green', response: 'swipeRight' },
          { stimulusId: 'yellow', response: 'tap' },
          { stimulusId: 'blue', response: 'swipeLeft' },
        ],
      },
    };
    let state = createChoiceRound(config, 0, rng);
    state = advanceToStimulus(state, 'green', rng);
    state = respondChoice(state, state.trial!.shownAtMs + 180, 'tap').state;
    state = tickChoice(state, state.phaseEndsAtMs, rng).state;
    expect(state.accumulator.switched).toBe(true);
    state = advanceToStimulus(state, 'green', rng);
    expect(state.trial?.expected).toBe('swipeRight');
    state = respondChoice(state, state.trial!.shownAtMs + 320, 'swipeRight').state;

    const metrics = deriveChoiceReactionMetrics(state.accumulator);
    expect(metrics.correct).toBe(2);
    expect(metrics.decisionAccuracyPct).toBe(100);
    expect(metrics.meanChoiceReactionMs).toBe(250);
    expect(metrics.ruleSwitchCostMs).toBe(140);
    expect(metrics.wrongResponseCount).toBe(0);
    expect(metrics).not.toHaveProperty('impulseControlDiagnosis');
  });

  it('keeps Mongoose Read copy centralized and Prime-ready with legend visible', () => {
    expect(getAnimalInstinct('choiceReaction').experienceName).toBe('Mongoose Read');
    expect(getAnimalInstinct('choiceReaction').tagline).toContain('Read first. Move second');
    expect(getChoiceConfigForLadder(0).ruleSet.mappings.map(mapping => mapping.response).every(response =>
      LIVE_CHOICE_RESPONSE_KINDS.includes(response),
    )).toBe(true);
    expect(getChoiceConfigForLadder(0, { prime: true }).ruleSet.keepLegendVisible).toBe(true);
    expect(CHOICE_PRIME_CONFIG.ruleSet.keepLegendVisible).toBe(true);
    expect(getChoiceConfigForLadder(0).ruleSet.keepLegendVisible).toBeFalsy();
  });
});
