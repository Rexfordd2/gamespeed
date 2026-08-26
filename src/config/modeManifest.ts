import { SportModeCueKey } from './sportPacks';
import { SportType } from './sports';
import { GameModeType, ModeAvailability } from '../types/game';
import { resolveModeIconAsset } from './assetRegistry';

export type ModeGameplayMechanicType = 'tap' | 'swipe' | 'hold' | 'sequence' | 'scan' | 'inhibit' | 'choice';
export type ModeScoringModel =
  | 'standardAccuracy'
  | 'benchmarkComposite'
  | 'directionalTiming'
  | 'stabilityLock'
  | 'sequenceRecall'
  | 'scanSequence'
  | 'inhibitionControl'
  | 'choiceReaction';
export type ModeTargetRendererKey =
  | 'standardTarget'
  | 'sequenceTargets'
  | 'schulteGrid'
  | 'goNoGoStimulus'
  | 'choiceStimulus';
export type ModeIconRef =
  | 'benchmarkStopwatch'
  | 'quickTapBolt'
  | 'multiTargetCluster'
  | 'swipeArrow'
  | 'holdFocus'
  | 'sequenceNodes'
  | 'peripheralRadar'
  | 'calmLotus'
  | 'macawGrid'
  | 'caimanHold'
  | 'mongooseRead'
  | 'defaultMode';
export type ModeCueTemplateRef =
  | 'sequenceVocabularyFocus'
  | 'sequenceVocabularyTactical'
  | 'sequenceVocabularyReset'
  | 'swipeDirectionPair'
  | 'holdTrackLock';

export interface ModeCueTemplateConfig {
  focus: ModeCueTemplateRef;
  tactical: ModeCueTemplateRef;
  reset: ModeCueTemplateRef;
}

export interface ModeHudLayoutFlags {
  showProtocolPill: boolean;
  showSwipeTimingFeedback: boolean;
  showHoldLockFeedback: boolean;
  showSequencePhasePanel: boolean;
}

export interface ModeAudioCueHooks {
  onSwipeSpawnByDirection?: true;
  onHoldStart?: SportModeCueKey;
  sequencePhase?: {
    preview: SportModeCueKey;
    input: SportModeCueKey;
    success: SportModeCueKey;
    failure: SportModeCueKey;
  };
}

export interface ModeDefaults {
  maxTargets: number;
  targetIntervalMs: number;
  targetLifespanSeconds: number;
  roundSeconds?: number;
  difficultyPreset: 'baseline' | 'speed' | 'tracking' | 'memory';
}

export interface ModeManifest {
  id: GameModeType;
  displayName: string;
  description: string;
  availability: ModeAvailability;
  category?: 'drill' | 'benchmark';
  supportedSports: 'all' | SportType[];
  iconRef: ModeIconRef;
  gameplayMechanicType: ModeGameplayMechanicType;
  cueTemplates: ModeCueTemplateConfig;
  scoringModel: ModeScoringModel;
  hudLayoutFlags: ModeHudLayoutFlags;
  targetRendererKey: ModeTargetRendererKey;
  audioCueHooks: ModeAudioCueHooks;
  defaults: ModeDefaults;
}

export interface ModeManifestValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ModeManifestSeed
  extends Omit<ModeManifest, 'cueTemplates' | 'hudLayoutFlags' | 'audioCueHooks'> {
  cueTemplates?: Partial<ModeCueTemplateConfig>;
  hudLayoutFlags?: Partial<ModeHudLayoutFlags>;
  audioCueHooks?: ModeAudioCueHooks;
}

export interface RegisteredModeManifest {
  byId: Record<GameModeType, ModeManifest>;
  orderedIds: GameModeType[];
  registrationErrors: string[];
}

export const DEFAULT_MODE_MANIFEST_ID: GameModeType = 'quickTap';

