import React, { useState } from 'react';
import { gameModes } from '../utils/gameModes';
import { useTheme } from '../context/ThemeContext';
import { HowToPlayModal } from './HowToPlayModal';
import { JungleButton } from './JungleButton';
import { motion } from 'framer-motion';

interface GameModeSelectorProps {
  onSelectMode: (mode: string) => void;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onSelectMode }) => {
  const { theme } = useTheme();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const handleModeSelect = (modeKey: string) => {
    setSelectedMode(modeKey);
    setShowHowToPlay(true);
  };

  const handleStartGame = () => {
    if (selectedMode) {
      onSelectMode(selectedMode);
      setShowHowToPlay(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <motion.h1 
        className="text-5xl font-bold mb-12 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          color: theme.textColor,
          textShadow: `0 2px 4px ${theme.targetColor}40`,
        }}
      >
        Select Game Mode
      </motion.h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {Object.entries(gameModes).map(([key, mode]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * parseInt(key) }}
            onMouseEnter={() => setHoveredMode(key)}
            onMouseLeave={() => setHoveredMode(null)}
            className="p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            style={{
              backgroundColor: theme.backgroundColor,
              color: theme.textColor,
              border: `2px solid ${theme.targetColor}`,
              transform: hoveredMode === key ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <div className="flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold mb-3">{mode.name}</h2>
              <p className="text-base opacity-80 mb-4">{mode.description}</p>
              <JungleButton
                onClick={() => handleModeSelect(key)}
                className="w-full"
              >
                Play
              </JungleButton>
            </div>
          </motion.div>
        ))}
      </div>

      <HowToPlayModal
        modeKey={selectedMode || ''}
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        onStart={handleStartGame}
      />
    </div>
  );
}; 