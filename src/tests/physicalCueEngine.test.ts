import { describe, expect, it } from 'vitest';
import { PHYSICAL_CUE_IDS } from '../types/physicalCue';
import { PHYSICAL_CUE_VOCABULARY } from '../config/physicalCueVocabulary';
import { jaguarMovementModule } from '../config/physicalCueModules';
import {
  PhysicalCueEngineError,
  cancelPhysicalCueSession,
  confirmPhysicalCueSession,
  createPhysicalCueSession,
  getCurrentPhysicalCue,
  getPhysicalCueMetrics,
  startPhysicalCueSequence,
  tickPhysicalCueSession,
} from '../utils/physicalCueEngine';

describe('physical cue engine', () => {
  it('exposes the full cue vocabulary without requiring every module to use every cue', () => {
    expect(Object.keys(PHYSICAL_CUE_VOCABULARY).sort()).toEqual([...PHYSICAL_CUE_IDS].sort());
    expect(jaguarMovementModule.sequence).toEqual(['left', 'right', 'stick', 'go', 'hold', 'reset']);
    expect(jaguarMovementModule.sequence).not.toContain('jump');
  });

  it('walks briefing → cues → gaps → confirm → athlete-confirmed complete', () => {
    const module = jaguarMovementModule;
    let now = 1_000;
    let state = createPhysicalCueSession(module, now);
    expect(state.phase).toBe('briefing');
    expect(getCurrentPhysicalCue(state, module)).toBeNull();

    now += 200;
    state = startPhysicalCueSequence(state, now);
    expect(state.phase).toBe('cueing');
    expect(getCurrentPhysicalCue(state, module)?.label).toBe('LEFT');
    expect(state.presentedCueCount).toBe(1);

    module.sequence.forEach((cueId, index) => {
      expect(state.phase).toBe('cueing');
      expect(getCurrentPhysicalCue(state, module)?.id).toBe(cueId);
      now += module.cueHoldMs;
      state = tickPhysicalCueSession(state, module, now);
      expect(state.phase).toBe('gap');
      now += module.gapMs;
      state = tickPhysicalCueSession(state, module, now);
      if (index < module.sequence.length - 1) {
        expect(state.phase).toBe('cueing');
        expect(state.presentedCueCount).toBe(index + 2);
      }
    });

    expect(state.phase).toBe('confirming');
    expect(getCurrentPhysicalCue(state, module)).toBeNull();
    now += 50;
    state = confirmPhysicalCueSession(state, now);
    expect(state.phase).toBe('completed');
    expect(state.athleteConfirmed).toBe(true);

    const metrics = getPhysicalCueMetrics(state, module, now);
    expect(metrics).toEqual({
      moduleId: 'jaguar-movement',
      cueCount: 6,
      presentedCueCount: 6,
      cueIntervalMs: module.cueHoldMs + module.gapMs,
      athleteConfirmed: true,
      durationMs: now - 1_200,
    });
    expect(metrics).not.toHaveProperty('quality');
    expect(metrics).not.toHaveProperty('accuracy');
    expect(metrics).not.toHaveProperty('formScore');
    expect(JSON.stringify(metrics)).not.toMatch(/movement-quality|verified|diagnos/i);
  });

  it('catches up when a tick overshoots hold and gap', () => {
    const module = jaguarMovementModule;
    const started = startPhysicalCueSequence(createPhysicalCueSession(module, 0), 0);
    const jumped = tickPhysicalCueSession(started, module, module.cueHoldMs + module.gapMs + 80);
    expect(jumped.phase).toBe('cueing');
    expect(getCurrentPhysicalCue(jumped, module)?.id).toBe('right');
    expect(jumped.presentedCueCount).toBe(2);
  });

  it('does not start cues twice and can cancel before confirmation', () => {
    const module = jaguarMovementModule;
    const briefing = createPhysicalCueSession(module, 1);
    const running = startPhysicalCueSequence(briefing, 2);
    expect(() => startPhysicalCueSequence(running, 3)).toThrow(PhysicalCueEngineError);
    const cancelled = cancelPhysicalCueSession(running, 4);
    expect(cancelled.phase).toBe('cancelled');
    expect(cancelled.athleteConfirmed).toBe(false);
    expect(getPhysicalCueMetrics(cancelled, module, 4).presentedCueCount).toBe(1);
  });

  it('refuses confirm until the sequence is finished', () => {
    const briefing = createPhysicalCueSession(jaguarMovementModule, 1);
    expect(() => confirmPhysicalCueSession(briefing, 2)).toThrow(/cannot confirm/);
  });
});
