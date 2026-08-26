import React, { useState } from 'react';
import { MODE_ORDER, gameModes, isModePlayable } from '../utils/gameModes';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { GameModeType } from '../types/game';
import { getModePresentation } from '../utils/modeDescriptions';
import { JungleButton } from './JungleButton';
import { ModeUnlockStatus } from '../utils/progression';
import { SportType } from '../config/sports';
import { HowToPlayModal } from './HowToPlayModal';
import { getModeIconVisual } from '../config/modeManifest';
import { isModeSupportedForSport } from '../config/modeManifest';

interface GameModeSelectorProps {
  onSelectMode: (mode: GameModeType) => void;
  selectedSport: SportType;
  unlocks?: Partial<Record<GameModeType, ModeUnlockStatus>>;
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

const ModeIconBadge = ({
  path,
  glyph,
  color,
  className,
}: {
  path: string;
  glyph: string;
  color: string;
  className: string;
}) => {
  const [didImageFail, setDidImageFail] = useState(false);
  if (path && !didImageFail) {
    return (
      <img
        src={path}
        alt=""
        aria-hidden="true"
        className={className}
        onError={() => setDidImageFail(true)}
      />
    );
  }
  return (
    <span aria-hidden="true" className={className} style={{ color }}>
      {glyph}
    </span>
  );
};

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onSelectMode, selectedSport, unlocks, copy }) => {
  const { theme } = useTheme();
  const [activeDetailsMode, setActiveDetailsMode] = useState<GameModeType | null>(null);
  const supportedModeKeys = modeKeys.filter(mode => isModeSupportedForSport(mode, selectedSport));
  const playableModes = supportedModeKeys.filter(isModePlayable);
  const upcomingModes = supportedModeKeys.filter(mode => !isModePlayable(mode));

  const handleModeSelect = (modeKey: GameModeType) => {
    if (!isModePlayable(modeKey)) return;
    onSelectMode(modeKey);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <motion.h2
        className="text-xl sm:text-3xl font-extrabold mb-1.5 text-center tracking-tight"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          color: theme.textColor,
        }}
      >
        {copy?.title ?? 'Choose Your Drill'}
      </motion.h2>
      <p
        className="text-sm sm:text-base mb-4 sm:mb-7 text-center max-w-3xl leading-relaxed"
        style={{ color: theme.textColor, opacity: 0.85 }}
      >
        {copy?.subtitle ??
          'Pick a live drill below, review the quick protocol, then begin your 60-second pre-performance readiness round.'}
      </p>

      <div className="w-full">
        <p
          className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-semibold mb-3 px-1"
          style={{ color: theme.targetColor }}
        >
          {copy?.availableLabel ?? 'Available now'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full px-0.5">
        {playableModes.map((key, cardIndex) => {
          const mode = gameModes[key];
          const details = getModePresentation(key, selectedSport);
          const modeIcon = getModeIconVisual(key);
          const unlockStatus = unlocks?.[key];
          const isLocked = !!unlockStatus && !unlockStatus.unlocked;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: cardIndex * 0.06 }}
              className="relative rounded-2xl p-3.5 sm:p-5 flex flex-col gap-3 select-none"
              style={{
                backgroundColor: 'rgba(11, 20, 24, 0.85)',
                border: `1px solid ${isLocked ? `${theme.textColor}2e` : `${theme.targetColor}4f`}`,
                boxShadow: '0 10px 26px rgba(0,0,0,0.25)',
                opacity: isLocked ? 0.8 : 1,
              }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ModeIconBadge
                    path={modeIcon.path}
                    glyph={modeIcon.glyph}
                    color={theme.targetColor}
                    className="h-5 w-5 sm:h-6 sm:w-6 object-contain text-lg sm:text-xl"
                  />
                  <h2
                    className="text-base sm:text-xl font-bold"
                    style={{ color: theme.textColor }}
                  >
                    {mode.name}
                  </h2>
                </div>
                <span
                  className="text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full tracking-wide uppercase"
                  style={
                    mode.category === 'benchmark'
                      ? {
                          backgroundColor: 'rgba(56,189,248,0.14)',
                          color: '#7dd3fc',
                          border: '1px solid rgba(56,189,248,0.38)',
                        }
                      : {
                          backgroundColor: `${theme.targetColor}20`,
                          color: theme.targetColor,
                          border: `1px solid ${theme.targetColor}55`,
                        }
                  }
                >
                  {mode.category === 'benchmark'
                    ? (copy?.benchmarkPillLabel ?? 'Benchmark')
                    : (copy?.drillPillLabel ?? 'Playable')}
                </span>
              </div>

              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: theme.textColor, opacity: 0.64 }}>
                {mode.category === 'benchmark' ? 'Fixed readiness protocol' : 'Variable drill protocol'}
              </p>
              <p className="text-sm leading-relaxed min-h-[52px]" style={{ color: theme.textColor, opacity: 0.75 }}>
                {details.sportDescription}
              </p>

              <p
                className="text-xs uppercase tracking-[0.12em] font-semibold"
                style={{ color: theme.targetColor, opacity: 0.85 }}
              >
                {details.sportLabel}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  className="rounded-lg px-3 py-2"
                  style={{ backgroundColor: `${theme.textColor}0f` }}
                >
                  <p className="uppercase tracking-[0.12em] opacity-60 mb-0.5" style={{ color: theme.textColor }}>
                    {copy?.focusLabel ?? 'Focus'}
                  </p>
                  <p className="font-semibold leading-tight" style={{ color: theme.textColor }}>
                    {details.trainingFocus}
                  </p>
                </div>
                <div
                  className="rounded-lg px-3 py-2"
                  style={{ backgroundColor: `${theme.textColor}0f` }}
                >
                  <p className="uppercase tracking-[0.12em] opacity-60 mb-0.5" style={{ color: theme.textColor }}>
                    {copy?.intensityLabel ?? 'Intensity'}
                  </p>
                  <p className="font-semibold leading-tight" style={{ color: theme.textColor }}>
                    {details.intensity}
                  </p>
                </div>
              </div>

              <div className="mt-0.5 flex flex-col sm:flex-row gap-2">
                <JungleButton onClick={() => handleModeSelect(key)} className="w-full min-h-12 text-sm sm:text-base">
                  {mode.category === 'benchmark'
                    ? (copy?.benchmarkCta ?? 'Run the 60-Second Test')
                    : (copy?.drillCta ?? "Start Today's Session")}
                </JungleButton>
                <button
                  type="button"
                  onClick={() => setActiveDetailsMode(key)}
                  className="ui-secondary-button w-full sm:w-auto px-4 min-h-12 text-sm"
                  style={{
                    color: theme.textColor,
                    borderColor: `${theme.textColor}4a`,
                  }}
                >
                  How to play
                </button>
              </div>
              {unlockStatus && (
                <p className="text-[11px] leading-relaxed" style={{ color: theme.textColor, opacity: 0.62 }}>
                  {isLocked ? `Milestone pending: ${unlockStatus.progressLabel}` : unlockStatus.requirement}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {!!upcomingModes.length && (
        <div className="w-full mt-6 sm:mt-8">
          <p
            className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-semibold mb-3 px-1"
            style={{ color: theme.textColor, opacity: 0.66 }}
          >
            {copy?.nextReleaseLabel ?? 'Next release'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-1">
            {upcomingModes.map((key, idx) => {
              const mode = gameModes[key];
              const details = getModePresentation(key, selectedSport);
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
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <ModeIconBadge
                        path={modeIcon.path}
                        glyph={modeIcon.glyph}
                        color={theme.targetColor}
                        className="h-4 w-4 sm:h-5 sm:w-5 object-contain text-base"
                      />
                      <h3 className="text-base font-semibold" style={{ color: theme.textColor, opacity: 0.9 }}>
                        {mode.name}
                      </h3>
                    </div>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full"
                      style={{
                        color: theme.targetColor,
                        backgroundColor: `${theme.targetColor}1e`,
                        border: `1px solid ${theme.targetColor}44`,
                      }}
                    >
                      {copy?.comingSoonLabel ?? 'Coming Soon'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed mb-2" style={{ color: theme.textColor, opacity: 0.72 }}>
                    {details.sportLabel}
                  </p>
                  <p className="text-xs" style={{ color: theme.textColor, opacity: 0.55 }}>
                    {details.sportDescription}
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
