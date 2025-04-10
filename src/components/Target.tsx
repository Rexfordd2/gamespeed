import React, { useState, useEffect, useRef } from 'react';
import { Target as TargetType } from '../types/game';
import { useTheme } from '../context/ThemeContext';
import { motion, useAnimation } from 'framer-motion';

interface TargetProps {
  target: TargetType;
  onClick: () => void;
  gameMode: string;
}

export const Target: React.FC<TargetProps> = ({ target, onClick, gameMode }) => {
  const { theme } = useTheme();
  const [isActive, setIsActive] = useState(true); // Start active by default
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const controls = useAnimation();
  const holdTimerRef = useRef<number>();

  useEffect(() => {
    if (target.createdAt) {
      const now = Date.now();
      const timeLeft = target.lifespan * 1000 - (now - target.createdAt);
      if (timeLeft > 0) {
        setIsActive(true);
        const timer = setTimeout(() => {
          setIsActive(false);
        }, timeLeft);
        return () => clearTimeout(timer);
      } else {
        setIsActive(false);
      }
    }
  }, [target.createdAt, target.lifespan]);

  useEffect(() => {
    if (target.movement && isActive) {
      controls.start({
        left: [
          `${target.movement.startX}%`,
          `${target.movement.endX}%`
        ],
        top: [
          `${target.movement.startY}%`,
          `${target.movement.endY}%`
        ],
        transition: {
          duration: target.movement.duration / 1000,
          ease: "linear",
          repeat: gameMode === 'holdTrack' ? Infinity : 0,
          repeatType: "reverse"
        }
      });
    }
  }, [target.movement, isActive, controls, gameMode]);

  const handleInteractionStart = () => {
    if (!isActive) return;

    if (gameMode === 'holdTrack') {
      setIsHolding(true);
      holdTimerRef.current = window.setTimeout(() => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 500);
        onClick();
      }, target.duration * 1000);
    } else if (gameMode === 'swipeStrike') {
      // Handle swipe interaction
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 500);
      onClick();
    } else {
      // Quick tap and multi target modes
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 500);
      onClick();
    }
  };

  const handleInteractionEnd = () => {
    if (gameMode === 'holdTrack' && isHolding) {
      setIsHolding(false);
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
    }
  };

  const targetStyle = {
    backgroundColor: showSuccess 
      ? '#22c55e' 
      : showError 
        ? '#ef4444' 
        : isHolding
          ? '#60a5fa'
          : theme.targetColor,
    transform: showSuccess 
      ? 'scale(1.2)' 
      : showError 
        ? 'scale(0.8)' 
        : 'scale(1)',
    position: 'absolute' as const,
    left: `${target.x}%`,
    top: `${target.y}%`,
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease-in-out',
    zIndex: 10
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        ...controls,
        scale: 1,
        opacity: 1
      }}
      exit={{ scale: 0, opacity: 0 }}
      style={targetStyle}
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
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
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: theme.backgroundColor,
          border: `2px solid ${theme.textColor}`,
        }}
      />
      {target.sequenceIndex !== undefined && (
        <div 
          style={{ 
            position: 'absolute',
            color: theme.textColor,
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}
        >
          {target.sequenceIndex + 1}
        </div>
      )}
    </motion.div>
  );
}; 