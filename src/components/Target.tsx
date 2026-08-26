import { useEffect, useMemo, useRef, useState } from 'react';
import { Target as TargetType } from '../types/game';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getSwipeDirection, isIntentionalSwipe } from '../utils/swipeDetection';
import { HoldVisualPhase } from '../utils/holdTracking';
import { SwipeTimingVerdict } from '../utils/modeMechanics';

interface TargetProps {
  target: TargetType;
  targetIconPath?: string;
  targetIconFallbackPath?: string;
  chromeIconPath?: string;
  targetStyle?: string;
  interactionMode: 'tap' | 'swipe' | 'hold';
  onActivate: (payload: {
    interactionMode: 'tap' | 'swipe' | 'hold';
    swipeDirection?: 'left' | 'right' | 'up' | 'down';
    elapsedMs?: number;
    swipeTimingVerdict?: SwipeTimingVerdict;
  }) => void;
  onSwipeAttemptFail?: (payload: {
    reason: 'short' | 'direction' | 'timing';
    elapsedMs: number;
    swipeDirection?: 'left' | 'right' | 'up' | 'down';
    swipeTimingVerdict?: SwipeTimingVerdict;
  }) => void;
  holdVisualState?: {
    phase: HoldVisualPhase;
    progress: number;
  };
  onHoldPointerStart?: (payload: {
    targetId: string;
    pointerId: number;
    x: number;
    y: number;
  }) => void;
  onHoldPointerMove?: (payload: { pointerId: number; x: number; y: number }) => void;
  onHoldPointerEnd?: (payload: { pointerId: number }) => void;
}

