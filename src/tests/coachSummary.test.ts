import { describe, expect, it } from 'vitest';
import { CoachAthlete } from '../types/coach';
import { getAthleteCoachSummary, getAthleteSummary, getCoachDashboardSummary } from '../utils/coachSummary';

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

  it('derives weekly runway and readiness trends', () => {
    const athlete = makeAthlete();
    const now = Date.UTC(2026, 3, 21, 12, 0, 0);
    athlete.runwayCompletions = [
      { id: 'r1', ts: Date.UTC(2026, 3, 20, 8, 0, 0) },
      { id: 'r2', ts: Date.UTC(2026, 3, 19, 8, 0, 0) },
      { id: 'r3', ts: Date.UTC(2026, 3, 14, 8, 0, 0) },
    ];
    athlete.sleepCheckIns = [
      { id: 's0', ts: Date.UTC(2026, 3, 10), readinessScore: 5 },
      { id: 's1', ts: Date.UTC(2026, 3, 11), readinessScore: 4 },
      { id: 's2', ts: Date.UTC(2026, 3, 20), readinessScore: 3 },
      { id: 's3', ts: Date.UTC(2026, 3, 21), readinessScore: 2 },
    ];

    const summary = getAthleteCoachSummary(athlete, now);

    expect(summary.runwayUsageThisWeek).toBe(2);
    expect(summary.runwayUsageTrend).toBe('up');
    expect(summary.readinessAverageThisWeek).toBe(2.5);
    expect(summary.readinessAveragePreviousWeek).toBe(4.5);
    expect(summary.readinessTrend).toBe('down');
  });

  it('flags at-risk athletes for runway, readiness decline, and inactivity', () => {
    const now = Date.UTC(2026, 3, 21, 12, 0, 0);
    const athlete = makeAthlete();
    athlete.runwayCompletions = [{ id: 'r1', ts: Date.UTC(2026, 3, 13, 8, 0, 0) }];
    athlete.sleepCheckIns = [
      { id: 's1', ts: Date.UTC(2026, 3, 12), readinessScore: 5 },
      { id: 's2', ts: Date.UTC(2026, 3, 13), readinessScore: 4 },
      { id: 's3', ts: Date.UTC(2026, 3, 16), readinessScore: 2 },
    ];

    const summary = getAthleteCoachSummary(athlete, now);

    expect(summary.atRisk.missedRunwayUsage).toBe(true);
    expect(summary.atRisk.decliningReadinessCheckIns).toBe(true);
    expect(summary.atRisk.inactivity).toBe(true);
    expect(summary.atRisk.reasons).toEqual(
      expect.arrayContaining(['Missed runway usage target', 'Declining readiness check-ins', 'Recent inactivity']),
    );
  });

  it('builds coach dashboard views including sport trend and recent activity', () => {
    const now = Date.UTC(2026, 3, 21, 12, 0, 0);
    const soccerAthlete = makeAthlete();
    soccerAthlete.id = 'ath-2';
    soccerAthlete.name = 'Jordan';
    soccerAthlete.sport = 'soccer';
    soccerAthlete.runwayCompletions = [
      { id: 'r1', ts: Date.UTC(2026, 3, 20) },
      { id: 'r2', ts: Date.UTC(2026, 3, 19) },
      { id: 'r3', ts: Date.UTC(2026, 3, 18) },
    ];
    soccerAthlete.sleepCheckIns = [{ id: 's1', ts: Date.UTC(2026, 3, 20), readinessScore: 4 }];
    soccerAthlete.gameSessions = [
      { id: 'g1', ts: Date.UTC(2026, 3, 20), decisionScore: 4, reactionTimeMs: 260 },
      { id: 'g2', ts: Date.UTC(2026, 3, 19), decisionScore: 4, reactionTimeMs: 255 },
      { id: 'g3', ts: Date.UTC(2026, 3, 10), decisionScore: 3, reactionTimeMs: 320 },
      { id: 'g4', ts: Date.UTC(2026, 3, 9), decisionScore: 3, reactionTimeMs: 330 },
    ];

    const boxingAthlete = makeAthlete();
    boxingAthlete.id = 'ath-3';
    boxingAthlete.name = 'Casey';
    boxingAthlete.sport = 'boxing';
    boxingAthlete.sleepCheckIns = [{ id: 's2', ts: Date.UTC(2026, 3, 21), readinessScore: 5 }];
    boxingAthlete.gameSessions = [{ id: 'g5', ts: Date.UTC(2026, 3, 21), decisionScore: 5, reactionTimeMs: 240 }];

    const dashboard = getCoachDashboardSummary([soccerAthlete, boxingAthlete], now);

    expect(dashboard.athleteSummaries).toHaveLength(2);
    expect(dashboard.recentAthleteActivity[0].athleteName).toBe('Casey');
    expect(dashboard.sportPerformanceTrends.map(item => item.sport)).toEqual(['boxing', 'soccer']);
    expect(dashboard.sportPerformanceTrends.find(item => item.sport === 'soccer')?.trend).toBe('up');
  });
});
