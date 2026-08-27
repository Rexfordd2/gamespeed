import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { getAnimalInstinct } from '../config/animalInstincts';
import { getModePresentation } from '../utils/modeDescriptions';
import {
  COMPREHENSION_PRIME_CONFIG,
  getComprehensionConfigForLadder,
  getComprehensionDifficultyReached,
} from '../modes/rapidComprehension';
import { ComprehensionFamily, ComprehensionItem, ComprehensionRoundConfig } from '../types/rapidComprehension';
import {
  COMPREHENSION_FAMILIES,
  MIN_COMPREHENSION_ANSWER_MS,
  MIN_COMPREHENSION_DELAY_MS,
  MIN_COMPREHENSION_DISPLAY_MS,
  createComprehensionItem,
  createComprehensionRng,
  createComprehensionRound,
  deriveComprehensionMetrics,
  normalizeComprehensionConfig,
  respondComprehension,
  tickComprehension,
  validateComprehensionItem,
} from '../utils/rapidComprehensionEngine';

const baseConfig = (extras: Partial<ComprehensionRoundConfig> = {}): ComprehensionRoundConfig => ({
  displayMs: 1200,
  delayMs: 300,
  answerMs: 2400,
  optionCount: 3,
  informationCount: 3,
  distractorCount: 0,
  ruleComplexity: 1,
  families: [...COMPREHENSION_FAMILIES],
  ...extras,
});

const advanceToQuestion = (start: ReturnType<typeof createComprehensionRound>) => {
  const delayed = tickComprehension(start, start.phaseEndsAtMs);
  expect(delayed.state.phase).toBe('delay');
  const asking = tickComprehension(delayed.state, delayed.state.phaseEndsAtMs);
  expect(asking.state.phase).toBe('question');
  return asking.state;
};

describe('rapid comprehension content', () => {
  it('clamps timing so encoding cannot collapse into trivia speed-reading', () => {
    const config = normalizeComprehensionConfig({
      ...baseConfig(),
      displayMs: 80,
      delayMs: 10,
      answerMs: 100,
      optionCount: 9,
      informationCount: 99,
      distractorCount: 40,
    });
    expect(config.displayMs).toBeGreaterThanOrEqual(MIN_COMPREHENSION_DISPLAY_MS);
    expect(config.delayMs).toBeGreaterThanOrEqual(MIN_COMPREHENSION_DELAY_MS);
    expect(config.answerMs).toBeGreaterThanOrEqual(MIN_COMPREHENSION_ANSWER_MS);
    expect(config.optionCount).toBeLessThanOrEqual(4);
    expect(config.informationCount).toBeLessThanOrEqual(5);
    expect(config.distractorCount).toBeLessThanOrEqual(2);
  });

  it('generates a valid item for every content family', () => {
    const rng = createComprehensionRng(42);
    const config = baseConfig({ optionCount: 4, informationCount: 4, distractorCount: 1, ruleComplexity: 2 });
    COMPREHENSION_FAMILIES.forEach(family => {
      const item = createComprehensionItem(config, rng, family, false, 1_000);
      expect(validateComprehensionItem(item)).toEqual([]);
      expect(item.family).toBe(family);
      expect(item.choices.some(choice => choice.id === item.correctChoiceId)).toBe(true);
    });
  });

  it('is deterministic for a given seed', () => {
    const config = baseConfig();
    const a = createComprehensionItem(config, createComprehensionRng(11), 'objectRelationship', false, 500);
    const b = createComprehensionItem(config, createComprehensionRng(11), 'objectRelationship', false, 500);
    expect(a.encodeHeadline).toBe(b.encodeHeadline);
    expect(a.correctChoiceId).toBe(b.correctChoiceId);
    expect(a.choices.map(choice => choice.label)).toEqual(b.choices.map(choice => choice.label));
  });

  it('rejects impossible object, sequence, conditional, and spatial states', () => {
    const objectBad: ComprehensionItem = {
      id: 'bad-object',
      family: 'objectRelationship',
      encodeHeadline: 'Both moved.',
      encodeTokens: [
        { id: 'a', label: 'Yellow triangle', color: '#facc15', motion: 'left' },
        { id: 'b', label: 'Blue circle', color: '#60a5fa', motion: 'right' },
      ],
      question: 'Which object moved?',
      choices: [
        { id: 'a', label: 'Yellow triangle' },
        { id: 'b', label: 'Blue circle' },
      ],
      correctChoiceId: 'a',
    };
    expect(validateComprehensionItem(objectBad).some(error => /exactly one mover/.test(error))).toBe(true);

    const sequenceBad: ComprehensionItem = {
      id: 'bad-seq',
      family: 'sequenceComprehension',
      encodeHeadline: 'A → C → B → D',
      encodeTokens: [],
      encodeSequence: ['A', 'C', 'B', 'D'],
      question: 'What came before A?',
      choices: [
        { id: 'C', label: 'C' },
        { id: 'B', label: 'B' },
      ],
      correctChoiceId: 'C',
    };
    expect(validateComprehensionItem(sequenceBad).some(error => /cannot ask what came before the first/.test(error))).toBe(
      true,
    );

    const conditionalBad: ComprehensionItem = {
      id: 'bad-cond',
      family: 'conditionalRule',
      encodeHeadline: 'Blue flashes twice.',
      encodeTokens: [{ id: 'blue', label: 'Blue ×2', color: '#60a5fa', flashes: 2 }],
      encodeRuleText: 'If blue flashes twice, choose left.',
      question: 'Which way?',
      choices: [
        { id: 'up', label: 'Up' },
        { id: 'down', label: 'Down' },
      ],
      correctChoiceId: 'up',
    };
    expect(validateComprehensionItem(conditionalBad).some(error => /Left or Right/.test(error))).toBe(true);

    const spatialBad: ComprehensionItem = {
      id: 'bad-spatial',
      family: 'spatialComprehension',
      encodeHeadline: 'Green square, top left.',
      encodeTokens: [{ id: 'green-square', label: 'Green square', color: '#4ade80', row: 0, col: 0 }],
      question: 'Where was the green square?',
      choices: [
        { id: 'top-left', label: 'Top left' },
        { id: 'top-right', label: 'Top right' },
      ],
      correctChoiceId: 'top-right',
    };
    expect(validateComprehensionItem(spatialBad).some(error => /occupied slot/.test(error))).toBe(true);
  });

  it('keeps sport-cue substitution optional without changing answer identity', () => {
    const item = createComprehensionItem(
      baseConfig(),
      createComprehensionRng(3),
      'objectRelationship',
      false,
      10,
    );
    const withCue: ComprehensionItem = {
      ...item,
      encodeTokens: item.encodeTokens.map(token => ({
        ...token,
        sportCue: { kind: 'coverage', symbol: 'Cover 2' },
      })),
    };
    expect(validateComprehensionItem(withCue)).toEqual([]);
    expect(withCue.correctChoiceId).toBe(item.correctChoiceId);
  });
});