export const Target = ({
  target,
  targetIconPath,
  targetIconFallbackPath,
  chromeIconPath,
  targetStyle,
  interactionMode,
  onActivate,
  onSwipeAttemptFail,
  holdVisualState,
  onHoldPointerStart,
  onHoldPointerMove,
  onHoldPointerEnd,
}: TargetProps) => {
  const { theme } = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showFailedSwipe, setShowFailedSwipe] = useState(false);
  const resolvedTargetIconPath = targetIconPath ?? theme.icon.path;
  const resolvedTargetIconFallbackPath = targetIconFallbackPath ?? theme.icon.fallbackPath;
  const [iconSrc, setIconSrc] = useState(resolvedTargetIconPath);
  const clickedRef = useRef(false);
  const iconFallbackAttemptedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number; at: number } | null>(null);
  const failFeedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIconSrc(resolvedTargetIconPath);
    iconFallbackAttemptedRef.current = false;
  }, [resolvedTargetIconFallbackPath, resolvedTargetIconPath]);

  useEffect(
    () => () => {
      if (failFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(failFeedbackTimeoutRef.current);
      }
    },
    [],
  );

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

  const handleActivate = (payload?: {
    swipeDirection?: 'left' | 'right' | 'up' | 'down';
    elapsedMs?: number;
    swipeTimingVerdict?: SwipeTimingVerdict;
  }) => {
    const isExpired = Date.now() - target.createdAt >= target.lifespan * 1000;
    if (isExpired || clickedRef.current) return;
    setIsPressed(false);
    clickedRef.current = true;
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onActivate({
        interactionMode: interactionMode === 'swipe' ? 'swipe' : 'tap',
        swipeDirection: payload?.swipeDirection,
        elapsedMs: payload?.elapsedMs,
        swipeTimingVerdict: payload?.swipeTimingVerdict,
      });
    }, 120);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (interactionMode !== 'tap') return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  // Negative delay syncs the ring animation to when the target was actually created,
  // so even targets that render slightly late show the correct remaining arc.
  const ringDelay = -((Date.now() - target.createdAt) / 1000);

  const handleIconError = () => {
    if (!iconFallbackAttemptedRef.current && resolvedTargetIconFallbackPath) {
      iconFallbackAttemptedRef.current = true;
      setIconSrc(resolvedTargetIconFallbackPath);
      return;
    }
    setIconSrc('');
  };

  const swipeThresholdPx = useMemo(() => {
    const isTouchDevice =
      typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    return isTouchDevice ? 34 : 26;
  }, []);

  const triggerFailedSwipe = () => {
    setShowFailedSwipe(true);
    if (failFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(failFeedbackTimeoutRef.current);
    }
    failFeedbackTimeoutRef.current = window.setTimeout(() => {
      setShowFailedSwipe(false);
      failFeedbackTimeoutRef.current = null;
    }, 180);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (interactionMode === 'hold') {
      onHoldPointerStart?.({
        targetId: target.id,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      });
    }
    setIsPressed(true);
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      at: Date.now(),
    };
    if ('setPointerCapture' in event.currentTarget) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // setPointerCapture is not guaranteed in all environments (e.g. tests).
      }
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsPressed(false);
    const pointerStart = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!pointerStart) return;

    if (interactionMode === 'hold') {
      onHoldPointerEnd?.({ pointerId: event.pointerId });
      return;
    }

    if (interactionMode === 'tap') {
      handleActivate();
      return;
    }

    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    const elapsedMs = Date.now() - pointerStart.at;
    if (!isIntentionalSwipe({ dx, dy, elapsedMs, minDistancePx: swipeThresholdPx })) {
      triggerFailedSwipe();
      onSwipeAttemptFail?.({ reason: 'short', elapsedMs });
      return;
    }

    const direction = getSwipeDirection(dx, dy);
    if (direction !== target.swipeDirection) {
      triggerFailedSwipe();
      onSwipeAttemptFail?.({ reason: 'direction', elapsedMs, swipeDirection: direction });
      return;
    }

    handleActivate({
      swipeDirection: direction,
      elapsedMs,
    });
  };

  const directionHint = target.swipeDirection
    ? {
        left: (
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path d="M16 4 6 11l10 7" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M15 7 8 11l7 4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.55" />
          </svg>
        ),
        right: (
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path d="M6 4l10 7-10 7" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M7 7l7 4-7 4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.55" />
          </svg>
        ),
        up: (
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path d="M4 16 11 6l7 10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M7 15 11 9l4 6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.55" />
          </svg>
        ),
        down: (
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path d="M4 6l7 10 7-10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M7 7l4 6 4-6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.55" />
          </svg>
        ),
      }[target.swipeDirection]
    : null;

  const holdPhase = holdVisualState?.phase ?? 'idle';
  const holdProgress = holdVisualState?.progress ?? 0;
  const holdProgressArc = ringCircumference * (1 - holdProgress);
  const stimulusVariant = target.stimulusVariant ?? 'standard';
  const variantBorderColor =
    stimulusVariant === 'contrast'
      ? '#f8fafc'
      : stimulusVariant === 'peripheral'
        ? '#a3e635'
        : stimulusVariant === 'calm'
          ? '#67e8f9'
          : theme.targetColor;

  const ariaLabel =
    interactionMode === 'hold'
      ? 'Hold target'
      : interactionMode === 'swipe' && target.swipeDirection
      ? `Swipe target ${target.swipeDirection}`
      : 'Hit target';

  return (
    <AnimatePresence>
      <motion.div
        role="button"
        aria-label={ariaLabel}
        tabIndex={0}
        data-target-style={targetStyle}
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
          touchAction: interactionMode === 'swipe' || interactionMode === 'hold' ? 'none' : 'manipulation',
          outline: 'none',
          transition:
            interactionMode === 'swipe' || interactionMode === 'hold'
              ? 'left 50ms linear, top 50ms linear'
              : undefined,
        }}
        onClick={() => {
          if (interactionMode === 'tap') {
            handleActivate();
          }
        }}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={event => {
          if (interactionMode === 'hold') {
            onHoldPointerMove?.({ pointerId: event.pointerId, x: event.clientX, y: event.clientY });
          }
        }}
        onPointerUp={handlePointerUp}
        onPointerCancel={event => {
          setIsPressed(false);
          pointerStartRef.current = null;
          if (interactionMode === 'hold') {
            onHoldPointerEnd?.({ pointerId: event.pointerId });
          }
        }}
        onPointerLeave={() => {
          if (interactionMode === 'tap') {
            setIsPressed(false);
          }
        }}
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
            stroke={
              showSuccess
                ? '#22c55e'
                : holdPhase === 'broken'
                  ? '#ef4444'
                  : holdPhase === 'locked'
                    ? '#86efac'
                    : variantBorderColor
            }
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
          {interactionMode === 'hold' && (
            <circle
              cx={centerPoint}
              cy={centerPoint}
              r={ringRadius - ringStroke - 2}
              fill="none"
              stroke={
                holdPhase === 'broken'
                  ? '#ef4444'
                  : holdPhase === 'locked'
                    ? '#22c55e'
                    : holdPhase === 'arming'
                      ? '#facc15'
                      : 'rgba(255,255,255,0.22)'
              }
              strokeWidth={Math.max(2, ringStroke - 0.2)}
              strokeDasharray={ringCircumference}
              strokeDashoffset={holdProgressArc}
              strokeLinecap="round"
              style={{
                transformOrigin: `${centerPoint}px ${centerPoint}px`,
                transform: 'rotate(-90deg)',
                transition: 'stroke-dashoffset 0.05s linear, stroke 0.09s ease',
              }}
            />
          )}
        </svg>

        {/* Inner hit area */}
        <div
          style={{
            position: 'absolute',
            inset: `${innerInset}px`,
            borderRadius: '50%',
            backgroundColor: showSuccess
              ? 'rgba(34, 197, 94, 0.85)'
              : showFailedSwipe
                ? 'rgba(239, 68, 68, 0.7)'
                : holdPhase === 'broken'
                  ? 'rgba(239, 68, 68, 0.64)'
                  : holdPhase === 'locked'
                    ? 'rgba(34, 197, 94, 0.36)'
                    : holdPhase === 'arming'
                      ? 'rgba(250, 204, 21, 0.28)'
                      : `${theme.targetColor}22`,
            border: `2px solid ${
              showSuccess
                ? '#22c55e'
                : showFailedSwipe
                  ? '#ef4444'
                  : holdPhase === 'broken'
                    ? '#ef4444'
                    : holdPhase === 'locked'
                      ? '#22c55e'
                      : holdPhase === 'arming'
                        ? '#facc15'
                        : variantBorderColor
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition:
              'background-color 0.1s ease, border-color 0.1s ease, box-shadow 0.1s ease, transform 0.09s ease',
          boxShadow: showSuccess
              ? '0 0 24px rgba(34, 197, 94, 0.55)'
              : showFailedSwipe
                ? '0 0 22px rgba(239, 68, 68, 0.65)'
                : holdPhase === 'broken'
                  ? '0 0 22px rgba(239, 68, 68, 0.65)'
                  : holdPhase === 'locked'
                    ? '0 0 24px rgba(34, 197, 94, 0.6)'
                    : holdPhase === 'arming'
                      ? '0 0 18px rgba(250, 204, 21, 0.56)'
              : isPressed
                ? `0 0 20px ${variantBorderColor}88`
                : `0 0 16px ${variantBorderColor}66`,
            transform: isPressed ? 'scale(0.96)' : showSuccess ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {interactionMode === 'hold' && !showSuccess && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: '-18px',
                fontSize: `${Math.round(iconSize * 0.34)}px`,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color:
                  holdPhase === 'broken'
                    ? '#fca5a5'
                    : holdPhase === 'locked'
                      ? '#bbf7d0'
                      : holdPhase === 'arming'
                        ? '#fde68a'
                        : `${theme.textColor}99`,
                textShadow: '0 0 8px rgba(0,0,0,0.45)',
              }}
            >
              {holdPhase === 'broken'
                ? 'break'
                : holdPhase === 'locked'
                  ? 'locked'
                  : holdPhase === 'arming'
                    ? 'hold'
                    : 'track'}
            </span>
          )}
          {showSuccess && (
            <motion.span
              initial={{ scale: 0.84, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.08, opacity: 0 }}
              transition={{ duration: 0.11, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                color: '#dcfce7',
                lineHeight: 1,
                textShadow: '0 0 10px rgba(22, 163, 74, 0.45)',
              }}
              aria-hidden="true"
            >
              <svg width={Math.round(iconSize * 0.5)} height={Math.round(iconSize * 0.5)} viewBox="0 0 24 24" fill="none">
                <path d="M5 12.5 9.5 17 19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.span>
          )}
          {interactionMode === 'swipe' && directionHint && !showSuccess && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '4px',
                right: '8px',
                color: theme.targetColor,
                lineHeight: 1,
                textShadow: `0 0 8px ${theme.targetColor}88`,
                opacity: 0.92,
              }}
            >
              {directionHint}
            </span>
          )}
          {chromeIconPath && !showSuccess && (
            <img
              src={chromeIconPath}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{
                position: 'absolute',
                width: `${Math.round(iconSize * 1.35)}px`,
                height: `${Math.round(iconSize * 1.35)}px`,
                objectFit: 'contain',
                pointerEvents: 'none',
                opacity: 0.42,
              }}
            />
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
                position: 'relative',
                zIndex: 1,
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
