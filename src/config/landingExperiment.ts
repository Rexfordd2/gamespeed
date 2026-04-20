export type LandingExperimentVariantId = 'A' | 'B' | 'C';
export type LandingPersonaOrder = ['athlete', 'gamer'] | ['gamer', 'athlete'];
export type LandingHeroLayout = 'single-focus' | 'split';
export type LandingPersona = 'athlete' | 'gamer';

export interface LandingExperimentAssignment {
  id: LandingExperimentVariantId;
  name: string;
  framing: 'athlete-first' | 'gamer-first' | 'split-hero';
  heroLayout: LandingHeroLayout;
  personaOrder: LandingPersonaOrder;
  defaultPersona: LandingPersona | null;
}

const ASSIGNMENT_STORAGE_KEY = 'gamespeed_landing_experiment_assignment_v1';

const ASSIGNMENTS: Record<LandingExperimentVariantId, LandingExperimentAssignment> = {
  A: {
    id: 'A',
    name: 'Athlete-first framing',
    framing: 'athlete-first',
    heroLayout: 'single-focus',
    personaOrder: ['athlete', 'gamer'],
    defaultPersona: 'athlete',
  },
  B: {
    id: 'B',
    name: 'Gamer-first framing',
    framing: 'gamer-first',
    heroLayout: 'single-focus',
    personaOrder: ['gamer', 'athlete'],
    defaultPersona: 'gamer',
  },
  C: {
    id: 'C',
    name: 'Split hero (both visible)',
    framing: 'split-hero',
    heroLayout: 'split',
    personaOrder: ['athlete', 'gamer'],
    defaultPersona: null,
  },
};

const toVariantId = (value: string | undefined): LandingExperimentVariantId | null => {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === 'A' || normalized === 'ATHLETE' || normalized === 'ATHLETE_FIRST') {
    return 'A';
  }
  if (normalized === 'B' || normalized === 'GAMER' || normalized === 'GAMER_FIRST') {
    return 'B';
  }
  if (normalized === 'C' || normalized === 'SPLIT' || normalized === 'SPLIT_HERO') {
    return 'C';
  }
  return null;
};

const computeStableHash = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getStoredAssignment = (): LandingExperimentVariantId | null => {
  try {
    const raw = localStorage.getItem(ASSIGNMENT_STORAGE_KEY);
    return toVariantId(raw ?? undefined);
  } catch {
    return null;
  }
};

const persistAssignment = (variantId: LandingExperimentVariantId) => {
  try {
    localStorage.setItem(ASSIGNMENT_STORAGE_KEY, variantId);
  } catch {
    // Ignore storage errors in private mode.
  }
};

const resolveAutoAssignment = (): LandingExperimentVariantId => {
  const stored = getStoredAssignment();
  if (stored) {
    return stored;
  }

  const seed = `${navigator.userAgent}|${navigator.language}|${window.location.host}`;
  const bucket = computeStableHash(seed) % 3;
  const variantId: LandingExperimentVariantId = bucket === 0 ? 'A' : bucket === 1 ? 'B' : 'C';
  persistAssignment(variantId);
  return variantId;
};

export const getLandingExperimentAssignment = (): LandingExperimentAssignment => {
  const requested = toVariantId(import.meta.env.VITE_LANDING_EXPERIMENT_VARIANT);
  if (requested) {
    return ASSIGNMENTS[requested];
  }
  return ASSIGNMENTS[resolveAutoAssignment()];
};
