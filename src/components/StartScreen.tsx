import React from 'react';
import { GameMode } from '../types/game';
import { GameModeSelector } from './GameModeSelector';

interface StartScreenProps {
  selectedMode: string;
  onModeSelect: (mode: string) => void;
  onStart: () => void;
}

export const StartScreen = ({ selectedMode, onModeSelect, onStart }: StartScreenProps) => {
  return (
    <div className="absolute inset-0 bg-green-900 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-4">
        <h1 className="text-6xl font-bold text-white mb-8">GameSpeed</h1>
        
        <GameModeSelector
          selectedMode={selectedMode}
          onModeChange={onModeSelect}
        />

        <button
          onClick={onStart}
          className="px-8 py-4 bg-yellow-500 text-green-900 text-2xl font-bold rounded-lg
            hover:bg-yellow-400 active:scale-95 transition-all duration-200
            shadow-lg hover:shadow-xl"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}; 