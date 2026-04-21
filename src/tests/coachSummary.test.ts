import { describe, expect, it } from 'vitest';
import { CoachAthlete } from '../types/coach';
import { getAthleteSummary } from '../utils/coachSummary';

const makeAthlete = (): CoachAthlete => ({
  id: 'ath-1',
  name: 'Sam',
  sport: 'football',
  createdAt: Date.UTC(2026, 3, 20),
  updatedAt: Date.UTC(2026, 3, 20),
  runwayCompletions: [],
  gameSessions: [],
  sleepCheckIns: [],
  challengeProgress: {
    noScroll7Day: {
      templateId: 'noScroll7Day',
      completedUnits: [],
      updatedAt: Date.UTC(2026, 3, 20),
    },
    runwayCompletion: {
      templateId: 'runwayCompletion',
      completedUnits: [],
      updatedAt: Date.UTC(2026, 3, 20),
    },
  },
});

describe('coach summary calculations', () => {
  it('calculates readiness average and improving trend', () => {
    const athlete = makeAthlete();
    athlete.sleepCheckIns = [
      { id: 's1', ts: Date.UTC(2026, 3, 18), readinessScore: 3 },
      { id: 's2', ts: Date.UTC(2026, 3, 19), readinessScore: 4 },
      { id: 's3', ts: Date.UTC(2026, 3, 20), readinessScore: 5 },
    ];
    athlete.gameSessions = [
      { id: 'g1', ts: Date.UTC(2026, 3, 15), reactionTimeMs: 360, decisionScore: 2 },
      { id: 'g2', ts: Date.UTC(2026, 3, 16), reactionTimeMs: 350, decisionScore: 2 },
      { id: 'g3', ts: Date.UTC(2026, 3, 17), reactionTimeMs: 345, decisionScore: 3 },
      { id: 'g4', ts: Date.UTC(2026, 3, 18), reactionTimeMs: 310, decisionScore: 3 },
      { id: 'g5', ts: Date.UTC(2026, 3, 19), reactionTimeMs: 290, decisionScore: 4 },
      { id: 'g6', ts: Date.UTC(2026, 3, 20), reactionTimeMs: 280, decisionScore: 4 },
    ];
    athlete.challengeProgress.noScroll7Day.completedUnits = ['2026-04-18', '2026-04-19', '2026-04-20'];

    const summary = getAthleteSummary(athlete);

    expect(summary.averageReadinessScore).toBe(4);
    expect(summary.completionStreak).toBe(6);
    expect(summary.reactionDecisionTrend).toBe('improving');
  });
});
