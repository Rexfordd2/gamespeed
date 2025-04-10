import { useTheme } from '../context/ThemeContext';

interface GameHeaderProps {
  score: number;
  timeLeft: number;
}

export const GameHeader = ({ score, timeLeft }: GameHeaderProps) => {
  const { theme } = useTheme();

  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
      <div className="text-2xl font-bold" style={{ color: theme.textColor }}>
        Score: {score}
      </div>
      <div className="text-2xl font-bold" style={{ color: theme.textColor }}>
        Time: {Math.ceil(timeLeft)}s
      </div>
    </div>
  );
}; 