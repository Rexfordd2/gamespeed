import { useTheme } from '../context/ThemeContext';
import { GameModeSelector } from './GameModeSelector';
import { JungleBackground } from './JungleBackground';

interface StartScreenProps {
  onStart: (mode: string) => void;
}

export const StartScreen = ({ onStart }: StartScreenProps) => {
  const { theme } = useTheme();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      <JungleBackground />
      <div className="relative z-10 text-center">
        <h1 
          className="text-6xl font-bold mb-8"
          style={{ color: theme.textColor }}
        >
          GameSpeed
        </h1>
        <p 
          className="text-xl mb-12"
          style={{ color: theme.textColor }}
        >
          Test your reflexes in the jungle!
        </p>
        <GameModeSelector onSelectMode={onStart} />
      </div>
    </div>
  );
}; 