const gameplayMechanicTypes: ModeGameplayMechanicType[] = [
  'tap',
  'swipe',
  'hold',
  'sequence',
  'scan',
  'inhibit',
  'choice',
];
const scoringModels: ModeScoringModel[] = [
  'standardAccuracy',
  'benchmarkComposite',
  'directionalTiming',
  'stabilityLock',
  'sequenceRecall',
  'scanSequence',
  'inhibitionControl',
  'choiceReaction',
];
const targetRendererKeys: ModeTargetRendererKey[] = [
  'standardTarget',
  'sequenceTargets',
  'schulteGrid',
  'goNoGoStimulus',
  'choiceStimulus',
];
const cueTemplateRefs: ModeCueTemplateRef[] = [
  'sequenceVocabularyFocus',
  'sequenceVocabularyTactical',
  'sequenceVocabularyReset',
  'swipeDirectionPair',
  'holdTrackLock',
];
const iconRefs: ModeIconRef[] = [
  'benchmarkStopwatch',
  'quickTapBolt',
  'multiTargetCluster',
  'swipeArrow',
  'holdFocus',
  'sequenceNodes',
  'peripheralRadar',
  'calmLotus',
  'macawGrid',
  'caimanHold',
  'mongooseRead',
  'defaultMode',
];
const modeDifficultyPresets: ModeDefaults['difficultyPreset'][] = [
  'baseline',
  'speed',
  'tracking',
  'memory',
];
const supportedCategories: NonNullable<ModeManifest['category']>[] = ['drill', 'benchmark'];
const sportModeCueKeys: SportModeCueKey[] = [
  'swipe-left',
  'swipe-right',
  'swipe-up',
  'swipe-down',
  'hold-lock',
  'sequence-preview',
  'sequence-input',
  'sequence-success',
  'sequence-fail',
];
const modeAvailabilities: ModeAvailability[] = ['playable', 'comingSoon'];

const modeGameplayMechanicTypeSet = new Set<ModeGameplayMechanicType>(gameplayMechanicTypes);
const modeScoringModelSet = new Set<ModeScoringModel>(scoringModels);
const modeTargetRendererSet = new Set<ModeTargetRendererKey>(targetRendererKeys);
const modeCueTemplateRefSet = new Set<ModeCueTemplateRef>(cueTemplateRefs);
const modeIconRefSet = new Set<ModeIconRef>(iconRefs);
const modeDifficultyPresetSet = new Set<ModeDefaults['difficultyPreset']>(modeDifficultyPresets);
const modeCategorySet = new Set<NonNullable<ModeManifest['category']>>(supportedCategories);
const sportModeCueKeySet = new Set<SportModeCueKey>(sportModeCueKeys);
const modeAvailabilitySet = new Set<ModeAvailability>(modeAvailabilities);

const modeIconGlyphRegistry: Record<ModeIconRef, string> = {
  benchmarkStopwatch: '⏱',
  quickTapBolt: '⚡',
  multiTargetCluster: '◎',
  swipeArrow: '↔',
  holdFocus: '◉',
  sequenceNodes: '⋯',
  peripheralRadar: '◌',
  calmLotus: '☯',
  macawGrid: '▦',
  caimanHold: '▬',
  mongooseRead: '◈',
  defaultMode: '•',
};

const requiredHudFlags: (keyof ModeHudLayoutFlags)[] = [
  'showProtocolPill',
  'showSwipeTimingFeedback',
  'showHoldLockFeedback',
  'showSequencePhasePanel',
];

const defaultCueTemplates: ModeCueTemplateConfig = {
  focus: 'sequenceVocabularyFocus',
  tactical: 'sequenceVocabularyTactical',
  reset: 'sequenceVocabularyReset',
};
const defaultHudLayoutFlags: ModeHudLayoutFlags = {
  showProtocolPill: true,
  showSwipeTimingFeedback: false,
  showHoldLockFeedback: false,
  showSequencePhasePanel: false,
};

const hasDuplicates = <T extends string>(values: T[]) => new Set(values).size !== values.length;

export const defineModeManifest = (seed: ModeManifestSeed): ModeManifest => ({
  ...seed,
  cueTemplates: {
    ...defaultCueTemplates,
    ...seed.cueTemplates,
  },
  hudLayoutFlags: {
    ...defaultHudLayoutFlags,
    ...seed.hudLayoutFlags,
  },
  audioCueHooks: {
    ...seed.audioCueHooks,
  },
});

