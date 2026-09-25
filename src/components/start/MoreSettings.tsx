import { useEffect, useId, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CueIntensity } from '../../types/game';
import { SPORT_ORDER, SportType, getSportConfig, getSportPack } from '../../config/sports';
import { getSportPackAssets } from '../../config/sportPacks';
import { gameModes } from '../../utils/gameModes';
import { NightGuardrailSettings } from '../../utils/nightGuardrail';

interface MoreSettingsProps {
  defaultOpen: boolean;
  selectedSport: SportType;
  onSportChange: (sport: SportType) => void;
  nightGuardrailSettings: NightGuardrailSettings;
  onNightGuardrailSettingsChange: (settings: NightGuardrailSettings) => void;
  cueIntensity: CueIntensity;
  onCueIntensityChange: (intensity: CueIntensity) => void;
  hapticsEnabled: boolean;
  onHapticsEnabledChange: (enabled: boolean) => void;
  hapticsAvailable: boolean;
}

const SportOptionIcon = ({ sport }: { sport: SportType }) => {
  const assets = getSportPackAssets(getSportPack(sport));
  const [iconSrc, setIconSrc] = useState(assets.sportIcon);

  useEffect(() => {
    setIconSrc(assets.sportIcon);
  }, [assets.sportIcon]);

  if (!iconSrc) {
    return (
      <span aria-hidden="true" className="text-base leading-none">
        ◉
      </span>
    );
  }

  return (
    <img
      src={iconSrc}
      alt=""
      aria-hidden="true"
      className="h-4 w-4 object-contain"
      onError={() => {
        if (iconSrc !== assets.sportIconFallback) {
          setIconSrc(assets.sportIconFallback);
          return;
        }
        setIconSrc('');
      }}
    />
  );
};

