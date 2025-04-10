import { useState, useEffect } from 'react';
import { Target as TargetType } from '../types/game';
import { useTheme } from '../context/ThemeContext';
import { gameModes } from '../utils/gameModes';
import { GameHeader } from './GameHeader';
import { Target } from './Target';

interface GameProps {
  mode?: string;
  onGameOver: (score: number) => void;
  initialScore: number;
}

export const Game = ({ mode = 'quickTap', onGameOver, initialScore = 0 }: GameProps) => {
  const { theme } = useTheme();
  const [score, setScore] = useState(initialScore);
  const [targets, setTargets] = useState<TargetType[]>([]);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds game duration
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Game timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onGameOver(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [score, onGameOver]);

  useEffect(() => {
    const gameMode = gameModes[mode];
    if (!gameMode) return;

    const interval = setInterval(() => {
      const newTargets = gameMode.generateTargets({
        screenSize,
        existingTargets: targets,
        currentTime: Date.now()
      });

      // Check for game over condition
      if (newTargets.length === 0 && targets.length > 0) {
        onGameOver(score);
      } else {
        setTargets(newTargets);
      }
    }, gameMode.config.targetInterval);

    return () => clearInterval(interval);
  }, [mode, screenSize, targets, score, onGameOver]);

  const handleTargetClick = (targetId: string) => {
    setScore(prev => prev + 1);
    setTargets(prev => prev.filter(t => t.id !== targetId));
  };

  return (
    <div 
      className="relative min-h-screen"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <GameHeader score={score} timeLeft={timeLeft} />
      
      {targets.map(target => (
        <Target
          key={target.id}
          target={target}
          onClick={() => handleTargetClick(target.id)}
          gameMode={mode}
        />
      ))}
    </div>
  );
}; 