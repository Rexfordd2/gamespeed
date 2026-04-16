import { useEffect, useMemo, useRef, useState } from 'react';
import { Target as TargetType } from '../types/game';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface TargetProps {
  target: TargetType;
  onClick: () => void;
}

export const Target = ({ target, onClick }: TargetProps) => {
  const { theme } = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [iconSrc, setIconSrc] = useState(theme.icon.path);
  const clickedRef = useRef(false);
  const iconFallbackAttemptedRef = useRef(false);

  useEffect(() => {
    setIconSrc(theme.icon.path);
    iconFallbackAttemptedRef.current = false;
  }, [theme.icon.fallbackPath, theme.icon.path]);

  const { targetSize, ringRadius, ringCircumference, centerPoint, innerInset, iconSize, ringStroke } =
    useMemo(() => {
      const isTouchDevice =
        typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
      const size = isTouchDevice ? 84 : 70;
      const stroke = size >= 84 ? 3.5 : 3;
      const radius = size / 2 - stroke - 1;
      const center = size / 2;

      return {
        targetSize: size,
        ringRadius: radius,
        ringCircumference: 2 * Math.PI * radius,
        centerPoint: center,
        innerInset: Math.round(size * 0.11),
        iconSize: Math.round(size * 0.47),
        ringStroke: stroke,
      };
    }, []);

  const handleClick = () => {
    const isExpired = Date.now() - target.createdAt >= target.lifespan * 1000;
    if (isExpired || clickedRef.current) return;
    setIsPressed(false);
    clickedRef.current = true;
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClick();
    }, 120);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Negative delay syncs the ring animation to when the target was actually created,
  // so even targets that render slightly late show the correct remaining arc.
  const ringDelay = -((Date.now() - target.createdAt) / 1000);

  const handleIconError = () => {
    if (!iconFallbackAttemptedRef.current && theme.icon.fallbackPath) {
      iconFallbackAttemptedRef.current = true;
      setIconSrc(theme.icon.fallbackPath);
      return;
    }
    setIconSrc('');
  };

  return (
    <AnimatePresence>
      <motion.div
        role="button"
        aria-label="Hit target"
        tabIndex={0}
        initial={{ scale: 0.76, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.78, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.55 }}
        style={{
          position: 'absolute',
          left: `${target.x}%`,
          top: `${target.y}%`,
          width: `${targetSize}px`,
          height: `${targetSize}px`,
          transform: 'translate(-50%, -50%)',
          cursor: 'pointer',
          zIndex: 10,
          userSelect: 'none',
          touchAction: 'manipulation',
          outline: 'none',
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerCancel={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
        whileTap={{ scale: 0.93 }}
      >
        {/* Countdown ring */}
        <svg
          viewBox={`0 0 ${targetSize} ${targetSize}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {/* Track ring */}
          <circle
            cx={centerPoint}
            cy={centerPoint}
            r={ringRadius}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={ringStroke}
          />
          {/* Countdown arc */}
          <circle
            cx={centerPoint}
            cy={centerPoint}
            r={ringRadius}
            fill="none"
            stroke={showSuccess ? '#22c55e' : theme.targetColor}
            strokeWidth={ringStroke}
            strokeDasharray={ringCircumference}
            strokeLinecap="round"
            style={{
              transformOrigin: `${centerPoint}px ${centerPoint}px`,
              transform: 'rotate(-90deg)',
              animation: `countdown-ring ${target.lifespan}s linear forwards`,
              animationDelay: `${ringDelay}s`,
              transition: 'stroke 0.09s ease',
              ['--ring-circumference' as string]: ringCircumference,
            }}
          />
        </svg>

        {/* Inner hit area */}
        <div
          style={{
            position: 'absolute',
            inset: `${innerInset}px`,
            borderRadius: '50%',
            backgroundColor: showSuccess
              ? 'rgba(34, 197, 94, 0.85)'
              : `${theme.targetColor}22`,
            border: `2px solid ${showSuccess ? '#22c55e' : theme.targetColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition:
              'background-color 0.1s ease, border-color 0.1s ease, box-shadow 0.1s ease, transform 0.09s ease',
          boxShadow: showSuccess
              ? '0 0 24px rgba(34, 197, 94, 0.55)'
              : isPressed
                ? `0 0 20px ${theme.targetColor}88`
                : `0 0 16px ${theme.targetColor}66`,
            transform: isPressed ? 'scale(0.96)' : showSuccess ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {showSuccess && (
            <motion.span
              initial={{ scale: 0.84, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.08, opacity: 0 }}
              transition={{ duration: 0.11, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                color: '#dcfce7',
                fontSize: `${Math.round(iconSize * 0.5)}px`,
                fontWeight: 800,
                lineHeight: 1,
                textShadow: '0 0 10px rgba(22, 163, 74, 0.45)',
              }}
              aria-hidden="true"
            >
              ✓
            </motion.span>
          )}
          {iconSrc ? (
            <img
              src={iconSrc}
              alt=""
              aria-hidden="true"
              draggable={false}
              onError={handleIconError}
              style={{
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                objectFit: 'contain',
                pointerEvents: 'none',
                transition: 'transform 0.09s ease, opacity 0.1s ease',
                transform: showSuccess ? 'scale(0.9)' : isPressed ? 'scale(0.95)' : 'scale(1)',
                opacity: showSuccess ? 0.88 : 1,
              }}
            />
          ) : (
            <span
              aria-hidden="true"
              style={{
                fontSize: `${Math.round(iconSize * 0.52)}px`,
                color: '#dcfce7',
                lineHeight: 1,
                textShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
              }}
            >
              ◉
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