export const MoreSettings = ({
  defaultOpen,
  selectedSport,
  onSportChange,
  nightGuardrailSettings,
  onNightGuardrailSettingsChange,
  cueIntensity,
  onCueIntensityChange,
  hapticsEnabled,
  onHapticsEnabledChange,
  hapticsAvailable,
}: MoreSettingsProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();
  const sportConfig = getSportConfig(selectedSport);
  const cueVocabulary = sportConfig.cueVocabulary.join(' | ');

  return (
    <section
      className="rounded-3xl p-4 sm:p-6 backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(5, 10, 16, 0.8)',
        border: `1px solid ${theme.textColor}33`,
      }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(open => !open)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block text-lg font-bold sm:text-xl" style={{ color: theme.textColor }}>
            More settings
          </span>
          <span className="mt-0.5 block text-xs sm:text-sm" style={{ color: theme.textColor, opacity: 0.7 }}>
            Sport pack ({sportConfig.displayName}), night-before guardrail, cue intensity, haptics
          </span>
        </span>
        <span aria-hidden="true" className="text-xl" style={{ color: theme.targetColor }}>
          {isOpen ? '−' : '+'}
        </span>
      </button>

      {isOpen && (
        <div id={panelId} className="mt-5 flex flex-col gap-6">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: sportConfig.accents.secondary }}
            >
              Sport pack
            </p>
            <h2 className="mt-2 text-lg font-extrabold sm:text-xl" style={{ color: theme.textColor }}>
              Pick your pre-performance context
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.82 }}>
              {sportConfig.readinessCopy.heroTitle}
            </p>
            <p className="mt-1.5 text-xs sm:text-sm" style={{ color: theme.textColor, opacity: 0.72 }}>
              {sportConfig.readinessCopy.heroBody}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SPORT_ORDER.map(sport => {
                const option = getSportConfig(sport);
                const isSelected = selectedSport === sport;
                return (
                  <button
                    key={sport}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSportChange(sport)}
                    className="rounded-2xl px-3 py-2.5 text-left transition-transform hover:-translate-y-0.5"
                    style={{
                      backgroundColor: isSelected ? `${option.accents.primary}24` : 'rgba(5, 12, 16, 0.66)',
                      border: `1px solid ${isSelected ? `${option.accents.primary}cc` : `${theme.textColor}2b`}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <SportOptionIcon sport={sport} />
                      <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
                        {option.displayName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              className="mt-4 rounded-2xl p-3 text-xs sm:text-sm"
              style={{
                backgroundColor: 'rgba(3, 10, 14, 0.72)',
                border: `1px solid ${sportConfig.accents.secondary}5f`,
              }}
            >
              <p className="font-semibold" style={{ color: theme.textColor }}>
                Cue vocabulary: <span style={{ color: sportConfig.accents.secondary }}>{cueVocabulary}</span>
              </p>
              <p className="mt-1.5" style={{ color: theme.textColor, opacity: 0.78 }}>
                Recommended first block:{' '}
                {sportConfig.defaultRecommendedModes.map(mode => gameModes[mode].name).join(' -> ')}
              </p>
            </div>
          </div>

          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: theme.textColor, opacity: 0.75 }}
            >
              Night-Before Guardrail
            </p>
            <h2 className="mt-2 text-lg font-bold sm:text-xl" style={{ color: theme.textColor }}>
              Protect your final 2 hours before bed
            </h2>
            <p className="mt-2 text-sm" style={{ color: theme.textColor, opacity: 0.8 }}>
              Set your bedtime and reminder preference. On competition nights, the app offers a lower-stimulation session.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="rounded-2xl p-3" style={{ backgroundColor: 'rgba(2, 8, 12, 0.72)', border: `1px solid ${theme.textColor}2d` }}>
                <span className="text-xs uppercase tracking-[0.12em]" style={{ color: theme.textColor, opacity: 0.7 }}>
                  Target bedtime
                </span>
                <input
                  type="time"
                  value={nightGuardrailSettings.targetBedtime}
                  onChange={event =>
                    onNightGuardrailSettingsChange({
                      ...nightGuardrailSettings,
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

              <label className="rounded-2xl p-3" style={{ backgroundColor: 'rgba(2, 8, 12, 0.72)', border: `1px solid ${theme.textColor}2d` }}>
                <span className="text-xs uppercase tracking-[0.12em]" style={{ color: theme.textColor, opacity: 0.7 }}>
                  Reminder preference
                </span>
                <select
                  value={nightGuardrailSettings.reminderPreference}
                  onChange={event =>
                    onNightGuardrailSettingsChange({
                      ...nightGuardrailSettings,
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
                aria-pressed={nightGuardrailSettings.competitionTomorrow}
                onClick={() =>
                  onNightGuardrailSettingsChange({
                    ...nightGuardrailSettings,
                    competitionTomorrow: !nightGuardrailSettings.competitionTomorrow,
                  })
                }
                className="rounded-xl px-4 py-3 text-sm text-left"
                style={{
                  color: theme.textColor,
                  backgroundColor: nightGuardrailSettings.competitionTomorrow ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 8, 12, 0.72)',
                  border: `1px solid ${nightGuardrailSettings.competitionTomorrow ? 'rgba(56, 189, 248, 0.8)' : `${theme.textColor}30`}`,
                }}
              >
                Competition tomorrow: {nightGuardrailSettings.competitionTomorrow ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                aria-pressed={nightGuardrailSettings.includeBreathingRoutine}
                onClick={() =>
                  onNightGuardrailSettingsChange({
                    ...nightGuardrailSettings,
                    includeBreathingRoutine: !nightGuardrailSettings.includeBreathingRoutine,
                  })
                }
                className="rounded-xl px-4 py-3 text-sm text-left"
                style={{
                  color: theme.textColor,
                  backgroundColor: nightGuardrailSettings.includeBreathingRoutine ? 'rgba(52, 211, 153, 0.16)' : 'rgba(2, 8, 12, 0.72)',
                  border: `1px solid ${nightGuardrailSettings.includeBreathingRoutine ? 'rgba(52, 211, 153, 0.72)' : `${theme.textColor}30`}`,
                }}
              >
                Short breathing + gaze routine: {nightGuardrailSettings.includeBreathingRoutine ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: theme.textColor, opacity: 0.75 }}>
              Gameplay cue intensity
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(['minimal', 'standard', 'guided'] as CueIntensity[]).map(level => {
                const isActive = cueIntensity === level;
                return (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onCueIntensityChange(level)}
                    className="rounded-xl px-3 py-2 text-sm text-left capitalize"
                    style={{
                      color: theme.textColor,
                      backgroundColor: isActive ? `${theme.targetColor}22` : 'rgba(2, 8, 12, 0.76)',
                      border: `1px solid ${isActive ? `${theme.targetColor}bb` : `${theme.textColor}2d`}`,
                    }}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <button
                type="button"
                aria-pressed={hapticsEnabled}
                onClick={() => onHapticsEnabledChange(!hapticsEnabled)}
                disabled={!hapticsAvailable}
                className="w-full rounded-xl px-3 py-2 text-sm text-left"
                style={{
                  color: theme.textColor,
                  opacity: hapticsAvailable ? 1 : 0.58,
                  backgroundColor: hapticsEnabled ? `${theme.targetColor}22` : 'rgba(2, 8, 12, 0.76)',
                  border: `1px solid ${hapticsEnabled ? `${theme.targetColor}bb` : `${theme.textColor}2d`}`,
                }}
              >
                Mobile haptics: {hapticsEnabled ? 'On' : 'Off'}
              </button>
              <p className="mt-1 text-[11px]" style={{ color: theme.textColor, opacity: 0.65 }}>
                {hapticsAvailable
                  ? 'Adds vibration cues for hit, miss, and rhythm pacing on supported devices.'
                  : 'Haptics unavailable on this device/browser.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