export const validateModeManifest = (manifest: ModeManifest): ModeManifestValidationResult => {
  const errors: string[] = [];

  if (!manifest.id) errors.push('mode id is required');
  if (!manifest.displayName?.trim()) errors.push('display name is required');
  if (!manifest.description?.trim()) errors.push('description is required');
  if (!manifest.defaults) errors.push('defaults are required');
  if (!modeAvailabilitySet.has(manifest.availability)) {
    errors.push('availability must be a valid mode availability');
  }
  if (manifest.category && !modeCategorySet.has(manifest.category)) {
    errors.push('category must be "drill" or "benchmark" when provided');
  }
  if (!modeIconRefSet.has(manifest.iconRef)) {
    errors.push('icon reference is required');
  }
  if (!modeGameplayMechanicTypeSet.has(manifest.gameplayMechanicType)) {
    errors.push('gameplay mechanic type is required');
  }
  if (!modeScoringModelSet.has(manifest.scoringModel)) {
    errors.push('scoring model is required');
  }
  if (!modeTargetRendererSet.has(manifest.targetRendererKey)) {
    errors.push('target renderer key is required');
  }

  if (
    manifest.supportedSports !== 'all' &&
    (!Array.isArray(manifest.supportedSports) || manifest.supportedSports.length === 0)
  ) {
    errors.push('supported sports must be "all" or a non-empty array');
  }

  if (
    Array.isArray(manifest.supportedSports) &&
    hasDuplicates(manifest.supportedSports)
  ) {
    errors.push('supported sports contain duplicates');
  }

  const defaults = manifest.defaults;
  if (defaults) {
    if (defaults.maxTargets <= 0) errors.push('defaults.maxTargets must be > 0');
    if (defaults.targetIntervalMs <= 0) errors.push('defaults.targetIntervalMs must be > 0');
    if (defaults.targetLifespanSeconds <= 0) errors.push('defaults.targetLifespanSeconds must be > 0');
    if (defaults.roundSeconds !== undefined && defaults.roundSeconds <= 0) {
      errors.push('defaults.roundSeconds must be > 0 when provided');
    }
    if (!modeDifficultyPresetSet.has(defaults.difficultyPreset)) {
      errors.push('defaults.difficultyPreset must be a valid preset');
    }
  }

  requiredHudFlags.forEach(flag => {
    if (typeof manifest.hudLayoutFlags?.[flag] !== 'boolean') {
      errors.push(`hudLayoutFlags.${flag} must be boolean`);
    }
  });

  if (!manifest.cueTemplates?.focus || !manifest.cueTemplates?.tactical || !manifest.cueTemplates?.reset) {
    errors.push('cue templates must define focus, tactical, and reset');
  }
  if (manifest.cueTemplates) {
    if (!modeCueTemplateRefSet.has(manifest.cueTemplates.focus)) {
      errors.push('cueTemplates.focus must be valid');
    }
    if (!modeCueTemplateRefSet.has(manifest.cueTemplates.tactical)) {
      errors.push('cueTemplates.tactical must be valid');
    }
    if (!modeCueTemplateRefSet.has(manifest.cueTemplates.reset)) {
      errors.push('cueTemplates.reset must be valid');
    }
  }

  if (
    manifest.audioCueHooks.onSwipeSpawnByDirection !== undefined &&
    manifest.audioCueHooks.onSwipeSpawnByDirection !== true
  ) {
    errors.push('audioCueHooks.onSwipeSpawnByDirection must be true when provided');
  }
  if (
    manifest.audioCueHooks.onHoldStart &&
    !sportModeCueKeySet.has(manifest.audioCueHooks.onHoldStart)
  ) {
    errors.push('audioCueHooks.onHoldStart must be a known sport mode cue key');
  }
  if (manifest.audioCueHooks.sequencePhase) {
    const { preview, input, success, failure } = manifest.audioCueHooks.sequencePhase;
    if (!sportModeCueKeySet.has(preview)) {
      errors.push('audioCueHooks.sequencePhase.preview must be a known cue key');
    }
    if (!sportModeCueKeySet.has(input)) {
      errors.push('audioCueHooks.sequencePhase.input must be a known cue key');
    }
    if (!sportModeCueKeySet.has(success)) {
      errors.push('audioCueHooks.sequencePhase.success must be a known cue key');
    }
    if (!sportModeCueKeySet.has(failure)) {
      errors.push('audioCueHooks.sequencePhase.failure must be a known cue key');
    }
  }

  return { valid: errors.length === 0, errors };
};

