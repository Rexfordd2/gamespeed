import React, { useEffect } from 'react';
import { modeDescriptions } from '../utils/modeDescriptions';
import { useTheme } from '../context/ThemeContext';

interface HowToPlayModalProps {
  modeKey: string;
  isOpen: boolean;
  onClose: () => void;
  onStart?: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  modeKey,
  isOpen,
  onClose,
  onStart,
}) => {
  const { theme } = useTheme();
  const modeInfo = modeDescriptions[modeKey as keyof typeof modeDescriptions];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !modeInfo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div
        className="relative w-full max-w-2xl p-8 rounded-2xl shadow-2xl transform transition-all duration-300 ease-out"
        style={{
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
          animation: 'modalSlideIn 0.3s ease-out',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-opacity-20 transition-colors duration-200"
          style={{ 
            color: theme.textColor,
            backgroundColor: `${theme.textColor}20`,
          }}
        >
          ✕
        </button>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-3">{modeInfo.title}</h2>
            <p className="text-lg opacity-90">{modeInfo.description}</p>
          </div>

          <div className="bg-opacity-20 rounded-xl p-6" style={{ backgroundColor: `${theme.targetColor}20` }}>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">💡</span>
              Pro Tips
            </h3>
            <ul className="space-y-3">
              {modeInfo.tips.map((tip, index) => (
                <li 
                  key={index}
                  className="flex items-start animate-fade-in"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    opacity: 0,
                    animation: 'fadeIn 0.3s ease-out forwards',
                  }}
                >
                  <span className="mr-2 mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            {onStart && (
              <button
                onClick={onStart}
                className="px-6 py-3 rounded-xl font-medium transform hover:scale-105 transition-transform duration-200"
                style={{
                  backgroundColor: theme.targetColor,
                  color: theme.backgroundColor,
                }}
              >
                Start Game
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-medium border transform hover:scale-105 transition-transform duration-200"
              style={{
                borderColor: theme.textColor,
                color: theme.textColor,
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeIn {
            to {
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}; 