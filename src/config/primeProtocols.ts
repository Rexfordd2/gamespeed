import { GameModeType } from '../types/game';
import { PrimeProtocol, PrimeStep } from '../types/prime';
import { isModePlayable } from '../utils/gameModes';

const drillStep = (
  step: Omit<PrimeStep, 'kind'> & { modeId: GameModeType },
): PrimeStep => ({
  ...step,
  kind: 'drill',
  skippable: step.skippable ?? false,
});

export const GAMESPEED_PRIME_PROTOCOL_ID = 'gamespeed-prime-v1';

/**
 * Initial Prime protocol uses only existing playable modes.
 * Durations follow the current 60-second round contract.
 */
export const gamespeedPrimeProtocol: PrimeProtocol = {
  id: GAMESPEED_PRIME_PROTOCOL_ID,
  name: 'GameSpeed Prime',
  description: 'A short pre-performance sequence: settle, see, scan, react, control, decide, track, then a physical ready cue.',
  estimatedSeconds: 460,
  contexts: ['practice', 'game', 'lift', 'skill', 'recovery'],
  steps: [
    drillStep({
      id: 'settle',
      category: 'settle',
      title: 'Settle',
      experienceName: 'Crocodile Stillness',
      modeId: 'calmFocus',
      durationSeconds: 60,
      intensity: 'low',
      instruction: 'Slow the eyes. Tap only when the cue is clean. This is composure, not a sprint.',
    }),
    drillStep({
      id: 'see',
      category: 'see',
      title: 'See',
      experienceName: 'Owl Vision',
      modeId: 'peripheralPulse',
      durationSeconds: 60,
      intensity: 'standard',
      instruction: 'Keep the head quiet and pick up edge cues without chasing them.',
    }),
    drillStep({
      id: 'scan',
      category: 'scan',
      title: 'Scan',
      experienceName: 'Macaw Scan',
      modeId: 'schulteScan',
      durationSeconds: 60,
      intensity: 'standard',
      instruction: 'Find the signal inside the noise. Tap the next live cell in order — do not chase the whole grid.',
    }),
    drillStep({
      id: 'react',
      category: 'react',
      title: 'React',
      experienceName: 'Cobra Strike',
      modeId: 'quickTap',
      durationSeconds: 60,
      intensity: 'high',
      instruction: 'Answer the first clean cue. Fast, then reset.',
    }),
    drillStep({
      id: 'control',
      category: 'control',
      title: 'Control',
      experienceName: 'Caiman Control',
      modeId: 'goNoGo',
      durationSeconds: 60,
      intensity: 'high',
      instruction: 'Still until the moment is real. Strike the live cue. Hold the fake. Speed is useless if the response is wrong.',
    }),
    drillStep({
      id: 'decide',
      category: 'decide',
      title: 'Decide',
      experienceName: 'Jaguar Hunt',
      modeId: 'multiTarget',
      durationSeconds: 60,
      intensity: 'high',
      instruction: 'Scan the wave, choose an order, and commit without panic taps.',
    }),
    drillStep({
      id: 'track',
      category: 'track',
      title: 'Track',
      experienceName: 'Anaconda Lock',
      modeId: 'holdTrack',
      durationSeconds: 60,
      intensity: 'standard',
      instruction: 'Stay locked on the moving cue. Smooth pressure beats a hard stab.',
    }),
    {
      id: 'move',
      category: 'move',
      kind: 'movement',
      title: 'Move',
      experienceName: 'First-Step Plant',
      durationSeconds: 20,
      intensity: 'low',
      skippable: true,
      instruction:
        'Stand tall. Eyes quiet. One easy athletic plant — no jump, no max effort. Link the last read to your body.',
    },
    {
      id: 'summary',
      category: 'summary',
      kind: 'summary',
      title: 'Summary',
      experienceName: "You're Primed",
      instruction: 'Review what this session actually captured.',
    },
  ],
};

export const primeProtocols: PrimeProtocol[] = [gamespeedPrimeProtocol];

export const getPrimeProtocol = (id: string): PrimeProtocol =>
  primeProtocols.find(protocol => protocol.id === id) ?? gamespeedPrimeProtocol;

export const resolvePrimeProtocol = (): PrimeProtocol => gamespeedPrimeProtocol;

export const getPrimeExecutableSteps = (protocol: PrimeProtocol): PrimeStep[] =>
  protocol.steps.filter(step => step.kind !== 'summary');

export const validatePrimeProtocol = (protocol: PrimeProtocol): string[] => {
  const errors: string[] = [];
  if (!protocol.id) errors.push('protocol id is required');
  if (!protocol.name.trim()) errors.push('protocol name is required');
  if (!protocol.steps.length) errors.push('protocol must include steps');
  if (protocol.estimatedSeconds <= 0) errors.push('estimatedSeconds must be > 0');

  const seen = new Set<string>();
  const drillSteps = protocol.steps.filter(step => step.kind === 'drill');
  if (drillSteps.length === 0) errors.push('protocol must include at least one drill step');

  protocol.steps.forEach((step, index) => {
    if (!step.id) errors.push(`step #${index} is missing id`);
    if (step.id && seen.has(step.id)) errors.push(`duplicate step id: ${step.id}`);
    if (step.id) seen.add(step.id);
    if (step.kind === 'drill') {
      if (!step.modeId) errors.push(`${step.id || `step#${index}`} drill is missing modeId`);
      else if (!isModePlayable(step.modeId)) {
        errors.push(`${step.id}: mode ${step.modeId} is not playable`);
      }
    }
    if (step.kind === 'movement' && step.modeId) {
      errors.push(`${step.id}: movement steps cannot bind a modeId yet`);
    }
    if (step.durationSeconds !== undefined && step.durationSeconds <= 0) {
      errors.push(`${step.id}: durationSeconds must be > 0`);
    }
  });

  return errors;
};
