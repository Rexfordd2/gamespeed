import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { jungleTheme } from './themes/jungle';
import { AudioManager } from './components/AudioManager';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { EndScreen } from './components/EndScreen';
import { AudioToggle } from './components/AudioToggle';
import { GameModeType, GameState, GameResult } from './types/game';
import { resolvePlayableMode } from './utils/gameModes';

export const App = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [selectedMode, setSelectedMode] = useState<GameModeType>('quickTap');
  const [gameResult, setGameResult] = useState<GameResult>({
    score: 0,
    misses: 0,
    bestStreak: 0,
    mode: 'quickTap',
    modeName: 'Quick Tap',
  });

  const handleGameStart = (mode: GameModeType) => {
    setSelectedMode(resolvePlayableMode(mode));
    setGameState('playing');
  };

  const handleGameOver = (result: GameResult) => {
    setGameResult(result);
    setGameState('end');
  };

  const handlePlayAgain = () => {
    setGameState('playing');
  };

  const handleMainMenu = () => {
    setGameState('start');
  };

  return (
    <ThemeProvider theme={jungleTheme}>
      <AudioManager>
        <AudioToggle />
        {gameState === 'start' && <StartScreen onStart={handleGameStart} />}
        {gameState === 'playing' && (
          <Game
            mode={selectedMode}
            onGameOver={handleGameOver}
            onMainMenu={handleMainMenu}
          />
        )}
        {gameState === 'end' && (
          <EndScreen
            result={gameResult}
            onPlayAgain={handlePlayAgain}
            onMainMenu={handleMainMenu}
          />
        )}
      </AudioManager>
    </ThemeProvider>
  );
};
