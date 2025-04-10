import React, { useState, useEffect } from 'react';
import { Target } from './Target';
import { useTheme } from '../context/ThemeContext';
import { gameModes } from '../utils/gameModes';
import { Target as TargetType } from '../types/game';

interface GameProps {
  mode: string;
  onGameOver: (score: number) => void;
  initialScore: number;
}

export const Game: React.FC<GameProps> = ({ mode, onGameOver, initialScore }) => {
  const { theme } = useTheme();
  const [score, setScore] = useState(initialScore);
  const [targets, setTargets] = useState<TargetType[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    const gameMode = gameModes[mode];
    if (!gameMode) return;

    const generateTargets = () => {
      const newTargets = gameMode.generateTargets({
        screenSize: { width: window.innerWidth, height: window.innerHeight },
        existingTargets: targets,
        currentTime: Date.now(),
      });
      setTargets(newTargets);
    };

    const interval = setInterval(generateTargets, 1000);
    return () => clearInterval(interval);
  }, [mode, targets]);

  const handleTargetClick = () => {
    setScore(prevScore => prevScore + 1);
  };

  const handleGameOver = () => {
    setIsGameOver(true);
    onGameOver(score);
  };

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-4" style={{ color: theme.textColor }}>
          Game Over!
        </h1>
        <p className="text-2xl mb-8" style={{ color: theme.textColor }}>
          Final Score: {score}
        </p>
        <button
          onClick={() => onGameOver(score)}
          className="px-6 py-3 rounded-xl font-medium"
          style={{
            backgroundColor: theme.targetColor,
            color: theme.backgroundColor,
          }}
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute top-4 left-4 text-2xl font-bold" style={{ color: theme.textColor }}>
        Score: {score}
      </div>
      {targets.map(target => (
        <Target
          key={target.id}
          target={target}
          onClick={handleTargetClick}
          gameMode={mode}
        />
      ))}
    </div>
  );
}; 