import { useTheme } from '../context/ThemeContext';
import { JungleButton } from './JungleButton';

interface EndScreenProps {
  score: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const EndScreen = ({ score, onPlayAgain, onMainMenu }: EndScreenProps) => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4" style={{ color: theme.textColor }}>
        Game Over!
      </h1>
      <p className="text-2xl mb-8" style={{ color: theme.textColor }}>
        Final Score: {score}
      </p>
      <div className="flex flex-col gap-4">
        <JungleButton onClick={onPlayAgain}>
          Play Again
        </JungleButton>
        <JungleButton onClick={onMainMenu}>
          Main Menu
        </JungleButton>
      </div>
    </div>
  );
}; 