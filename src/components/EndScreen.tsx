import React from 'react';

interface EndScreenProps {
  score: number;
  onPlayAgain: () => void;
}

export const EndScreen = ({ score, onPlayAgain }: EndScreenProps) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-green-900 p-8 rounded-lg text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Game Over!</h2>
        <p className="text-2xl text-yellow-400 mb-8">Final Score: {score}</p>
        <button
          onClick={onPlayAgain}
          className="px-6 py-3 bg-yellow-500 text-green-900 text-xl font-bold rounded-lg
            hover:bg-yellow-400 active:scale-95 transition-all duration-200
            shadow-lg hover:shadow-xl"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}; 