export const registerModeManifests = (manifests: ModeManifest[]): RegisteredModeManifest => {
  const byId = {} as Record<GameModeType, ModeManifest>;
  const orderedIds: GameModeType[] = [];
  const registrationErrors: string[] = [];
  const seenIds = new Set<GameModeType>();

  manifests.forEach((manifest, index) => {
    const { valid, errors } = validateModeManifest(manifest);
    if (!valid) {
      registrationErrors.push(
        `[${manifest.id ?? `manifest#${index}`}]: ${errors.join(', ')}`,
      );
      return;
    }

    if (seenIds.has(manifest.id)) {
      registrationErrors.push(`[${manifest.id}]: duplicate manifest id`);
      return;
    }

    seenIds.add(manifest.id);
    byId[manifest.id] = manifest;
    orderedIds.push(manifest.id);
  });

  return { byId, orderedIds, registrationErrors };
};

const modeManifestSeeds: ModeManifestSeed[] = [
  {
    id: 'reactionBenchmark',
    displayName: 'Reaction Benchmark',
    description: 'Fixed 60-second readiness test. One paced stimulus every 2s with full reaction-time tracking.',
    availability: 'playable',
    category: 'benchmark',
    supportedSports: 'all',
    iconRef: 'benchmarkStopwatch',
    gameplayMechanicType: 'tap',
    scoringModel: 'benchmarkComposite',
    targetRendererKey: 'standardTarget',
    defaults: {
      maxTargets: 1,
      targetIntervalMs: 2000,
      targetLifespanSeconds: 1.2,
      roundSeconds: 60,
      difficultyPreset: 'baseline',
    },
  },
  {
    id: 'quickTap',
    displayName: 'Quick Tap',
    description: 'Explosive reaction drill. Hit each visual cue before it disappears.',
    availability: 'playable',
    category: 'drill',
    supportedSports: 'all',
    iconRef: 'quickTapBolt',
    gameplayMechanicType: 'tap',
    scoringModel: 'standardAccuracy',
    targetRendererKey: 'standardTarget',
    defaults: {
      maxTargets: 1,
      targetIntervalMs: 400,
      targetLifespanSeconds: 1.5,
      difficultyPreset: 'speed',
    },
  },
  {
    id: 'multiTarget',
    displayName: 'Multi Target',
    description: 'Decision-speed wave drill. Clear every cue before the timer collapses.',
    availability: 'playable',
    category: 'drill',
    supportedSports: 'all',
    iconRef: 'multiTargetCluster',
    gameplayMechanicType: 'tap',
    scoringModel: 'standardAccuracy',
    targetRendererKey: 'standardTarget',
    defaults: {
      maxTargets: 5,
      targetIntervalMs: 600,
      targetLifespanSeconds: 2.5,
      difficultyPreset: 'baseline',
    },
  },
  {
    id: 'swipeStrike',
    displayName: 'Swipe Strike',
    description: 'Read directional cues and commit inside the active response window.',
    availability: 'playable',
    category: 'drill',
    supportedSports: 'all',
    iconRef: 'swipeArrow',
    gameplayMechanicType: 'swipe',
    cueTemplates: {
      tactical: 'swipeDirectionPair',
    },
    scoringModel: 'directionalTiming',
    hudLayoutFlags: {
      showSwipeTimingFeedback: true,
    },
    targetRendererKey: 'standardTarget',
    audioCueHooks: {
      onSwipeSpawnByDirection: true,
    },
    defaults: {
      maxTargets: 1,
      targetIntervalMs: 900,
      targetLifespanSeconds: 2.1,
      difficultyPreset: 'speed',
    },
  },
  {
    id: 'holdTrack',
    displayName: 'Hold Track',
    description: 'Stabilize contact on a moving cue until the hold meter fully locks.',
    availability: 'playable',
    category: 'drill',
    supportedSports: 'all',
    iconRef: 'holdFocus',
    gameplayMechanicType: 'hold',
    cueTemplates: {
      focus: 'holdTrackLock',
    },
    scoringModel: 'stabilityLock',
    hudLayoutFlags: {
      showHoldLockFeedback: true,
    },
    targetRendererKey: 'standardTarget',
    audioCueHooks: {
      onHoldStart: 'hold-lock',
    },
    defaults: {
      maxTargets: 1,
      targetIntervalMs: 1150,
      targetLifespanSeconds: 3.2,
      difficultyPreset: 'tracking',
    },
  },
  {
    id: 'sequenceMemory',
    displayName: 'Sequence Memory',
    description: 'Preview a short cue pattern, then replay it in exact order under pace.',
    availability: 'playable',
    category: 'drill',
    supportedSports: 'all',
    iconRef: 'sequenceNodes',
    gameplayMechanicType: 'sequence',
    scoringModel: 'sequenceRecall',
    hudLayoutFlags: {
      showSequencePhasePanel: true,
    },
    targetRendererKey: 'sequenceTargets',
    audioCueHooks: {
      sequencePhase: {
        preview: 'sequence-preview',
        input: 'sequence-input',
        success: 'sequence-success',
        failure: 'sequence-fail',
      },
    },
    defaults: {
      maxTargets: 3,
      targetIntervalMs: 500,
      targetLifespanSeconds: 120,
      difficultyPreset: 'memory',
    },
  },
  {
    id: 'peripheralPulse',
    displayName: 'Peripheral Pulse',
    description: 'Dual-lane visual scan drill. Pick up edge cues without losing central composure.',
    availability: 'playable',
    category: 'drill',
    supportedSports: 'all',
    iconRef: 'peripheralRadar',
    gameplayMechanicType: 'tap',
    scoringModel: 'standardAccuracy',
    targetRendererKey: 'standardTarget',
    defaults: {
      maxTargets: 2,
      targetIntervalMs: 750,
      targetLifespanSeconds: 1.85,
      difficultyPreset: 'tracking',
    },
  },
  {
    id: 'calmFocus',
    displayName: 'Calm Focus',
    description: 'Low-arousal precision mode. Slow visual cadence built for mental solitude and control.',
    availability: 'playable',
    category: 'drill',
    supportedSports: 'all',
    iconRef: 'calmLotus',
    gameplayMechanicType: 'tap',
    scoringModel: 'standardAccuracy',
    targetRendererKey: 'standardTarget',
    defaults: {
      maxTargets: 1,
      targetIntervalMs: 1150,
      targetLifespanSeconds: 2.6,
      difficultyPreset: 'baseline',
    },
  },
  {
    id: 'schulteScan',
    displayName: 'Macaw Scan',
    description: 'Dynamic visual-search grid. Find the next signal inside the noise without chasing the whole field.',
    availability: 'playable',
    category: 'drill',
    supportedSports: 'all',
    iconRef: 'macawGrid',
    gameplayMechanicType: 'scan',
    scoringModel: 'scanSequence',
    targetRendererKey: 'schulteGrid',
    defaults: {
      maxTargets: 25,
      targetIntervalMs: 1000,
      targetLifespanSeconds: 60,
      roundSeconds: 60,
      difficultyPreset: 'tracking',
    },
  },
  {
    id: 'goNoGo',
    displayName: 'Caiman Control',
    description: 'Inhibitory-control drill. Strike the live cue. Hold the fake. Speed only counts when the moment is real.',
    availability: 'playable',
    category: 'drill',
    supportedSports: 'all',
    iconRef: 'caimanHold',
    gameplayMechanicType: 'inhibit',
    scoringModel: 'inhibitionControl',
    targetRendererKey: 'goNoGoStimulus',
    defaults: {
      maxTargets: 1,
      targetIntervalMs: 800,
      targetLifespanSeconds: 0.9,
      roundSeconds: 60,
      difficultyPreset: 'speed',
    },
  },
  {
    id: 'choiceReaction',
    displayName: 'Mongoose Read',
    description:
      'Choice-reaction drill. Read the cue, then select the matching response. Fast is only useful when the decision is right.',
    availability: 'playable',
    category: 'drill',
    supportedSports: 'all',
    iconRef: 'mongooseRead',
    gameplayMechanicType: 'choice',
    scoringModel: 'choiceReaction',
    targetRendererKey: 'choiceStimulus',
    defaults: {
      maxTargets: 1,
      targetIntervalMs: 800,
      targetLifespanSeconds: 0.9,
      roundSeconds: 60,
      difficultyPreset: 'speed',
    },
  },
];

