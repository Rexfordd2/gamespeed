import { PrimeContext, PrimeCapabilityId, PrimeProtocol, PrimeRecipe, PrimeRecipeStep, PrimeStep } from '../types/prime';
import { SportType, DEFAULT_SPORT, getSportConfig, isSportType } from './sports';
import {
  GENERAL_POSITION,
  getPositionOption,
  resolvePositionId,
} from './athletePositions';
import {
  GAMESPEED_PRIME_PROTOCOL_ID,
  gamespeedPrimeProtocol,
  getPrimeExecutableSteps,
  registerPrimeProtocol,
  setPrimeRecipeLookup,
} from './primeProtocols';
import { DEFAULT_TRAINING_CONTEXT, TRAINING_CONTEXT_LABELS, isTrainingContext } from '../utils/trainingContext';

export const HIGH_AROUSAL_CAPABILITIES: PrimeCapabilityId[] = ['react', 'control', 'process', 'decide'];

const capabilityStep = (
  capability: PrimeCapabilityId,
  extras: Omit<PrimeRecipeStep, 'capability'> = {},
): PrimeRecipeStep => ({
  capability,
  ...extras,
});

const caps = (...capabilities: PrimeCapabilityId[]): PrimeRecipeStep[] =>
  capabilities.map(capability => capabilityStep(capability));

const recipe = (
  sport: PrimeRecipe['sport'],
  position: string,
  context: PrimeContext,
  steps: PrimeRecipeStep[],
): PrimeRecipe => ({ sport, position, context, steps });

const FULL_PRACTICE = caps('settle', 'see', 'scan', 'react', 'control', 'process', 'decide', 'track', 'move');

const LIFT_STEPS: PrimeRecipeStep[] = [
  capabilityStep('react', { durationSeconds: 30, intensity: 'high' }),
  capabilityStep('track', { durationSeconds: 45, intensity: 'standard' }),
  capabilityStep('settle', { durationSeconds: 45, intensity: 'low' }),
];

const RECOVERY_STEPS: PrimeRecipeStep[] = [
  capabilityStep('settle', { durationSeconds: 90, intensity: 'low' }),
  capabilityStep('see', { durationSeconds: 60, intensity: 'low' }),
  capabilityStep('track', { durationSeconds: 60, intensity: 'low' }),
];

const SKILL_STEPS = caps('scan', 'process', 'decide', 'track');

/**
 * Central Prime recipes. One engine compiles these into PrimeProtocol.
 * Lookup is sport → position → context, then sport/general, then all/general.
 */
export const PRIME_RECIPES: PrimeRecipe[] = [
  recipe('all', GENERAL_POSITION, 'practice', FULL_PRACTICE),
  recipe('all', GENERAL_POSITION, 'game', caps('see', 'scan', 'react', 'decide', 'track', 'move')),
  recipe('all', GENERAL_POSITION, 'lift', LIFT_STEPS),
  recipe('all', GENERAL_POSITION, 'skill', SKILL_STEPS),
  recipe('all', GENERAL_POSITION, 'recovery', RECOVERY_STEPS),

  recipe('soccer', GENERAL_POSITION, 'game', caps('see', 'scan', 'decide', 'track', 'react', 'move')),
  recipe('soccer', GENERAL_POSITION, 'skill', caps('scan', 'process', 'decide', 'track')),
  recipe('soccer', 'keeper', 'game', caps('see', 'track', 'react', 'control', 'decide', 'move')),
  recipe('soccer', 'defender', 'game', caps('see', 'scan', 'control', 'decide', 'move')),
  recipe('soccer', 'midfielder', 'game', caps('scan', 'process', 'decide', 'see', 'track', 'move')),
  recipe('soccer', 'forward', 'game', caps('react', 'see', 'decide', 'track', 'move')),

  recipe('football', GENERAL_POSITION, 'game', caps('see', 'scan', 'decide', 'react', 'control', 'move')),
  recipe('football', GENERAL_POSITION, 'skill', caps('process', 'decide', 'scan', 'control')),
  recipe('football', 'qb', 'game', caps('scan', 'process', 'decide', 'control', 'see', 'move')),
  recipe('football', 'wr_te', 'game', caps('see', 'scan', 'decide', 'track', 'react', 'move')),
  recipe('football', 'rb', 'game', caps('react', 'decide', 'track', 'see', 'move')),
  recipe('football', 'ol', 'game', caps('see', 'control', 'react', 'track', 'move')),
  recipe('football', 'dl', 'game', caps('react', 'control', 'see', 'track', 'move')),
  recipe('football', 'lb', 'game', caps('scan', 'decide', 'react', 'see', 'move')),
  recipe('football', 'db', 'game', caps('see', 'scan', 'decide', 'react', 'track', 'move')),
  recipe('football', 'specialist', 'game', caps('settle', 'see', 'track', 'control', 'move')),

  recipe('basketball', GENERAL_POSITION, 'game', caps('scan', 'decide', 'react', 'see', 'track', 'move')),
  recipe('basketball', GENERAL_POSITION, 'skill', caps('decide', 'scan', 'process', 'react')),
  recipe('basketball', 'guard', 'game', caps('scan', 'decide', 'react', 'see', 'process', 'move')),
  recipe('basketball', 'wing', 'game', caps('see', 'track', 'decide', 'react', 'move')),
  recipe('basketball', 'big', 'game', caps('see', 'control', 'react', 'track', 'move')),

  recipe('baseball_softball', GENERAL_POSITION, 'game', caps('see', 'decide', 'react', 'track', 'move')),
  recipe('baseball_softball', GENERAL_POSITION, 'skill', caps('process', 'see', 'decide', 'track')),
  recipe('baseball_softball', 'hitter', 'game', caps('see', 'decide', 'react', 'track', 'move')),
  recipe('baseball_softball', 'pitcher', 'game', caps('settle', 'control', 'process', 'track', 'move')),
  recipe('baseball_softball', 'infielder', 'game', caps('scan', 'react', 'decide', 'see', 'move')),
  recipe('baseball_softball', 'outfielder', 'game', caps('see', 'track', 'react', 'scan', 'move')),
  recipe('baseball_softball', 'catcher', 'game', caps('process', 'decide', 'control', 'react', 'move')),

  recipe('volleyball', GENERAL_POSITION, 'game', caps('see', 'track', 'react', 'decide', 'move')),
  recipe('volleyball', 'setter', 'game', caps('process', 'decide', 'scan', 'see', 'move')),
  recipe('volleyball', 'hitter', 'game', caps('see', 'react', 'decide', 'track', 'move')),
  recipe('volleyball', 'libero', 'game', caps('see', 'scan', 'react', 'track', 'move')),
  recipe('volleyball', 'blocker', 'game', caps('see', 'control', 'react', 'track', 'move')),

  recipe('boxing', GENERAL_POSITION, 'game', caps('react', 'control', 'see', 'track', 'move')),
  recipe('boxing', 'fighter', 'game', caps('react', 'control', 'see', 'track', 'move')),

  recipe('racquet', GENERAL_POSITION, 'game', caps('track', 'react', 'see', 'decide', 'move')),
  recipe('racquet', 'singles', 'game', caps('track', 'react', 'see', 'decide', 'move')),
  recipe('racquet', 'doubles', 'game', caps('scan', 'see', 'decide', 'react', 'move')),
];

