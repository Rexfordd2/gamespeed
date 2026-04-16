import { useAudio } from './AudioManager';
import { useTheme } from '../context/ThemeContext';

export const AudioToggle = () => {
  const { theme } = useTheme();
  const { isMuted, isReady, toggleMute } = useAudio();

  const label = isMuted ? 'Sound Off' : 'Sound On';
  const hint = isReady ? label : 'Tap to enable sound';
  const compactLabel = isMuted ? 'Off' : 'On';

  return (
    <button
      type="button"
      onClick={() => {
        void toggleMute();
      }}
      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
      aria-pressed={!isMuted}
      className="fixed right-3 z-[120] rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
      style={{
        bottom: 'max(12px, calc(env(safe-area-inset-bottom, 0px) + 10px))',
        color: isMuted ? theme.textColor : theme.targetColor,
        border: `1px solid ${isMuted ? `${theme.textColor}5f` : theme.targetColor}`,
        backgroundColor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 10px 22px rgba(0,0,0,0.25)',
      }}
      title={hint}
    >
      <span className="sm:hidden">{isMuted ? '🔇' : '🔊'} {compactLabel}</span>
      <span className="hidden sm:inline">{isMuted ? '🔇' : '🔊'} {hint}</span>
    </button>
  );
};