export const modeManifestEntries: ModeManifest[] = modeManifestSeeds.map(defineModeManifest);

export const modeManifestRegistry = registerModeManifests(modeManifestEntries);

export const modeManifestOrder = modeManifestRegistry.orderedIds;

export const getModeManifest = (mode: GameModeType): ModeManifest =>
  modeManifestRegistry.byId[mode] ?? modeManifestRegistry.byId[DEFAULT_MODE_MANIFEST_ID];

export const getModeIconGlyph = (iconRef: ModeIconRef | undefined) =>
  (iconRef && modeIconGlyphRegistry[iconRef]) || modeIconGlyphRegistry.defaultMode;

export const getModeIconVisual = (mode: GameModeType) => {
  const asset = resolveModeIconAsset(mode);
  return {
    path: asset.path,
    glyph: asset.fallbackGlyph || getModeIconGlyph(getModeManifest(mode).iconRef),
  };
};

export const resolveModeIcon = (mode: GameModeType) => {
  return getModeIconVisual(mode).glyph;
};

export const isModeSupportedForSport = (mode: GameModeType, sport: SportType) => {
  const supported = getModeManifest(mode).supportedSports;
  return supported === 'all' || supported.includes(sport);
};

export const getSupportedModesForSport = (sport: SportType) =>
  modeManifestOrder.filter(mode => isModeSupportedForSport(mode, sport));

