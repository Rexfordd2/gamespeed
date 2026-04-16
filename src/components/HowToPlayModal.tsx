import React, { useEffect } from 'react';
import { modeDescriptions } from '../utils/modeDescriptions';
import { useTheme } from '../context/ThemeContext';
import { JungleButton } from './JungleButton';
import { GameModeType } from '../types/game';
import { motion, AnimatePresence } from 'framer-motion';

interface HowToPlayModalProps {
  modeKey: GameModeType | null;
  isOpen: boolean;
  onClose: () => void;
  onStart?: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  modeKey,
  isOpen,
  onClose,
  onStart,
}) => {
  const { theme } = useTheme();
  const modeInfo = modeKey ? modeDescriptions[modeKey] : null;

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && modeInfo && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`How to play ${modeInfo.title}`}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.74)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-2xl shadow-2xl p-5 sm:p-7"
            style={{
              backgroundColor: 'rgba(8, 16, 20, 0.92)',
              border: `1px solid ${theme.targetColor}66`,
            }}
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-opacity hover:opacity-70 active:opacity-50"
              style={{
                color: theme.textColor,
                backgroundColor: `${theme.textColor}18`,
              }}
            >
              ✕
            </button>

            <div className="space-y-5 sm:space-y-6">
              <div>
                <h2
                  className="text-xl sm:text-2xl font-bold mb-1"
                  style={{ color: theme.textColor }}
                >
                  {modeInfo.title}
                </h2>
                <p
                  className="text-sm sm:text-base opacity-80 leading-relaxed"
                  style={{ color: theme.textColor }}
                >
                  {modeInfo.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div
                  className="rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: `${theme.textColor}10` }}
                >
                  <p className="text-[11px] uppercase tracking-[0.16em] opacity-60" style={{ color: theme.textColor }}>
                    Focus
                  </p>
                  <p className="text-sm mt-1 font-semibold leading-tight" style={{ color: theme.textColor }}>
                    {modeInfo.trainingFocus}
                  </p>
                </div>
                <div
                  className="rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: `${theme.textColor}10` }}
                >
                  <p className="text-[11px] uppercase tracking-[0.16em] opacity-60" style={{ color: theme.textColor }}>
                    Intensity
                  </p>
                  <p className="text-sm mt-1 font-semibold leading-tight" style={{ color: theme.textColor }}>
                    {modeInfo.intensity}
                  </p>
                </div>
                <div
                  className="rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: `${theme.textColor}10` }}
                >
                  <p className="text-[11px] uppercase tracking-[0.16em] opacity-60" style={{ color: theme.textColor }}>
                    Rhythm
                  </p>
                  <p className="text-sm mt-1 font-semibold leading-tight" style={{ color: theme.textColor }}>
                    {modeInfo.rhythm}
                  </p>
                </div>
              </div>

              <div
                className="rounded-xl p-4 sm:p-5"
                style={{ backgroundColor: `${theme.targetColor}18` }}
              >
                <h3
                  className="text-sm font-bold tracking-widest uppercase mb-3 opacity-70"
                  style={{ color: theme.targetColor }}
                >
                  Tips
                </h3>
                <ul className="space-y-2">
                  {modeInfo.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm leading-relaxed"
                      style={{ color: theme.textColor, opacity: 0.85 }}
                    >
                      <span style={{ color: theme.targetColor, flexShrink: 0 }}>›</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                {onStart && (
                  <JungleButton onClick={onStart} className="flex-1 py-3.5 font-bold">
                    Start Drill
                  </JungleButton>
                )}
                <button
                  onClick={onClose}
                  className="ui-secondary-button flex-1 py-3.5"
                  style={{
                    color: theme.textColor,
                    borderColor: `${theme.textColor}40`,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
