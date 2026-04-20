import { useTheme } from '../context/ThemeContext';
import { JungleButton } from './JungleButton';
import { JungleBackground } from './JungleBackground';
import { AuthPanel } from './AuthPanel';
import { FirstRunSelection, GameModeType, GameResult, GameStats } from '../types/game';
import { motion } from 'framer-motion';
import { gameModes } from '../utils/gameModes';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PercentileBadge,
  RoundProgressDelta,
  buildShareScoreCardText,
  estimatePercentileForRound,
  getDailyStreak,
  getModeLabel,
  getPercentileBadge,
  getRecentHistory,
  getWeeklyChallenge,
} from '../utils/progression';
import { trackConversionEvent } from '../lib/analytics';
import { getLandingExperimentAssignment } from '../config/landingExperiment';

interface EndScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onViewStats: () => void;
  onStartMode: (mode: GameModeType) => void;
  firstRunSelection: FirstRunSelection | null;
  showOnboardingChecklist: boolean;
  showDeferredAccountPrompt: boolean;
  isSignedIn: boolean;
  totalRoundsCompleted: number;
  stats: GameStats;
  roundProgressDelta: RoundProgressDelta | null;
  playerName: string;
}

type ChecklistState = {
  baselineComplete: boolean;
  recommendedModeComplete: boolean;
  threeSessionsComplete: boolean;
  accountComplete: boolean;
};

const CHECKLIST_STORAGE_KEY = 'gamespeed_onboarding_checklist_v1';

const GOAL_LABELS: Record<FirstRunSelection['goal'], string> = {
  firstStepQuickness: 'first-step quickness',
  peripheralAwareness: 'peripheral awareness',
  gameSpeedDecisions: 'game-speed decisions',
  rawReaction: 'raw reaction',
  flickResponse: 'flick response',
  focusUnderPressure: 'focus under pressure',
};

const GOAL_RECOMMENDATIONS: Record<FirstRunSelection['goal'], GameModeType> = {
  firstStepQuickness: 'quickTap',
  peripheralAwareness: 'multiTarget',
  gameSpeedDecisions: 'sequenceMemory',
  rawReaction: 'quickTap',
  flickResponse: 'swipeStrike',
  focusUnderPressure: 'holdTrack',
};

const getRecommendedMode = (selection: FirstRunSelection | null, accuracy: number): GameModeType => {
  if (accuracy < 55) return 'quickTap';
  if (!selection) return 'multiTarget';
  return GOAL_RECOMMENDATIONS[selection.goal];
};

const getDefaultChecklist = (totalRoundsCompleted: number, isSignedIn: boolean): ChecklistState => ({
  baselineComplete: true,
  recommendedModeComplete: false,
  threeSessionsComplete: totalRoundsCompleted >= 3,
  accountComplete: isSignedIn,
});

const loadChecklistState = (totalRoundsCompleted: number, isSignedIn: boolean): ChecklistState => {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return getDefaultChecklist(totalRoundsCompleted, isSignedIn);
    const parsed = JSON.parse(raw) as Partial<ChecklistState>;
    return {
      baselineComplete: true,
      recommendedModeComplete: parsed.recommendedModeComplete ?? false,
      threeSessionsComplete: parsed.threeSessionsComplete ?? totalRoundsCompleted >= 3,
      accountComplete: parsed.accountComplete ?? isSignedIn,
    };
  } catch {
    return getDefaultChecklist(totalRoundsCompleted, isSignedIn);
  }
};

const getLastRoundForResult = (stats: GameStats, result: GameResult) =>
  [...stats.rounds]
    .reverse()
    .find(
      round =>
        round.mode === result.mode &&
        round.score === result.score &&
        round.misses === result.misses &&
        round.bestStreak === result.bestStreak,
    ) ?? null;

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement('textarea');
  input.value = value;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
};

