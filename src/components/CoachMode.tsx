import { useMemo, useState } from 'react';
import { SPORT_ORDER, SportType, getSportConfig } from '../config/sports';
import { useTheme } from '../context/ThemeContext';
import { JungleBackground } from './JungleBackground';
import { JungleButton } from './JungleButton';
import { COACH_CHALLENGE_TEMPLATES } from '../utils/coachChallenges';
import { getAthleteSummary } from '../utils/coachSummary';
import { localCoachRepository } from '../utils/coachStore';

interface CoachModeProps {
  onBack: () => void;
}

const TREND_LABELS = {
  improving: 'Improving',
  steady: 'Steady',
  declining: 'Needs attention',
  'insufficient-data': 'Not enough data',
} as const;

const sportLabel = (sport: SportType) => getSportConfig(sport).displayName;

export const CoachMode = ({ onBack }: CoachModeProps) => {
  const { theme } = useTheme();
  const [store, setStore] = useState(() => localCoachRepository.load());
  const [name, setName] = useState('');
  const [sport, setSport] = useState<SportType>('soccer');
  const [editingAthleteId, setEditingAthleteId] = useState<string | null>(null);

  const sortedAthletes = useMemo(
    () => [...store.athletes].sort((a, b) => b.updatedAt - a.updatedAt),
    [store.athletes],
  );

  const refresh = () => setStore(localCoachRepository.load());

  const handleSaveAthlete = () => {
    if (!name.trim()) return;
    localCoachRepository.upsertAthlete({
      id: editingAthleteId ?? undefined,
      name,
      sport,
    });
    setName('');
    setSport('soccer');
    setEditingAthleteId(null);
    refresh();
  };

  const startEdit = (athleteId: string) => {
    const athlete = store.athletes.find(item => item.id === athleteId);
    if (!athlete) return;
    setEditingAthleteId(athlete.id);
    setName(athlete.name);
    setSport(athlete.sport);
  };

  return (
    <div
      className="relative w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <JungleBackground />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(3,8,12,0.78), rgba(2,8,10,0.94))',
        }}
      />
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 py-4 sm:py-7">
        <section
          className="rounded-3xl p-5 sm:p-6"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.84)',
            border: `1px solid ${theme.targetColor}55`,
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: theme.targetColor }}>
            Coach Mode (local data)
          </p>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl" style={{ color: theme.textColor }}>
            Team readiness challenge board
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: theme.textColor, opacity: 0.8 }}>
            Add athletes, run weekly readiness goals, and log runway or session activity for baseline coaching review.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onBack}
              className="ui-secondary-button min-h-11 px-5"
              style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
            >
              Back to home
            </button>
          </div>
        </section>

        <section
          className="rounded-3xl p-5 sm:p-6"
          style={{ backgroundColor: 'rgba(6, 12, 18, 0.78)', border: `1px solid ${theme.textColor}30` }}
        >
          <h2 className="text-lg font-bold" style={{ color: theme.textColor }}>
            {editingAthleteId ? 'Edit athlete' : 'Add athlete'}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[2fr,2fr,auto]">
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Athlete name"
              className="rounded-xl px-3 py-2.5 text-sm"
              style={{
                color: theme.textColor,
                backgroundColor: 'rgba(2, 8, 12, 0.78)',
                border: `1px solid ${theme.textColor}34`,
              }}
            />
            <select
              value={sport}
              onChange={event => setSport(event.target.value as SportType)}
              className="rounded-xl px-3 py-2.5 text-sm"
              style={{
                color: theme.textColor,
                backgroundColor: 'rgba(2, 8, 12, 0.78)',
                border: `1px solid ${theme.textColor}34`,
              }}
            >
              {SPORT_ORDER.map(item => (
                <option key={item} value={item}>
                  {sportLabel(item)}
                </option>
              ))}
            </select>
            <JungleButton onClick={handleSaveAthlete} className="px-5 py-2.5 text-sm">
              {editingAthleteId ? 'Save' : 'Add'}
            </JungleButton>
          </div>
        </section>

        {sortedAthletes.length === 0 ? (
          <section
            className="rounded-3xl p-5 sm:p-6"
            style={{ backgroundColor: 'rgba(6, 12, 18, 0.78)', border: `1px solid ${theme.textColor}30` }}
          >
            <p style={{ color: theme.textColor, opacity: 0.76 }}>
              No athletes yet. Add your first athlete to start tracking readiness trends and weekly challenges.
            </p>
          </section>
        ) : (
          sortedAthletes.map(athlete => {
            const summary = getAthleteSummary(athlete);
            return (
              <section
                key={athlete.id}
                className="rounded-3xl p-5 sm:p-6"
                style={{ backgroundColor: 'rgba(6, 12, 18, 0.78)', border: `1px solid ${theme.textColor}30` }}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: theme.textColor }}>
                      {athlete.name}
                    </h3>
                    <p className="text-sm" style={{ color: theme.textColor, opacity: 0.74 }}>
                      Sport: {sportLabel(athlete.sport)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(athlete.id)}
                    className="ui-secondary-button min-h-10 px-4 text-sm"
                    style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
                  >
                    Edit athlete
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: 'rgba(2,8,12,0.72)' }}>
                    <p className="text-[10px] uppercase opacity-65" style={{ color: theme.textColor }}>
                      Runway completions
                    </p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: theme.targetColor }}>
                      {athlete.runwayCompletions.length}
                    </p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: 'rgba(2,8,12,0.72)' }}>
                    <p className="text-[10px] uppercase opacity-65" style={{ color: theme.textColor }}>
                      Game sessions
                    </p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: theme.targetColor }}>
                      {athlete.gameSessions.length}
                    </p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: 'rgba(2,8,12,0.72)' }}>
                    <p className="text-[10px] uppercase opacity-65" style={{ color: theme.textColor }}>
                      Sleep check-ins
                    </p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: theme.targetColor }}>
                      {athlete.sleepCheckIns.length}
                    </p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: 'rgba(2,8,12,0.72)' }}>
                    <p className="text-[10px] uppercase opacity-65" style={{ color: theme.textColor }}>
                      Completion streak
                    </p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: '#86efac' }}>
                      {summary.completionStreak}d
                    </p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: 'rgba(2,8,12,0.72)' }}>
                    <p className="text-[10px] uppercase opacity-65" style={{ color: theme.textColor }}>
                      Avg readiness
                    </p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: '#7dd3fc' }}>
                      {summary.averageReadinessScore || '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-xs" style={{ color: theme.textColor, opacity: 0.72 }}>
                    Recent reaction/decision trend: {TREND_LABELS[summary.reactionDecisionTrend]}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      localCoachRepository.recordRunwayCompletion(athlete.id);
                      refresh();
                    }}
                    className="ui-secondary-button min-h-10 px-4 text-sm"
                    style={{ color: theme.textColor, borderColor: '#86efac80' }}
                  >
                    + Runway completion
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localCoachRepository.recordGameSession(athlete.id, {
                        reactionTimeMs: 300,
                        decisionScore: 3,
                      });
                      refresh();
                    }}
                    className="ui-secondary-button min-h-10 px-4 text-sm"
                    style={{ color: theme.textColor, borderColor: '#7dd3fc80' }}
                  >
                    + Readiness session
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localCoachRepository.recordSleepCheckIn(athlete.id, {
                        readinessScore: 4,
                      });
                      refresh();
                    }}
                    className="ui-secondary-button min-h-10 px-4 text-sm"
                    style={{ color: theme.textColor, borderColor: '#facc1580' }}
                  >
                    + Sleep check-in
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {Object.values(COACH_CHALLENGE_TEMPLATES).map(template => {
                    const progress = athlete.challengeProgress[template.id];
                    const done = progress?.completedUnits.length ?? 0;
                    const completed = done >= template.targetCount;
                    return (
                      <div
                        key={`${athlete.id}_${template.id}`}
                        className="rounded-2xl p-3.5"
                        style={{
                          backgroundColor: 'rgba(2, 8, 12, 0.76)',
                          border: `1px solid ${completed ? '#86efac80' : `${theme.textColor}30`}`,
                        }}
                      >
                        <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
                          {template.title}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: theme.textColor, opacity: 0.72 }}>
                          {template.description}
                        </p>
                        <p className="mt-2 text-xs font-semibold" style={{ color: completed ? '#86efac' : '#facc15' }}>
                          Progress: {done}/{template.targetCount}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              localCoachRepository.recordChallengeCompletion(athlete.id, template.id);
                              refresh();
                            }}
                            className="ui-secondary-button min-h-9 px-3 text-xs"
                            style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
                          >
                            Mark complete
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              localCoachRepository.resetChallenge(athlete.id, template.id);
                              refresh();
                            }}
                            className="ui-secondary-button min-h-9 px-3 text-xs"
                            style={{ color: theme.textColor, borderColor: `${theme.textColor}33` }}
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
};
