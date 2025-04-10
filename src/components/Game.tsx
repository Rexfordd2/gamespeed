import { useState, useEffect } from 'react';
import { Target } from '../types/game';
import { useTheme } from '../context/ThemeContext';
import { gameModes } from '../utils/gameModes';

interface GameProps {
  mode?: string;
  onGameOver: (score: number) => void;
  initialScore: number;
}

export const Game = ({ mode = 'quickTap', onGameOver, initialScore = 0 }: GameProps) => {
  const { theme } = useTheme();
  const [score, setScore] = useState(initialScore);
  const [targets, setTargets] = useState<Target[]>([]);
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
      <div className="absolute top-4 left-4 text-2xl font-bold" style={{ color: theme.textColor }}>
        Score: {score}
      </div>
      
      {targets.map(target => (
        <div
          key={target.id}
          className="absolute cursor-pointer transform transition-transform hover:scale-110"
          style={{
            left: target.x,
            top: target.y,
            width: 50,
            height: 50,
            backgroundColor: theme.targetColor,
            borderRadius: '50%'
          }}
          onClick={() => handleTargetClick(target.id)}
        />
      ))}
    </div>
  );
}; 