export const EndScreen = ({
  result,
  onPlayAgain,
  onMainMenu,
  onViewStats,
  onStartMode,
  firstRunSelection,
  showOnboardingChecklist,
  showDeferredAccountPrompt,
  isSignedIn,
  totalRoundsCompleted,
  stats,
  roundProgressDelta,
  playerName,
}: EndScreenProps) => {
  const { theme } = useTheme();
  const landingExperiment = useMemo(() => getLandingExperimentAssignment(), []);
  const totalAttempts = result.score + result.misses;
  const accuracy = totalAttempts > 0 ? Math.round((result.score / totalAttempts) * 100) : 0;
  const recommendedMode = getRecommendedMode(firstRunSelection, accuracy);
  const recommendedModeName = gameModes[recommendedMode].name;
  const [checklist, setChecklist] = useState<ChecklistState>(() => loadChecklistState(totalRoundsCompleted, isSignedIn));
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const hasTrackedSignupPrompt = useRef(false);

  const recentHistory = getRecentHistory(stats, 5);
  const dailyStreak = getDailyStreak(stats);
  const weeklyChallenge = getWeeklyChallenge(stats);
  const latestRound = getLastRoundForResult(stats, result);
  const percentileBadge: PercentileBadge = latestRound
    ? getPercentileBadge(estimatePercentileForRound(latestRound, stats))
    : getPercentileBadge(Math.max(5, Math.min(99, Math.round(accuracy * 0.8))));

  useEffect(() => {
    setChecklist(prev => ({
      ...prev,
      baselineComplete: true,
      threeSessionsComplete: prev.threeSessionsComplete || totalRoundsCompleted >= 3,
      accountComplete: prev.accountComplete || isSignedIn,
    }));
  }, [isSignedIn, totalRoundsCompleted]);

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklist));
    } catch {
      // ignore
    }
  }, [checklist]);

  useEffect(() => {
    trackConversionEvent('results_view', {
      mode: result.mode,
      score: result.score,
      misses: result.misses,
      bestStreak: result.bestStreak,
      totalRoundsCompleted,
      experimentVariant: landingExperiment.id,
      firstRunPersona: firstRunSelection?.persona ?? null,
      firstRunGoal: firstRunSelection?.goal ?? null,
    });
  }, [
    firstRunSelection?.goal,
    firstRunSelection?.persona,
    landingExperiment.id,
    result.bestStreak,
    result.misses,
    result.mode,
    result.score,
    totalRoundsCompleted,
  ]);

  useEffect(() => {
    if (!showDeferredAccountPrompt || hasTrackedSignupPrompt.current) {
      return;
    }
    hasTrackedSignupPrompt.current = true;
    trackConversionEvent('signup_prompt_shown', {
      totalRoundsCompleted,
      isSignedIn,
      experimentVariant: landingExperiment.id,
    });
  }, [isSignedIn, landingExperiment.id, showDeferredAccountPrompt, totalRoundsCompleted]);

  const checklistItems = useMemo(
    () => [
      { label: 'Baseline test completed', checked: checklist.baselineComplete },
      { label: `Run ${recommendedModeName} next`, checked: checklist.recommendedModeComplete },
      { label: 'Complete 3 total sessions', checked: checklist.threeSessionsComplete },
      { label: 'Create account to sync progress', checked: checklist.accountComplete },
    ],
    [checklist, recommendedModeName],
  );

  const handleStartRecommended = () => {
    setChecklist(prev => ({ ...prev, recommendedModeComplete: true }));
    onStartMode(recommendedMode);
  };

  const handleCopyScoreCard = async () => {
    if (!latestRound) return;
    trackConversionEvent('share_score_click', {
      mode: latestRound.mode,
      score: latestRound.score,
      accuracy: latestRound.accuracy,
      experimentVariant: landingExperiment.id,
    });
    const content = buildShareScoreCardText({
      round: latestRound,
      badge: percentileBadge,
      dailyStreak,
      newPb: roundProgressDelta?.newPb ?? false,
    });
    try {
      await copyText(content);
      setShareStatus('copied');
      window.setTimeout(() => setShareStatus('idle'), 1600);
    } catch {
      setShareStatus('error');
    }
  };

  return (
    <div className="relative w-full overflow-y-auto overflow-x-hidden" style={{ minHeight: '100dvh', backgroundColor: theme.backgroundColor, paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}>
      <JungleBackground />
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-2xl flex-col items-center px-4 py-7 sm:px-6 sm:py-10">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full rounded-3xl p-5 sm:p-6 mb-4" style={{ background: 'linear-gradient(180deg, rgba(11,20,24,0.82), rgba(4,12,18,0.88))', border: `1px solid ${theme.targetColor}4c` }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] opacity-65" style={{ color: theme.textColor }}>Final Score</p>
              <p className="text-6xl sm:text-7xl leading-none font-black tabular-nums mt-2" style={{ color: theme.targetColor }}>{result.score}</p>
              <p className="mt-2 text-sm opacity-75" style={{ color: theme.textColor }}>{result.modeName}</p>
            </div>
            <div className="rounded-2xl px-3.5 py-3 text-right" style={{ backgroundColor: `${percentileBadge.tone}18`, border: `1px solid ${percentileBadge.tone}66` }}>
              <p className="text-[10px] uppercase tracking-[0.16em] opacity-75" style={{ color: theme.textColor }}>Percentile</p>
              <p className="text-3xl font-black tabular-nums" style={{ color: percentileBadge.tone }}>{percentileBadge.percentile}<span className="text-base font-semibold">th</span></p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: theme.textColor }}>{percentileBadge.label}</p>
            </div>
          </div>
        </motion.div>

        <div className="w-full rounded-2xl px-5 py-4 mb-4" style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.28)' }}>
          <p className="text-[10px] sm:text-xs uppercase tracking-widest opacity-60 text-center mb-2" style={{ color: theme.textColor }}>Results Dashboard</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-2xl font-black tabular-nums" style={{ color: '#7dd3fc' }}>{dailyStreak}</p><p className="text-[10px] uppercase tracking-[0.13em] opacity-60 mt-1" style={{ color: theme.textColor }}>Daily streak</p></div>
            <div><p className="text-lg font-bold" style={{ color: '#a5f3fc' }}>{recommendedModeName}</p><p className="text-[10px] uppercase tracking-[0.13em] opacity-60 mt-1" style={{ color: theme.textColor }}>Recommended Next Mode</p></div>
            <div><p className="text-2xl font-black tabular-nums" style={{ color: weeklyChallenge.completed ? '#4ade80' : '#facc15' }}>{weeklyChallenge.roundsDone}/{weeklyChallenge.roundsTarget}</p><p className="text-[10px] uppercase tracking-[0.13em] opacity-60 mt-1" style={{ color: theme.textColor }}>Weekly challenge</p></div>
          </div>
          {firstRunSelection && <p className="mt-3 text-xs text-center" style={{ color: theme.textColor, opacity: 0.72 }}>Built for {firstRunSelection.persona} focus: {GOAL_LABELS[firstRunSelection.goal]}.</p>}
        </div>

        {roundProgressDelta && (
          <div className="w-full rounded-2xl px-5 py-4 mb-4" style={{ backgroundColor: 'rgba(74, 222, 128, 0.07)', border: '1px solid rgba(74, 222, 128, 0.26)' }}>
            <p className="text-[10px] uppercase tracking-[0.16em] opacity-65 mb-2" style={{ color: theme.textColor }}>Personal Best Tracker</p>
            <p className="text-xs" style={{ color: theme.textColor }}>
              Score {roundProgressDelta.scoreDelta >= 0 ? '+' : ''}
              {roundProgressDelta.scoreDelta} ? Accuracy{' '}
              {roundProgressDelta.accuracyDelta >= 0 ? '+' : ''}
              {roundProgressDelta.accuracyDelta}% ? Streak{' '}
              {roundProgressDelta.streakDelta >= 0 ? '+' : ''}
              {roundProgressDelta.streakDelta}
            </p>
          </div>
        )}

        <div className="w-full rounded-2xl px-5 py-4 mb-4" style={{ backgroundColor: 'rgba(2, 8, 12, 0.72)', border: `1px solid ${theme.textColor}2a` }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.16em] opacity-65" style={{ color: theme.textColor }}>Shareable score card</p>
            <button type="button" onClick={handleCopyScoreCard} className="ui-secondary-button px-3 py-1.5 text-xs" style={{ color: theme.textColor, borderColor: `${theme.textColor}48` }}>Copy Score Card</button>
          </div>
          {shareStatus !== 'idle' && <p className="mt-2 text-xs font-semibold" style={{ color: shareStatus === 'copied' ? '#4ade80' : '#f87171' }}>{shareStatus === 'copied' ? 'Score card copied to clipboard.' : 'Unable to copy right now.'}</p>}
        </div>

        <div className="w-full rounded-2xl px-5 py-4 mb-4" style={{ backgroundColor: 'rgba(2, 8, 12, 0.72)', border: `1px solid ${theme.textColor}24` }}>
          <p className="text-[10px] uppercase tracking-[0.16em] opacity-65 mb-2" style={{ color: theme.textColor }}>Session history</p>
          <div className="space-y-2">
            {recentHistory.map(round => (
              <div key={`${round.ts}-${round.clientRoundId ?? 'local'}`} className="flex items-center justify-between text-xs">
                <p style={{ color: theme.textColor, opacity: 0.85 }}>{getModeLabel(round.mode)} ? {new Date(round.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                <p className="tabular-nums" style={{ color: theme.targetColor }}>{round.score} / {round.accuracy}%</p>
              </div>
            ))}
          </div>
        </div>

        {showOnboardingChecklist && (
          <div className="w-full rounded-2xl px-5 py-4 mb-4" style={{ backgroundColor: 'rgba(74, 222, 128, 0.07)', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
            <p className="text-[10px] sm:text-xs uppercase tracking-widest opacity-70 mb-3" style={{ color: theme.textColor }}>Onboarding Checklist</p>
            <div className="space-y-2.5">
              {checklistItems.map(item => (
                <label key={item.label} className="flex items-center gap-2.5">
                  <input type="checkbox" checked={item.checked} onChange={event => {
                    if (item.label === `Run ${recommendedModeName} next`) setChecklist(prev => ({ ...prev, recommendedModeComplete: event.target.checked }));
                    if (item.label === 'Complete 3 total sessions') setChecklist(prev => ({ ...prev, threeSessionsComplete: event.target.checked }));
                    if (item.label === 'Create account to sync progress') setChecklist(prev => ({ ...prev, accountComplete: event.target.checked }));
                  }} className="h-4 w-4 rounded" disabled={item.label === 'Baseline test completed'} />
                  <span className="text-sm" style={{ color: theme.textColor, opacity: 0.9 }}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {showDeferredAccountPrompt && (
          <div className="w-full mb-4">
            <p className="mb-2 text-xs uppercase tracking-[0.16em]" style={{ color: theme.targetColor }}>Save this progress</p>
            <AuthPanel />
          </div>
        )}

        <motion.div className="flex flex-col gap-3 w-full">
          <JungleButton onClick={handleStartRecommended} className="w-full py-4 text-lg font-bold uppercase">Start Today's Session: {recommendedModeName}</JungleButton>
          <JungleButton onClick={onPlayAgain} className="w-full py-4 text-lg font-bold uppercase">Replay</JungleButton>
          <button type="button" onClick={onViewStats} className="ui-secondary-button w-full py-3" style={{ color: theme.targetColor, borderColor: `${theme.targetColor}55` }}>Compare My Score</button>
          <button type="button" onClick={onMainMenu} className="ui-secondary-button w-full py-3" style={{ color: theme.textColor, borderColor: `${theme.textColor}40` }}>Main Menu</button>
        </motion.div>
        <p className="mt-4 text-xs opacity-55" style={{ color: theme.textColor }}>Athlete profile: {playerName}</p>
      </div>
    </div>
  );
};
