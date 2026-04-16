import { Target, GenerateTargetsParams } from '../types/game';

/**
 * Reaction Benchmark mode generator.
 * Produces one static target at a time with a 1.2s window.
 * Paired with a 2000ms targetInterval in the mode config, this creates ~200ms
 * gaps between stimuli — paced and deliberate, distinct from Quick Tap.
 * The game config sets roundSeconds: 45 for a fixed ~22-stimulus protocol.
 */
export const generateTargets = ({
  screenSize,
  existingTargets,
  maxTargets = 1,
  targetLifespan = 1.2,
}: GenerateTargetsParams): Target[] => {
  if (existingTargets.length > 0) {
    const now = Date.now();
    const active = existingTargets.filter(
      t => now - t.createdAt < t.lifespan * 1000,
    );
    if (active.length >= maxTargets) return active;
  }

  const now = Date.now();
  const compactViewport = screenSize.width <= 768;
  const xMarginPercent = compactViewport ? 16 : 11;
  const yMarginPercent = 15;
  const xRange = 100 - xMarginPercent * 2;
  const yRange = 100 - yMarginPercent * 2;
  const x = Math.random() * xRange + xMarginPercent;
  const y = Math.random() * yRange + yMarginPercent;

  return [
    {
      id: `rb-${now}`,
      x,
      y,
      type: 'monkey',
      createdAt: now,
      duration: targetLifespan,
      lifespan: targetLifespan,
    },
  ];
};
