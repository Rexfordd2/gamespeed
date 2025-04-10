import { useTheme } from '../context/ThemeContext';

interface EndScreenProps {
  score: number;
  onPlayAgain: () => void;
}

export const EndScreen = ({ score, onPlayAgain }: EndScreenProps) => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4" style={{ color: theme.textColor }}>
        Game Over!
      </h1>
      <p className="text-2xl mb-8" style={{ color: theme.textColor }}>
        Final Score: {score}
      </p>
      <button
        onClick={onPlayAgain}
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
}; 