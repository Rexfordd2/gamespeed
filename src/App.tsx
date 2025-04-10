import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { jungleTheme } from './themes/jungle';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { GameState } from './types/game';
import { AudioManager } from './components/AudioManager';
import { EndScreen } from './components/EndScreen';

export const App = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [selectedMode, setSelectedMode] = useState('quickTap');

  const handleGameStart = (mode: string) => {
    setSelectedMode(mode);
    setGameState('playing');
    setScore(0);
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameState('end');
  };

  const handlePlayAgain = () => {
    setGameState('playing');
    setScore(0);
  };

  const handleMainMenu = () => {
    setGameState('start');
    setScore(0);
  };

  return (
    <ThemeProvider theme={jungleTheme}>
      <AudioManager />
      {gameState === 'start' && <StartScreen onStart={handleGameStart} />}
      {gameState === 'playing' && (
        <Game
          mode={selectedMode}
          initialScore={score}
          onGameOver={handleGameOver}
        />
      )}
      {gameState === 'end' && (
        <EndScreen 
          score={score} 
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleMainMenu}
        />
      )}
    </ThemeProvider>
  );
}; 