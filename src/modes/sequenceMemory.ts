import { Target, GenerateTargetsParams } from '../types/game';

// Locked for v1 — mode is marked comingSoon in the registry.
// The sequence-validation state machine below is scaffolding for a future release.
export const generateTargets = ({
  existingTargets,
  maxTargets = 5,
  targetLifespan = 2.0,
}: GenerateTargetsParams): Target[] => {
  if (existingTargets.length > 0) {
    const now = Date.now();
    const active = existingTargets.filter(
      t => now - t.createdAt < t.lifespan * 1000,
    );
    if (active.length > 0) return active;
  }

  const now = Date.now();
  return Array.from({ length: maxTargets }, (_, i) => ({
    id: `sm-${now}-${i}`,
    x: Math.random() * 80 + 10,
    y: Math.random() * 75 + 15,
    type: 'monkey' as const,
    createdAt: now,
    duration: targetLifespan,
    lifespan: targetLifespan,
  }));
};
