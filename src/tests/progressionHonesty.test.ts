import { describe, expect, it } from 'vitest';
import { StoredRound } from '../types/game';
import { emptyStats } from '../utils/sessionStats';
import { estimateSelfRankPct, getSelfRankBadge, getWeeklyChallenge } from '../utils/progression';

const round = (score: number, accuracy: number, ts = 1): StoredRound => ({
  ts,
  mode: 'quickTap',
  modeName: 'Quick Tap',
  score,
  misses: 2,
  accuracy,
  bestStreak: 3,
  sport: 'soccer',
});

describe('honest self-rank progression', () => {
  it('does not invent a percentile from a single round', () => {
    const stats = { ...emptyStats(), rounds: [round(12, 80)] };
    expect(estimateSelfRankPct(stats.rounds[0], stats)).toBeNull();
  });

  it('ranks a round against the athlete’s own history only', () => {
    const stats = {
      ...emptyStats(),
      rounds: [round(8, 60, 1), round(10, 70, 2), round(14, 90, 3)],
    };
    const rank = estimateSelfRankPct(stats.rounds[2], stats);
    expect(rank).toBeGreaterThanOrEqual(90);
    expect(getSelfRankBadge(rank ?? 0).label).toBe('Personal peak');
    expect(getSelfRankBadge(rank ?? 0).label).not.toMatch(/national/i);
  });

  it('names weekly volume as consistency, not a generic challenge', () => {
    const challenge = getWeeklyChallenge({ ...emptyStats(), rounds: [round(9, 75, Date.now())] });
    expect(challenge.title).toBe('Weekly consistency');
    expect(challenge.roundsDone).toBe(1);
    expect(challenge.completed).toBe(false);
  });
});
