import React, { useState } from 'react';
import { MODE_ORDER, gameModes, isModePlayable } from '../utils/gameModes';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { GameModeType, GameStats } from '../types/game';
import { getModePresentation } from '../utils/modeDescriptions';
import { JungleButton } from './JungleButton';
import { getPortraitDepth, getPortraitStage, getTodaysInstinct, ModeUnlockStatus } from '../utils/progression';
import { SportType } from '../config/sports';
import { HowToPlayModal } from './HowToPlayModal';
import { getModeIconVisual } from '../config/modeManifest';
import { isModeSupportedForSport } from '../config/modeManifest';
import { getAnimalInstinct, getExperienceName } from '../config/animalInstincts';
import { resolveSemanticAccent } from '../config/designTokens';
import { framerTransition } from '../config/motion';

interface GameModeSelectorProps {
  onSelectMode: (mode: GameModeType) => void;
  selectedSport: SportType;
  unlocks?: Partial<Record<GameModeType, ModeUnlockStatus>>;
  stats?: GameStats;
  copy?: {
    title: string;
    subtitle: string;
    availableLabel: string;
    nextReleaseLabel: string;
    benchmarkCta: string;
    drillCta: string;
    benchmarkPillLabel: string;
    drillPillLabel: string;
    focusLabel: string;
    intensityLabel: string;
    comingSoonLabel: string;
  };
}

const modeKeys = MODE_ORDER;

const GeometricGlyph = ({ color, className }: { color: string; className: string }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
    <polygon points="12,3 21,19 3,19" stroke={color} strokeWidth="1.8" />
    <circle cx="12" cy="14" r="2.2" fill={color} />
  </svg>
);

