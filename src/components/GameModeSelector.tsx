import React from 'react';
import { MODE_ORDER, gameModes, isModePlayable } from '../utils/gameModes';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { GameModeType } from '../types/game';
import { modeDescriptions } from '../utils/modeDescriptions';
import { JungleButton } from './JungleButton';
import { ModeUnlockStatus } from '../utils/progression';

interface GameModeSelectorProps {
  onSelectMode: (mode: GameModeType) => void;
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

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onSelectMode, unlocks, copy }) => {
  const { theme } = useTheme();
  const playableModes = modeKeys.filter(isModePlayable);
  const upcomingModes = modeKeys.filter(mode => !isModePlayable(mode));

  const handleModeSelect = (modeKey: GameModeType) => {
    if (!isModePlayable(modeKey)) return;
    onSelectMode(modeKey);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <motion.h2
        className="text-2xl sm:text-3xl font-extrabold mb-2 text-center tracking-tight"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          color: theme.textColor,
        }}
      >
        {copy?.title ?? 'Choose Your Drill'}
      </motion.h2>
      <p
        className="text-sm sm:text-base mb-6 sm:mb-7 text-center max-w-3xl leading-relaxed"
        style={{ color: theme.textColor, opacity: 0.85 }}
      >
        {copy?.subtitle ?? "Pick a live drill below, open the quick how-to, then tap Start Today's Session to begin your 60-second reaction round."}
      </p>

      <div className="w-full">
        <p
          className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-semibold mb-3 px-1"
          style={{ color: theme.targetColor }}
        >
          {copy?.availableLabel ?? 'Available now'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full px-1">
        {playableModes.map((key, cardIndex) => {
          const mode = gameModes[key];
          const details = modeDescriptions[key];
          const unlockStatus = unlocks?.[key];
          const isLocked = !!unlockStatus && !unlockStatus.unlocked;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: cardIndex * 0.06 }}
              className="relative rounded-2xl p-4 sm:p-5 flex flex-col gap-3 select-none"
              style={{
                backgroundColor: 'rgba(11, 20, 24, 0.85)',
                border: `1px solid ${isLocked ? `${theme.textColor}2e` : `${theme.targetColor}4f`}`,
                boxShadow: '0 10px 26px rgba(0,0,0,0.25)',
                opacity: isLocked ? 0.8 : 1,
              }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  className="text-lg sm:text-xl font-bold"
                  style={{ color: theme.textColor }}
                >
                  {mode.name}
                </h2>
                <span
                  className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full tracking-wide uppercase"
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

              <p
                className="text-sm leading-relaxed min-h-[44px]"
                style={{ color: theme.textColor, opacity: 0.75 }}
              >
                {mode.description}
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

              <JungleButton
                onClick={() => handleModeSelect(key)}
                className="mt-1 w-full min-h-12 text-sm sm:text-base"
              >
                {mode.category === 'benchmark'
                  ? (copy?.benchmarkCta ?? 'Run the 60-Second Test')
                  : (copy?.drillCta ?? "Start Today's Session")}
              </JungleButton>
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
              const details = modeDescriptions[key];
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
                    <h3 className="text-base font-semibold" style={{ color: theme.textColor, opacity: 0.9 }}>
                      {mode.name}
                    </h3>
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
                    {details.trainingFocus}
                  </p>
                  <p className="text-xs" style={{ color: theme.textColor, opacity: 0.55 }}>
                    {details.rhythm}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