export const hasModeCueTemplate = (mode: GameModeType, template: ModeCueTemplateRef) => {
  const cueTemplates = getModeManifest(mode).cueTemplates;
  return (
    cueTemplates.focus === template ||
    cueTemplates.tactical === template ||
    cueTemplates.reset === template
  );
};

export const hasModeAudioCueHook = (
  mode: GameModeType,
  hook: 'onSwipeSpawnByDirection' | 'onHoldStart' | 'sequencePhase',
) => {
  if (hook === 'onSwipeSpawnByDirection') return resolveModeAudioCueHook(mode, hook) === true;
  if (hook === 'onHoldStart') return Boolean(resolveModeAudioCueHook(mode, hook));
  return Boolean(resolveModeAudioCueHook(mode, hook));
};

export const resolveModeCueTemplate = (
  mode: GameModeType,
  templateSlot: keyof ModeCueTemplateConfig,
): ModeCueTemplateRef => getModeManifest(mode).cueTemplates[templateSlot];

export function resolveModeAudioCueHook(
  mode: GameModeType,
  hook: 'onSwipeSpawnByDirection',
): ModeAudioCueHooks['onSwipeSpawnByDirection'];
export function resolveModeAudioCueHook(
  mode: GameModeType,
  hook: 'onHoldStart',
): ModeAudioCueHooks['onHoldStart'];
export function resolveModeAudioCueHook(
  mode: GameModeType,
  hook: 'sequencePhase',
): ModeAudioCueHooks['sequencePhase'];
export function resolveModeAudioCueHook(
  mode: GameModeType,
  hook: keyof ModeAudioCueHooks,
) {
  return getModeManifest(mode).audioCueHooks[hook];
}

export const resolveModeRoundSeconds = (mode: GameModeType) =>
  getModeManifest(mode).defaults.roundSeconds;

export const resolveModeDifficultyPreset = (mode: GameModeType) =>
  getModeManifest(mode).defaults.difficultyPreset;