const recipeKey = (sport: string, position: string, context: string) => `${sport}:${position}:${context}`;

const recipesByKey = new Map(PRIME_RECIPES.map(item => [recipeKey(item.sport, item.position, item.context), item]));

const catalogByCapability = (): Record<PrimeCapabilityId, PrimeStep> => {
  const catalog = {} as Record<PrimeCapabilityId, PrimeStep>;
  gamespeedPrimeProtocol.steps.forEach(step => {
    if (step.category !== 'summary') {
      catalog[step.category] = step;
    }
  });
  return catalog;
};

const summaryStep = (): PrimeStep => {
  const step = gamespeedPrimeProtocol.steps.find(item => item.kind === 'summary');
  if (!step) {
    throw new Error('default Prime protocol is missing a summary step');
  }
  return step;
};

export const makePrimeRecipeId = (sport: SportType, position: string, context: PrimeContext): string =>
  `prime:${sport}:${resolvePositionId(sport, position)}:${context}`;

export const parsePrimeRecipeId = (
  id: string,
): { sport: SportType; position: string; context: PrimeContext } | null => {
  if (id === GAMESPEED_PRIME_PROTOCOL_ID) {
    return { sport: DEFAULT_SPORT, position: GENERAL_POSITION, context: 'practice' };
  }
  const parts = id.split(':');
  if (parts.length !== 4 || parts[0] !== 'prime') {
    return null;
  }
  if (!isSportType(parts[1]) || !isTrainingContext(parts[3])) {
    return null;
  }
  return {
    sport: parts[1],
    position: resolvePositionId(parts[1], parts[2]),
    context: parts[3],
  };
};

export interface ResolvedPrimeRecipe {
  recipe: PrimeRecipe;
  requested: { sport: SportType; position: string; context: PrimeContext };
  matched: { sport: PrimeRecipe['sport']; position: string; context: PrimeContext };
  fallbackUsed: boolean;
  recipeId: string;
}

export const findPrimeRecipe = (sport: SportType, position: string, context: PrimeContext): ResolvedPrimeRecipe => {
  const resolvedPosition = resolvePositionId(sport, position);
  const requested = { sport, position: resolvedPosition, context };
  const recipeId = makePrimeRecipeId(sport, resolvedPosition, context);

  const exact = recipesByKey.get(recipeKey(sport, resolvedPosition, context));
  if (exact) {
    return {
      recipe: exact,
      requested,
      matched: { sport: exact.sport, position: exact.position, context: exact.context },
      fallbackUsed: exact.sport !== sport || exact.position !== resolvedPosition,
      recipeId,
    };
  }

  const sportGeneral = recipesByKey.get(recipeKey(sport, GENERAL_POSITION, context));
  if (sportGeneral) {
    return {
      recipe: sportGeneral,
      requested,
      matched: { sport: sportGeneral.sport, position: sportGeneral.position, context: sportGeneral.context },
      fallbackUsed: true,
      recipeId,
    };
  }

  const allGeneral = recipesByKey.get(recipeKey('all', GENERAL_POSITION, context));
  if (allGeneral) {
    return {
      recipe: allGeneral,
      requested,
      matched: { sport: allGeneral.sport, position: allGeneral.position, context: allGeneral.context },
      fallbackUsed: true,
      recipeId,
    };
  }

  const practiceFallback = recipesByKey.get(recipeKey('all', GENERAL_POSITION, 'practice'));
  if (!practiceFallback) {
    throw new Error('Prime recipe catalog is missing the all/general/practice fallback');
  }
  return {
    recipe: practiceFallback,
    requested,
    matched: { sport: 'all', position: GENERAL_POSITION, context: 'practice' },
    fallbackUsed: true,
    recipeId,
  };
};

