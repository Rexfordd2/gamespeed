import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { jungleTheme } from './themes/jungle';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { GameState } from './types/game';
import { AudioManager } from './components/AudioManager';

export const App = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);

  const handleGameStart = () => {
    setGameState('playing');
    setScore(0);
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameState('end');
  };

  return (
    <ThemeProvider theme={jungleTheme}>
      <AudioManager />
      {gameState === 'start' && <StartScreen onStart={handleGameStart} />}
      {gameState === 'playing' && (
        <Game
          initialScore={score}
          onGameOver={handleGameOver}
        />
      )}
    </ThemeProvider>
  );
}; 