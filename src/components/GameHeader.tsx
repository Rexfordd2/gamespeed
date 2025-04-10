import React from 'react';

interface GameHeaderProps {
  score: number;
  timeLeft: number;
}

export const GameHeader = ({ score, timeLeft }: GameHeaderProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 bg-green-900 bg-opacity-80 p-4 flex justify-between items-center text-white">
      <div className="text-2xl font-bold">
        Score: <span className="text-yellow-400">{score}</span>
      </div>
      <div className="text-2xl font-bold">
        Time: <span className="text-yellow-400">{timeLeft}s</span>
      </div>
    </div>
  );
}; 