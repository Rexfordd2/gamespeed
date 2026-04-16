import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

interface JungleButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export const JungleButton: React.FC<JungleButtonProps> = ({
  onClick,
  children,
  className = '',
  id,
  name,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const background = disabled
    ? `${theme.targetColor}66`
    : `linear-gradient(135deg, ${theme.targetColor}, #a3e635)`;

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-xl font-semibold tracking-[0.01em] relative overflow-hidden ${className}`}
      style={{
        background,
        color: '#102013',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 10px 24px ${theme.targetColor}45`,
      }}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.55 }}
      id={id}
      name={name}
      aria-disabled={disabled}
    >
      {!disabled && (
        <motion.div
          className="absolute -inset-y-4 -left-10 w-20 rotate-12"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))',
            filter: 'blur(1px)',
          }}
          animate={{ x: ['0%', '260%'], opacity: [0, 0.5, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};
