import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { LandingContent, LandingPersona } from '../../content/landingContent';
import { JungleButton } from '../JungleButton';
import { getLandingExperimentAssignment } from '../../config/landingExperiment';
import { trackConversionEvent } from '../../lib/analytics';
import { framerTransition } from '../../config/motion';
import { designTokens } from '../../config/designTokens';

interface LandingHeroProps {
  content: LandingContent['hero'];
  persona: LandingPersona;
  onPersonaChange: (persona: LandingPersona) => void;
  onPrimaryCta: () => void;
  onSecondaryCta: () => void;
}

export const LandingHero = ({
  content,
  persona,
  onPersonaChange,
  onPrimaryCta,
  onSecondaryCta,
}: LandingHeroProps) => {
  const { theme } = useTheme();
  const landingExperiment = useMemo(() => getLandingExperimentAssignment(), []);
  const personaOrder = landingExperiment.personaOrder as LandingPersona[];
  const activePersona = content.personas[persona];

  return (
    <section
      className="relative overflow-hidden border px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16"
      style={{
        minHeight: 'min(88vh, 760px)',
        borderColor: `${theme.targetColor}33`,
        background:
          'linear-gradient(180deg, rgba(2,8,6,0.28) 0%, rgba(2,8,6,0.55) 48%, rgba(2,8,6,0.82) 100%)',
        boxShadow: '0 24px 62px rgba(0, 0, 0, 0.45)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 70% 20%, rgba(150,255,102,0.1), transparent 42%), radial-gradient(ellipse at 20% 80%, rgba(76,201,240,0.08), transparent 45%)',
        }}
      />

      <motion.div
        className="relative mx-auto flex max-w-4xl flex-col items-start"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={framerTransition.reveal}
      >
        <p
          className="font-display text-5xl font-extrabold uppercase leading-none tracking-[0.08em] sm:text-7xl lg:text-8xl"
          style={{ color: theme.textColor, textShadow: `0 12px 40px ${theme.targetColor}33` }}
        >
          {content.brand ?? 'GAME SPEED'}
        </p>

        <h1
          className="font-display mt-3 text-3xl font-bold uppercase leading-[0.95] tracking-[0.04em] sm:mt-4 sm:text-5xl"
          style={{ color: theme.targetColor }}
        >
          {content.title}
        </h1>

        <p
          className="mt-4 max-w-xl text-base font-medium tracking-wide sm:mt-5 sm:text-lg"
          style={{ color: theme.textColor, opacity: 0.88 }}
        >
          {content.subtitle}
        </p>

        <p className="mt-2 text-xs uppercase tracking-[0.18em]" style={{ color: designTokens.colors.textMuted }}>
          {content.attribution}
        </p>

        <div
          className="mt-5 inline-flex w-full max-w-md rounded-xl border p-1"
          style={{
            borderColor: `${theme.targetColor}40`,
            backgroundColor: 'rgba(2, 8, 6, 0.72)',
          }}
        >
          {personaOrder.map(togglePersona => {
            const isActive = persona === togglePersona;
            return (
              <button
                key={togglePersona}
                type="button"
                onClick={() => {
                  trackConversionEvent('persona_selected', {
                    persona: togglePersona,
                    source: 'landing_hero_toggle',
                    experimentVariant: landingExperiment.id,
                  });
                  onPersonaChange(togglePersona);
                }}
                className="flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] transition-all sm:text-sm"
                style={{
                  color: isActive ? '#06120F' : theme.textColor,
                  backgroundColor: isActive ? theme.targetColor : 'transparent',
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {content.personas[togglePersona].label}
              </button>
            );
          })}
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.78 }}>
          {activePersona.supporting}
        </p>

        <div className="mt-7 flex w-full flex-col gap-2.5 sm:mt-8 sm:flex-row sm:items-center">
          <JungleButton
            onClick={() => {
              trackConversionEvent('hero_cta_click', {
                cta: 'hero_primary',
                source: 'landing_hero',
                experimentVariant: landingExperiment.id,
              });
              onPrimaryCta();
            }}
            className="w-full min-h-[52px] font-display text-lg uppercase tracking-[0.12em] sm:w-auto sm:min-w-[220px]"
          >
            {content.primaryCta}
          </JungleButton>
          <button
            type="button"
            onClick={() => {
              trackConversionEvent('hero_cta_click', {
                cta: 'hero_secondary',
                source: 'landing_hero',
                experimentVariant: landingExperiment.id,
              });
              onSecondaryCta();
            }}
            className="ui-secondary-button min-h-[52px] rounded-xl px-5 font-display text-base uppercase tracking-[0.1em] sm:text-lg"
          >
            {content.secondaryCta}
          </button>
        </div>

        <p className="mt-3 text-xs sm:text-sm" style={{ color: theme.textColor, opacity: 0.68 }}>
          {content.trustMicrocopy}
        </p>
      </motion.div>
    </section>
  );
};
