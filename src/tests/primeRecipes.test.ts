import { describe, expect, it } from 'vitest';
import { GAMESPEED_PRIME_PROTOCOL_ID, gamespeedPrimeProtocol, validatePrimeProtocol } from '../config/primeProtocols';
import {
  HIGH_AROUSAL_CAPABILITIES,
  findPrimeRecipe,
  formatPrimeIdentityLine,
  formatPrimeRecipeIdentity,
  getRecipeCapabilityIds,
  makePrimeRecipeId,
  parsePrimeRecipeId,
  resolvePrimeProtocol,
} from '../config/primeRecipes';
import { createPrimeSession, getCurrentPrimeStep } from '../utils/primeEngine';

describe('prime recipe resolver', () => {
  it('keeps soccer general practice on the original protocol identity', () => {
    expect(resolvePrimeProtocol()).toBe(gamespeedPrimeProtocol);
    expect(resolvePrimeProtocol({ sport: 'soccer', position: 'general', context: 'practice' }).id).toBe(
      GAMESPEED_PRIME_PROTOCOL_ID,
    );
    expect(resolvePrimeProtocol({ sport: 'soccer' }).id).toBe(GAMESPEED_PRIME_PROTOCOL_ID);
    expect(parsePrimeRecipeId(GAMESPEED_PRIME_PROTOCOL_ID)).toEqual({
      sport: 'soccer',
      position: 'general',
      context: 'practice',
    });
  });

  it('falls back to general then all/general for unknown positions and sparse recipes', () => {
    const unknown = findPrimeRecipe('football', 'not-a-position', 'game');
    expect(unknown.requested.position).toBe('general');
    expect(unknown.fallbackUsed).toBe(false);
    expect(unknown.matched).toEqual({ sport: 'football', position: 'general', context: 'game' });

    const lift = findPrimeRecipe('football', 'qb', 'lift');
    expect(lift.fallbackUsed).toBe(true);
    expect(lift.matched).toEqual({ sport: 'all', position: 'general', context: 'lift' });
    expect(lift.recipeId).toBe('prime:football:qb:lift');
  });

  it('builds different Game Primes for WR and QB without forking the engine', () => {
    const wr = resolvePrimeProtocol({ sport: 'football', position: 'wr_te', context: 'game' });
    const qb = resolvePrimeProtocol({ sport: 'football', position: 'qb', context: 'game' });

    expect(wr.id).toBe('prime:football:wr_te:game');
    expect(qb.id).toBe('prime:football:qb:game');
    expect(validatePrimeProtocol(wr)).toEqual([]);
    expect(validatePrimeProtocol(qb)).toEqual([]);
    expect(getRecipeCapabilityIds(wr)).toEqual(['see', 'scan', 'decide', 'track', 'react', 'move']);
    expect(getRecipeCapabilityIds(qb)).toEqual(['scan', 'process', 'decide', 'control', 'see', 'move']);
    expect(getRecipeCapabilityIds(wr)).not.toEqual(getRecipeCapabilityIds(qb));

    const wrSession = createPrimeSession({
      protocol: wr,
      context: 'game',
      sport: 'football',
      position: 'wr_te',
      sessionId: 'wr-game',
    });
    const qbSession = createPrimeSession({
      protocol: qb,
      context: 'game',
      sport: 'football',
      position: 'qb',
      sessionId: 'qb-game',
    });
    expect(getCurrentPrimeStep(wrSession)?.id).toBe('see');
    expect(getCurrentPrimeStep(qbSession)?.id).toBe('scan');
    expect(wrSession.recipeId).toBe(wr.id);
    expect(qbSession.position).toBe('qb');
  });

  it('keeps soccer and football general Game Primes from matching', () => {
    const soccer = getRecipeCapabilityIds(resolvePrimeProtocol({ sport: 'soccer', context: 'game' }));
    const football = getRecipeCapabilityIds(resolvePrimeProtocol({ sport: 'football', context: 'game' }));
    expect(soccer).toEqual(['see', 'scan', 'decide', 'track', 'react', 'move']);
    expect(football).toEqual(['see', 'scan', 'decide', 'react', 'control', 'move']);
    expect(soccer).not.toEqual(football);
  });

  it('uses a short activation Lift recipe and a non-game Recovery recipe', () => {
    const lift = resolvePrimeProtocol({ sport: 'football', position: 'wr_te', context: 'lift' });
    const recovery = resolvePrimeProtocol({ sport: 'football', position: 'wr_te', context: 'recovery' });
    const game = resolvePrimeProtocol({ sport: 'football', position: 'wr_te', context: 'game' });

    expect(getRecipeCapabilityIds(lift)).toEqual(['react', 'track', 'settle']);
    expect(lift.estimatedSeconds).toBe(120);
    expect(getRecipeCapabilityIds(recovery)).toEqual(['settle', 'see', 'track']);
    expect(getRecipeCapabilityIds(recovery).some(id => HIGH_AROUSAL_CAPABILITIES.includes(id))).toBe(false);
    expect(getRecipeCapabilityIds(recovery)).not.toEqual(getRecipeCapabilityIds(game));
    expect(recovery.estimatedSeconds).not.toBe(game.estimatedSeconds);
    expect(validatePrimeProtocol(lift)).toEqual([]);
    expect(validatePrimeProtocol(recovery)).toEqual([]);
  });

  it('lets existing athletes without a stored position keep using Prime', () => {
    const protocol = resolvePrimeProtocol({ sport: 'soccer', position: undefined, context: 'practice' });
    expect(protocol.id).toBe(GAMESPEED_PRIME_PROTOCOL_ID);
    expect(getRecipeCapabilityIds(protocol)).toEqual([
      'settle',
      'see',
      'scan',
      'react',
      'control',
      'process',
      'decide',
      'track',
      'move',
    ]);
  });

  it('formats home and coach recipe identity from sport, position, and context', () => {
    expect(formatPrimeIdentityLine('football', 'wr_te')).toBe('FOOTBALL · WR');
    expect(formatPrimeIdentityLine('soccer', 'general')).toBe('SOCCER');
    expect(
      formatPrimeRecipeIdentity({
        sport: 'football',
        position: 'wr_te',
        context: 'game',
        recipeId: makePrimeRecipeId('football', 'wr_te', 'game'),
      }),
    ).toBe('FOOTBALL · WR · GAME');
  });
});
