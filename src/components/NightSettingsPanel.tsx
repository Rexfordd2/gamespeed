import { useTheme } from '../context/ThemeContext';
import { NightGuardrailSettings } from '../utils/nightGuardrail';
import { JungleButton } from './JungleButton';

interface NightSettingsPanelProps {
  settings: NightGuardrailSettings;
  onSettingsChange: (settings: NightGuardrailSettings) => void;
  isNightGuardrailActive: boolean;
  onStartLowStimulusSession?: () => void;
  compact?: boolean;
}

export const NightSettingsPanel = ({
  settings,
  onSettingsChange,
  isNightGuardrailActive,
  onStartLowStimulusSession,
  compact = false,
}: NightSettingsPanelProps) => {
  const { theme } = useTheme();

  return (
    <div className={compact ? '' : 'mt-4'}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label
          className="rounded-2xl p-3"
          style={{ backgroundColor: 'rgba(2, 8, 12, 0.72)', border: `1px solid ${theme.textColor}2d` }}
        >
          <span className="text-xs uppercase tracking-[0.12em]" style={{ color: theme.textColor, opacity: 0.7 }}>
            Target bedtime
          </span>
          <input
            type="time"
            value={settings.targetBedtime}
            onChange={event =>
              onSettingsChange({
                ...settings,
                targetBedtime: event.target.value,
              })
            }
            className="mt-2 w-full rounded-lg px-3 py-2 text-sm"
            style={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              color: theme.textColor,
              border: `1px solid ${theme.textColor}44`,
            }}
          />
        </label>

        <label
          className="rounded-2xl p-3"
          style={{ backgroundColor: 'rgba(2, 8, 12, 0.72)', border: `1px solid ${theme.textColor}2d` }}
        >
          <span className="text-xs uppercase tracking-[0.12em]" style={{ color: theme.textColor, opacity: 0.7 }}>
            Reminder preference
          </span>
          <select
            value={settings.reminderPreference}
            onChange={event =>
              onSettingsChange({
                ...settings,
                reminderPreference: event.target.value === 'off' ? 'off' : 'inApp',
              })
            }
            className="mt-2 w-full rounded-lg px-3 py-2 text-sm"
            style={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              color: theme.textColor,
              border: `1px solid ${theme.textColor}44`,
            }}
          >
            <option value="inApp">In-app reminder</option>
            <option value="off">Off</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          aria-pressed={settings.competitionTomorrow}
          onClick={() =>
            onSettingsChange({
              ...settings,
              competitionTomorrow: !settings.competitionTomorrow,
            })
          }
          className="rounded-xl px-4 py-3 text-sm text-left"
          style={{
            color: theme.textColor,
            backgroundColor: settings.competitionTomorrow ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 8, 12, 0.72)',
            border: `1px solid ${settings.competitionTomorrow ? 'rgba(56, 189, 248, 0.8)' : `${theme.textColor}30`}`,
          }}
        >
          Competition tomorrow: {settings.competitionTomorrow ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          aria-pressed={settings.includeBreathingRoutine}
          onClick={() =>
            onSettingsChange({
              ...settings,
              includeBreathingRoutine: !settings.includeBreathingRoutine,
            })
          }
          className="rounded-xl px-4 py-3 text-sm text-left"
          style={{
            color: theme.textColor,
            backgroundColor: settings.includeBreathingRoutine ? 'rgba(52, 211, 153, 0.16)' : 'rgba(2, 8, 12, 0.72)',
            border: `1px solid ${settings.includeBreathingRoutine ? 'rgba(52, 211, 153, 0.72)' : `${theme.textColor}30`}`,
          }}
        >
          Short breathing + gaze routine: {settings.includeBreathingRoutine ? 'On' : 'Off'}
        </button>
      </div>

      {isNightGuardrailActive && onStartLowStimulusSession && (
        <div
          className="mt-4 rounded-2xl p-4"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.9)',
            border: '1px solid rgba(148, 163, 184, 0.45)',
          }}
        >
          <p className="text-xs uppercase tracking-[0.15em]" style={{ color: theme.textColor, opacity: 0.68 }}>
            Low-stimulation option
          </p>
          <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.86 }}>
            Tonight is set as a competition eve. Use a calm readiness check with dimmed visuals and reduced motion.
          </p>
          <JungleButton onClick={onStartLowStimulusSession} className="mt-4 w-full sm:w-auto px-6 py-3 text-base">
            Start low-stimulation session
          </JungleButton>
        </div>
      )}
    </div>
  );
};
