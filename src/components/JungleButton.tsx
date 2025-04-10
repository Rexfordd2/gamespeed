import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

interface JungleButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const JungleButton: React.FC<JungleButtonProps> = ({
  onClick,
  children,
  className = '',
}) => {
  const { theme } = useTheme();

  return (
    <motion.button
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-medium relative overflow-hidden ${className}`}
      style={{
        backgroundColor: theme.targetColor,
        color: theme.backgroundColor,
      }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(45deg, ${theme.targetColor}40, transparent)`,
        }}
        animate={{
          x: ['0%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}; 