const compileRecipe = (resolved: ResolvedPrimeRecipe): PrimeProtocol => {
  const catalog = catalogByCapability();
  const compiledSteps: PrimeStep[] = resolved.recipe.steps.map(step => {
    const base = catalog[step.capability];
    if (!base) {
      throw new Error(`unknown Prime capability: ${step.capability}`);
    }
    return {
      ...base,
      durationSeconds: step.durationSeconds ?? base.durationSeconds,
      intensity: step.intensity ?? base.intensity,
    };
  });
  compiledSteps.push(summaryStep());

  const estimatedSeconds = compiledSteps.reduce((total, step) => {
    if (step.kind === 'summary') return total;
    return total + (step.durationSeconds ?? 0);
  }, 0);

  const contextLabel = TRAINING_CONTEXT_LABELS[resolved.requested.context];
  const sportName = getSportConfig(resolved.requested.sport).displayName;
  const positionLabel = getPositionOption(resolved.requested.sport, resolved.requested.position).label;

  const protocol: PrimeProtocol = {
    id: resolved.recipeId,
    name: `${contextLabel} Prime`,
    description: `${sportName} ${positionLabel} ${contextLabel.toLowerCase()} protocol from the shared Prime engine.`,
    estimatedSeconds,
    contexts: [resolved.requested.context],
    steps: compiledSteps,
  };
  registerPrimeProtocol(protocol);
  return protocol;
};

const isDefaultPracticeProtocol = (sport: SportType, position: string, context: PrimeContext): boolean =>
  sport === DEFAULT_SPORT && resolvePositionId(sport, position) === GENERAL_POSITION && context === 'practice';

export const resolvePrimeProtocol = (input?: {
  sport?: SportType;
  position?: string;
  context?: PrimeContext;
}): PrimeProtocol => {
  if (!input) {
    return gamespeedPrimeProtocol;
  }
  const sport = input.sport ?? DEFAULT_SPORT;
  const context = input.context ?? DEFAULT_TRAINING_CONTEXT;
  const position = resolvePositionId(sport, input.position);
  if (isDefaultPracticeProtocol(sport, position, context)) {
    return gamespeedPrimeProtocol;
  }
  return compileRecipe(findPrimeRecipe(sport, position, context));
};

export const compilePrimeRecipeId = (id: string): PrimeProtocol | null => {
  const parsed = parsePrimeRecipeId(id);
  if (!parsed) return null;
  if (id === GAMESPEED_PRIME_PROTOCOL_ID || isDefaultPracticeProtocol(parsed.sport, parsed.position, parsed.context)) {
    return gamespeedPrimeProtocol;
  }
  return compileRecipe(findPrimeRecipe(parsed.sport, parsed.position, parsed.context));
};

setPrimeRecipeLookup(compilePrimeRecipeId);

export const formatPrimeIdentityLine = (sport: SportType, position?: string | null): string => {
  const sportName = getSportConfig(sport).displayName.toUpperCase();
  const resolved = resolvePositionId(sport, position);
  if (resolved === GENERAL_POSITION) {
    return sportName;
  }
  return `${sportName} · ${getPositionOption(sport, resolved).shortLabel.toUpperCase()}`;
};

export const formatPrimeContextHeadline = (context: PrimeContext): string =>
  `${TRAINING_CONTEXT_LABELS[context].toUpperCase()} PRIME`;

export const formatPrimeRecipeIdentity = (input: {
  sport: SportType;
  position?: string | null;
  context: PrimeContext;
  protocolId?: string;
  recipeId?: string;
}): string => {
  const parsed = input.recipeId
    ? parsePrimeRecipeId(input.recipeId)
    : input.protocolId
      ? parsePrimeRecipeId(input.protocolId)
      : null;
  const sport = parsed?.sport ?? input.sport;
  const position = parsed?.position ?? resolvePositionId(sport, input.position);
  const context = parsed?.context ?? input.context;
  return `${formatPrimeIdentityLine(sport, position)} · ${TRAINING_CONTEXT_LABELS[context].toUpperCase()}`;
};

export const getRecipeCapabilityIds = (protocol: PrimeProtocol): PrimeCapabilityId[] =>
  getPrimeExecutableSteps(protocol)
    .map(step => step.category)
    .filter((category): category is PrimeCapabilityId => category !== 'summary');
