import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { GameModeSelector } from './components/GameModeSelector';
import { Game } from './components/Game';
import { JungleBackground } from './components/JungleBackground';
import { AudioManager } from './components/AudioManager';
import { jungleTheme } from './themes/jungleTheme';

function App() {
  const [gameMode, setGameMode] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const handleModeSelect = (mode: string) => {
    setGameMode(mode);
    setScore(0);
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameMode(null);
  };

  return (
    <ThemeProvider theme={jungleTheme}>
      <div className="min-h-screen relative">
        <JungleBackground />
        <AudioManager />
        
        {gameMode ? (
          <Game
            mode={gameMode}
            onGameOver={handleGameOver}
            initialScore={score}
          />
        ) : (
          <GameModeSelector onSelectMode={handleModeSelect} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App; 