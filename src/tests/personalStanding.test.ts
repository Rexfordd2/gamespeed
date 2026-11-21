import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { GameStats, StoredRound } from '../types/game';
import { buildShareScoreCardText, getPersonalStanding } from '../utils/progression';

const round = (overrides: Partial<StoredRound>): StoredRound => ({
  ts: Date.parse('2026-11-21T12:00:00Z'),
  mode: 'quickTap',
  modeName: 'Quick Tap',
  score: 20,
  misses: 5,
  accuracy: 80,
  bestStreak: 6,
  medianReactionTimeMs: 300,
  ...overrides,
});

const statsWith = (rounds: StoredRound[]): GameStats =>
  ({ rounds, pbs: {} }) as unknown as GameStats;

const POPULATION_CLAIM = /percentile|%ile|\btop \d+ ?%|better than \d+ ?%|faster than \d+ ?%|of (all )?(players|athletes|users)/i;

describe('personal standing replaces population percentile', () => {
  it('labels a first session as a baseline without any ranking claim', () => {
    const only = round({});
    const standing = getPersonalStanding(only, statsWith([only]));
    expect(standing).toMatchObject({ rank: 1, total: 1, label: 'BASELINE' });

    const text = buildShareScoreCardText({ round: only, standing, dailyStreak: 1, newPb: true });
    expect(text).toContain('My history: First Quick Tap session (baseline)');
    expect(text).toContain('Quick Tap · 20 hits · 80% accuracy');
    expect(text).not.toMatch(POPULATION_CLAIM);
  });

  it('ranks only against the same athlete’s sessions in that mode', () => {
    const weak = round({ score: 10, accuracy: 50, ts: 1 });
    const strong = round({ score: 30, accuracy: 95, ts: 2 });
    const other = round({ mode: 'multiTarget', modeName: 'Multi Target', score: 99, ts: 3 });
    const latest = round({ score: 20, accuracy: 80, ts: 4 });
    const stats = statsWith([weak, strong, other, latest]);

    const standing = getPersonalStanding(latest, stats);
    expect(standing).toMatchObject({ rank: 2, total: 3, label: '#2 of 3' });
    expect(
      buildShareScoreCardText({ round: latest, standing, dailyStreak: 0, newPb: false }),
    ).toContain('My history: #2 of my 3 Quick Tap sessions');

    const best = getPersonalStanding(strong, stats);
    expect(best).toMatchObject({ rank: 1, total: 3, label: 'BEST YET' });
    expect(buildShareScoreCardText({ round: strong, standing: best, dailyStreak: 0, newPb: true })).toContain(
      'My history: Best of my 3 Quick Tap sessions',
    );
  });

  it('keeps personal best and streak lines in the share card', () => {
    const r = round({ bestStreak: 9 });
    const text = buildShareScoreCardText({
      round: r,
      standing: getPersonalStanding(r, statsWith([r])),
      dailyStreak: 3,
      newPb: true,
    });
    expect(text).toContain('Best streak: 9');
    expect(text).toContain('Daily streak: 3 days');
    expect(text).toContain('Result: new personal best');
  });

  it('ships no percentile or population-ranking copy in app source', () => {
    const root = resolve(__dirname, '..');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) {
          if (name !== 'tests') walk(path);
        } else if (/\.(ts|tsx)$/.test(name) && POPULATION_CLAIM.test(readFileSync(path, 'utf8'))) {
          offenders.push(path);
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