const ModeIconBadge = ({
  path,
  color,
  className,
  stage = 'silhouette',
}: {
  path: string;
  glyph?: string;
  color: string;
  className: string;
  stage?: 'silhouette' | 'eyes' | 'partial' | 'full';
}) => {
  const [didImageFail, setDidImageFail] = useState(false);
  if (path && !didImageFail) {
    return (
      <span className={`relative inline-flex ${className}`} data-portrait-stage={stage}>
        <img
          src={path}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain instinct-card-silhouette"
          style={{
            opacity: stage === 'silhouette' ? 0.55 : stage === 'eyes' ? 0.78 : 1,
            filter:
              stage === 'silhouette'
                ? 'brightness(0.35) contrast(1.2)'
                : stage === 'eyes'
                  ? 'brightness(0.7) contrast(1.15)'
                  : stage === 'partial'
                    ? 'brightness(0.88)'
                    : 'none',
          }}
          onError={() => setDidImageFail(true)}
        />
        {(stage === 'eyes' || stage === 'partial' || stage === 'full') && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[28%] top-[38%] flex justify-between"
          >
            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
          </span>
        )}
      </span>
    );
  }
  return <GeometricGlyph color={color} className={className} />;
};

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({
  onSelectMode,
  selectedSport,
  unlocks,
  stats,
  copy,
}) => {
  const { theme } = useTheme();
  const [activeDetailsMode, setActiveDetailsMode] = useState<GameModeType | null>(null);
  const supportedModeKeys = modeKeys.filter(mode => isModeSupportedForSport(mode, selectedSport));
  const playableModes = supportedModeKeys.filter(isModePlayable);
  const upcomingModes = supportedModeKeys.filter(mode => !isModePlayable(mode));

  const handleModeSelect = (modeKey: GameModeType) => {
    if (!isModePlayable(modeKey)) return;
    onSelectMode(modeKey);
  };

  const todaysInstinct = stats ? getTodaysInstinct(stats) : null;

  return (
    <div className="flex w-full flex-col items-center">
      <motion.h2
        className="font-display mb-1.5 text-center text-3xl font-extrabold uppercase tracking-[0.06em] sm:text-4xl"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={framerTransition.ui}
        style={{ color: theme.textColor }}
      >
        {copy?.title ?? 'CHOOSE YOUR INSTINCT'}
      </motion.h2>
      <p
        className="mb-4 max-w-3xl text-center text-sm leading-relaxed sm:mb-7 sm:text-base"
        style={{ color: theme.textColor, opacity: 0.85 }}
      >
        {copy?.subtitle ?? 'Every athlete reacts. Elite athletes perceive sooner.'}
      </p>

      {todaysInstinct && (
        <div
          className="mb-4 w-full rounded-2xl px-4 py-3"
          style={{
            backgroundColor: 'rgba(82, 242, 140, 0.08)',
            border: `1px solid ${theme.targetColor}55`,
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: theme.targetColor }}>
            Today&apos;s Instinct
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold uppercase tracking-[0.04em]" style={{ color: theme.textColor }}>
                {getExperienceName(todaysInstinct.mode)}
              </p>
              <p className="text-xs opacity-70" style={{ color: theme.textColor }}>
                {todaysInstinct.reason}
              </p>
            </div>
            <JungleButton
              onClick={() => handleModeSelect(todaysInstinct.mode)}
              className="min-h-10 px-4 text-xs uppercase tracking-[0.08em]"
            >
              Train
            </JungleButton>
          </div>
        </div>
      )}

      <div className="w-full">
        <p
          className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-xs"
          style={{ color: theme.targetColor }}
        >
          {copy?.availableLabel ?? 'Live instincts'}
        </p>
      </div>

      <div className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
        {playableModes.map((key, cardIndex) => {
          const mode = gameModes[key];
          const instinct = getAnimalInstinct(key);
          const details = getModePresentation(key, selectedSport);
          const modeIcon = getModeIconVisual(key);
          const unlockStatus = unlocks?.[key];
          const isLocked = !!unlockStatus && !unlockStatus.unlocked;
          const accent = resolveSemanticAccent(instinct.accent);
          const pb = stats?.pbs[key];
          const silhouetteOpacity = stats ? getPortraitDepth(stats, key) : 0.18;
          const portraitStage = stats ? getPortraitStage(stats, key) : 'silhouette';

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...framerTransition.ui, delay: cardIndex * 0.05 }}
              className="instinct-card relative flex min-w-[86%] snap-center flex-col gap-3 p-3.5 select-none sm:min-w-0 sm:p-5 md:min-w-0"
              style={{
                borderColor: isLocked ? `${theme.textColor}2e` : `${accent}66`,
                opacity: isLocked ? 0.8 : 1,
              }}
              whileHover={{ y: -2 }}
              aria-label={`${instinct.experienceName}, ${instinct.mechanicName}. ${instinct.ability}.`}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 82% 78%, ${accent}22, transparent 42%)`,
                  opacity: silhouetteOpacity + 0.2,
                }}
              />

              <div className="relative z-[1] flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ModeIconBadge
                    path={modeIcon.path}
                    glyph={modeIcon.glyph}
                    color={accent}
                    stage={portraitStage}
                    className="h-8 w-8 object-contain text-xl sm:h-10 sm:w-10 sm:text-2xl"
                  />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
                      {instinct.animal}
                    </p>
                    <h2 className="font-display text-xl font-bold uppercase tracking-[0.04em] sm:text-2xl" style={{ color: theme.textColor }}>
                      {instinct.experienceName}
                    </h2>
                    <p className="text-xs opacity-70" style={{ color: theme.textColor }}>
                      {instinct.ability}
                    </p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full sm:text-xs"
                  style={
                    mode.category === 'benchmark'
                      ? {
                          backgroundColor: 'rgba(76,201,240,0.14)',
                          color: '#4CC9F0',
                          border: '1px solid rgba(76,201,240,0.38)',
                        }
                      : {
                          backgroundColor: `${accent}20`,
                          color: accent,
                          border: `1px solid ${accent}55`,
                        }
                  }
                >
                  {mode.category === 'benchmark'
                    ? (copy?.benchmarkPillLabel ?? 'Readiness')
                    : (copy?.drillPillLabel ?? 'Instinct')}
                </span>
              </div>

              <p className="relative z-[1] text-sm font-semibold" style={{ color: accent }}>
                {instinct.ability}
              </p>
              <p className="relative z-[1] min-h-[44px] text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.8 }}>
                {instinct.shortDescription}
              </p>
              <p className="relative z-[1] text-xs opacity-65" style={{ color: theme.textColor }}>
                {details.sportLabel}
              </p>
              <p className="relative z-[1] text-xs leading-relaxed opacity-60" style={{ color: theme.textColor }}>
                {details.sportDescription}
              </p>

              <div className="relative z-[1] mt-auto flex items-end justify-between gap-3 border-t pt-3" style={{ borderColor: `${accent}33` }}>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] opacity-60" style={{ color: theme.textColor }}>
                    Best
                  </p>
                  <p className="font-display text-2xl font-bold tabular-nums" style={{ color: theme.textColor }}>
                    {pb?.medianReactionTimeMs
                      ? `${pb.medianReactionTimeMs} MS`
                      : pb?.score !== undefined
                        ? pb.score
                        : '—'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <JungleButton
                    onClick={() => handleModeSelect(key)}
                    className="min-h-11 px-5 text-sm uppercase tracking-[0.08em]"
                  >
                    {mode.category === 'benchmark'
                      ? (copy?.benchmarkCta ?? 'BEGIN BENCHMARK')
                      : (copy?.drillCta ?? 'TRAIN')}
                  </JungleButton>
                  <button
                    type="button"
                    onClick={() => setActiveDetailsMode(key)}
                    className="ui-secondary-button min-h-11 px-4 text-sm"
                    style={{ color: theme.textColor, borderColor: `${theme.textColor}4a` }}
                  >
                    Protocol
                  </button>
                </div>
              </div>
              {unlockStatus && (
                <p className="relative z-[1] text-[11px] leading-relaxed" style={{ color: theme.textColor, opacity: 0.62 }}>
                  {isLocked ? `Trail locked: ${unlockStatus.progressLabel}` : unlockStatus.requirement}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {!!upcomingModes.length && (
        <div className="mt-6 w-full sm:mt-8">
          <p
            className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-xs"
            style={{ color: theme.textColor, opacity: 0.66 }}
          >
            {copy?.nextReleaseLabel ?? 'Next release'}
          </p>
          <div className="grid grid-cols-1 gap-3 px-1 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingModes.map((key, idx) => {
              const instinct = getAnimalInstinct(key);
              const modeIcon = getModeIconVisual(key);
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 + 0.2 }}
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: 'rgba(10, 16, 20, 0.55)',
                    border: `1px dashed ${theme.targetColor}4a`,
                  }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ModeIconBadge
                        path={modeIcon.path}
                        glyph={modeIcon.glyph}
                        color={theme.targetColor}
                        className="h-5 w-5 object-contain text-base"
                      />
                      <h3 className="text-base font-semibold" style={{ color: theme.textColor, opacity: 0.9 }}>
                        {instinct.experienceName}
                      </h3>
                    </div>
                    <span
                      className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        color: theme.targetColor,
                        backgroundColor: `${theme.targetColor}1e`,
                        border: `1px solid ${theme.targetColor}44`,
                      }}
                    >
                      {copy?.comingSoonLabel ?? 'Coming Soon'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: theme.textColor, opacity: 0.72 }}>
                    {instinct.tagline}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      <HowToPlayModal
        modeKey={activeDetailsMode}
        selectedSport={selectedSport}
        isOpen={activeDetailsMode !== null}
        onClose={() => setActiveDetailsMode(null)}
        onStart={() => {
          if (!activeDetailsMode) return;
          handleModeSelect(activeDetailsMode);
          setActiveDetailsMode(null);
        }}
      />
    </div>
  );
};