describe('rapid comprehension trial engine', () => {
  it('scores the correct choice after encoding and delay', () => {
    const start = createComprehensionRound(
      baseConfig({ families: ['objectRelationship'] }),
      1_000,
      createComprehensionRng(5),
      'objectRelationship',
    );
    expect(start.phase).toBe('encoding');
    const asking = advanceToQuestion(start);
    const correctId = asking.trial!.item.correctChoiceId;
    const answered = respondComprehension(asking, asking.trial!.questionAtMs + 180, correctId);
    expect(answered.outcome).toBe('correct');
    expect(answered.state.accumulator.correct).toBe(1);
    expect(answered.state.accumulator.answerReactionTimesMs[0]).toBe(180);
  });

  it('treats taps during encoding as premature, not answers', () => {
    const start = createComprehensionRound(baseConfig({ families: ['sequenceComprehension'] }), 1_000);
    const early = respondComprehension(start, 1_040, start.trial!.item.correctChoiceId);
    expect(early.outcome).toBe('premature');
    expect(early.state.phase).toBe('encoding');
    expect(early.state.accumulator.prematureResponses).toBe(1);
    expect(early.state.accumulator.trialsResolved).toBe(0);
  });

  it('records an encoding failure when the question times out', () => {
    const start = createComprehensionRound(baseConfig({ families: ['spatialComprehension'] }), 1_000);
    const asking = advanceToQuestion(start);
    const timedOut = tickComprehension(asking, asking.trial!.endsAtMs);
    expect(timedOut.outcome).toBe('encodingFailure');
    expect(timedOut.state.accumulator.encodingFailures).toBe(1);
    expect(timedOut.state.accumulator.correct).toBe(0);
  });

  it('answers Left/Right from the presented conditional rule, including after a switch', () => {
    const config = baseConfig({
      families: ['conditionalRule'],
      ruleComplexity: 2,
      switchAfterTrials: 1,
    });
    let state = createComprehensionRound(config, 1_000, createComprehensionRng(9), 'conditionalRule');
    const firstAsking = advanceToQuestion(state);
    const firstCorrect = firstAsking.trial!.item.correctChoiceId;
    expect(firstAsking.trial!.item.encodeRuleText).toMatch(/If blue flashes twice, choose left/);
    state = respondComprehension(firstAsking, firstAsking.trial!.questionAtMs + 90, firstCorrect).state;
    state = tickComprehension(state, state.phaseEndsAtMs).state;
    expect(state.phase).toBe('encoding');
    expect(state.accumulator.switched).toBe(true);
    expect(state.trial!.item.encodeRuleText).toMatch(/If blue flashes twice, choose right/);
    const secondAsking = advanceToQuestion(state);
    const second = respondComprehension(
      secondAsking,
      secondAsking.trial!.questionAtMs + 110,
      secondAsking.trial!.item.correctChoiceId,
    );
    expect(second.outcome).toBe('correct');
  });

  it('derives accuracy, family split, decay, and difficulty from the accumulator', () => {
    let state = createComprehensionRound(baseConfig({ families: ['objectRelationship'] }), 0, createComprehensionRng(2));
    const times = [200, 210, 400, 430];
    times.forEach(rt => {
      const asking = advanceToQuestion(state);
      state = respondComprehension(asking, asking.trial!.questionAtMs + rt, asking.trial!.item.correctChoiceId).state;
      state = tickComprehension(state, state.phaseEndsAtMs).state;
    });
    state = {
      ...state,
      accumulator: { ...state.accumulator, difficultyReached: 2 },
    };
    const metrics = deriveComprehensionMetrics(state.accumulator);
    expect(metrics.trialsResolved).toBe(4);
    expect(metrics.correct).toBe(4);
    expect(metrics.comprehensionAccuracyPct).toBe(100);
    expect(metrics.performanceDecayMs).toBeGreaterThan(0);
    expect(metrics.byFamily.objectRelationship?.attempts).toBe(4);
    expect(metrics.difficultyReached).toBe(2);
    expect(metrics).not.toHaveProperty('iqScore');
  });
});

