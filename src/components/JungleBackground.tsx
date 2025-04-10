import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const JungleBackground: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className={`absolute inset-0 ${theme.background.gradient}`} />
      
      {/* Top overlay */}
      <div 
        className="absolute top-0 left-0 right-0 h-32 bg-contain bg-no-repeat bg-top"
        style={{ 
          backgroundImage: `url(${theme.background.overlay.top})`,
          opacity: 0.8,
        }}
      />
      
      {/* Left overlay */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-32 bg-contain bg-no-repeat bg-left"
        style={{ 
          backgroundImage: `url(${theme.background.overlay.left})`,
          opacity: 0.8,
        }}
      />
      
      {/* Right overlay */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-32 bg-contain bg-no-repeat bg-right"
        style={{ 
          backgroundImage: `url(${theme.background.overlay.right})`,
          opacity: 0.8,
        }}
      />
      
      {/* Bottom overlay */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 bg-contain bg-no-repeat bg-bottom"
        style={{ 
          backgroundImage: `url(${theme.background.overlay.bottom})`,
          opacity: 0.8,
        }}
      />
    </div>
  );
}; 