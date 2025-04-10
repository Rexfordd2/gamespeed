import React, { useState, useEffect } from 'react';
import { Target as TargetType } from '../types/game';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface TargetProps {
  target: TargetType;
  onClick: () => void;
  gameMode: string;
}

export const Target: React.FC<TargetProps> = ({ target, onClick, gameMode }) => {
  const { theme } = useTheme();
  const [isActive, setIsActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (target.createdAt) {
      const now = Date.now();
      const timeLeft = target.lifespan - (now - target.createdAt);
      if (timeLeft > 0) {
        setIsActive(true);
        const timer = setTimeout(() => {
          setIsActive(false);
        }, timeLeft);
        return () => clearTimeout(timer);
      }
    }
  }, [target.createdAt, target.lifespan]);

  const handleClick = () => {
    if (isActive) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 500);
      onClick();
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
    }
  };

  const targetStyle = {
    backgroundColor: showSuccess 
      ? '#22c55e' 
      : showError 
        ? '#ef4444' 
        : theme.targetColor,
    transform: showSuccess 
      ? 'scale(1.2)' 
      : showError 
        ? 'scale(0.8)' 
        : 'scale(1)',
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            transition: {
              type: 'spring',
              stiffness: 260,
              damping: 20,
            },
          }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute cursor-pointer rounded-full flex items-center justify-center"
          style={{
            ...targetStyle,
            left: `${target.x}%`,
            top: `${target.y}%`,
            width: '60px',
            height: '60px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease-in-out',
          }}
          onClick={handleClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-8 h-8 rounded-full"
            style={{
              backgroundColor: theme.backgroundColor,
              border: `2px solid ${theme.textColor}`,
            }}
          />
          {gameMode === 'sequenceMemory' && target.sequenceIndex !== undefined && (
            <div 
              className="absolute text-xl font-bold"
              style={{ color: theme.textColor }}
            >
              {target.sequenceIndex + 1}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 