describe('chameleon read ladder and identity', () => {
  it('changes one difficulty variable per rung', () => {
    const rung0 = getComprehensionConfigForLadder(0);
    const rung1 = getComprehensionConfigForLadder(6);
    const rung2 = getComprehensionConfigForLadder(12);
    const rung3 = getComprehensionConfigForLadder(18);
    const rung4 = getComprehensionConfigForLadder(24);
    const rung5 = getComprehensionConfigForLadder(30);
    const rung6 = getComprehensionConfigForLadder(36);
    const rung7 = getComprehensionConfigForLadder(42);
    expect(getComprehensionDifficultyReached(6)).toBe(1);
    expect(rung1.displayMs).toBeLessThan(rung0.displayMs);
    expect(rung1.informationCount).toBe(rung0.informationCount);
    expect(rung2.informationCount).toBeGreaterThan(rung1.informationCount);
    expect(rung2.displayMs).toBe(rung1.displayMs);
    expect(rung3.delayMs).toBeGreaterThan(rung2.delayMs);
    expect(rung3.informationCount).toBe(rung2.informationCount);
    expect(rung4.optionCount).toBeGreaterThan(rung3.optionCount);
    expect(rung4.delayMs).toBe(rung3.delayMs);
    expect(rung5.distractorCount).toBeGreaterThan(rung4.distractorCount);
    expect(rung5.optionCount).toBe(rung4.optionCount);
    expect(rung6.ruleComplexity).toBe(2);
    expect(rung6.distractorCount).toBe(rung5.distractorCount);
    expect(rung7.switchAfterTrials).toBe(40);
    expect(rung7.ruleComplexity).toBe(2);
    expect(COMPREHENSION_PRIME_CONFIG.families).toEqual(COMPREHENSION_FAMILIES);
  });

  it('keeps Chameleon Read copy athletic and separate from Chameleon Chain', () => {
    expect(getAnimalInstinct('rapidComprehension').experienceName).toBe('Chameleon Read');
    expect(getAnimalInstinct('rapidComprehension').tagline).toBe('Adapt before the picture changes.');
    expect(getAnimalInstinct('sequenceMemory').experienceName).toBe('Chameleon Chain');
    const copy = getModePresentation('rapidComprehension', 'soccer');
    expect(copy.title).toBe('Chameleon Read');
    expect(copy.description).toMatch(/not an IQ test/i);
    expect(copy.description).toMatch(/not a medical cognitive assessment/i);
    expect(copy.whyThisMatters).not.toMatch(/\bIQ\b|diagnos/i);
    expect(copy.whyThisMatters).toMatch(/information/i);
  });

  it('does not call live generative AI APIs', () => {
    const engine = readFileSync('src/utils/rapidComprehensionEngine.ts', 'utf8');
    const mode = readFileSync('src/modes/rapidComprehension.ts', 'utf8');
    const combined = `${engine}\n${mode}`;
    expect(combined).not.toMatch(/openai|anthropic|generativelanguage|api\.openai|fetch\(/i);
  });
});

describe('family answer contracts', () => {
  const families: ComprehensionFamily[] = [...COMPREHENSION_FAMILIES];

  it.each(families)('never ships an invalid %s item across many seeds', family => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const item = createComprehensionItem(
        baseConfig({ optionCount: 4, informationCount: 4, distractorCount: 1, ruleComplexity: 2 }),
        createComprehensionRng(seed * 17),
        family,
        seed % 2 === 0,
        seed * 100,
      );
      expect(validateComprehensionItem(item)).toEqual([]);
    }
  });
});
