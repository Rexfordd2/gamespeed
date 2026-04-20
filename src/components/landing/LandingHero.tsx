import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { LandingContent, LandingPersona } from '../../content/landingContent';
import { JungleButton } from '../JungleButton';
import { getLandingExperimentAssignment } from '../../config/landingExperiment';
import { trackConversionEvent } from '../../lib/analytics';

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
  const scorePreview = [
    {
      label: 'Reaction Score',
      value: '224 ms',
      accent: 'from-cyan-300/80 to-emerald-300/80',
    },
    {
      label: 'Percentile',
      value: 'Top 18%',
      accent: 'from-violet-300/80 to-cyan-300/80',
    },
    {
      label: 'Current Streak',
      value: '9 days',
      accent: 'from-amber-200/80 to-orange-300/80',
    },
  ] as const;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border p-5 sm:p-7 lg:p-10 backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(4, 9, 14, 0.82)',
        borderColor: `${theme.targetColor}4a`,
        boxShadow: '0 24px 62px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 78% 12%, rgba(125, 211, 252, 0.16), transparent 42%), radial-gradient(circle at 12% 80%, rgba(16, 185, 129, 0.12), transparent 45%)',
        }}
      />

      <motion.div
        className="relative grid gap-7 lg:grid-cols-[1.1fr_0.9fr]"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
      >
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{
                color: theme.targetColor,
                borderColor: `${theme.targetColor}66`,
                backgroundColor: `${theme.targetColor}14`,
              }}
            >
              {content.eyebrow}
            </span>

            <div
              className="inline-flex w-full max-w-xs rounded-2xl border p-1"
              style={{
                borderColor: `${theme.targetColor}50`,
                backgroundColor: 'rgba(2, 8, 12, 0.85)',
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
                    className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all sm:text-sm"
                    style={{
                      color: isActive ? '#0a1b12' : theme.textColor,
                      backgroundColor: isActive ? theme.targetColor : 'transparent',
                      opacity: isActive ? 1 : 0.72,
                    }}
                  >
                    {content.personas[togglePersona].label}
                  </button>
                );
              })}
            </div>
          </div>

          <h1
            className="mt-5 text-[2.15rem] font-black leading-[0.95] tracking-tight sm:text-5xl"
            style={{ color: theme.textColor, textShadow: `0 10px 36px ${theme.targetColor}20` }}
          >
            {content.title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.9 }}>
            {content.subtitle}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.78 }}>
            {activePersona.supporting}
          </p>

          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {activePersona.bullets.map(item => (
              <li
                key={item}
                className="rounded-xl border px-3 py-2 text-xs font-medium sm:text-sm"
                style={{
                  color: theme.textColor,
                  borderColor: `${theme.targetColor}3f`,
                  backgroundColor: 'rgba(7, 16, 21, 0.8)',
                }}
              >
                {item}
              </li>
            ))}
          </ul>

          <p
            className="mt-4 rounded-xl border px-3 py-2 text-xs sm:text-sm"
            style={{
              color: theme.textColor,
              borderColor: `${theme.targetColor}33`,
              backgroundColor: 'rgba(8, 14, 20, 0.84)',
              opacity: 0.78,
            }}
          >
            {content.benchmarkMicrocopy}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <JungleButton
              onClick={() => {
                trackConversionEvent('hero_cta_click', {
                  cta: 'hero_primary',
                  source: 'landing_hero',
                  experimentVariant: landingExperiment.id,
                });
                onPrimaryCta();
              }}
              className="w-full min-h-12 sm:w-auto"
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
              className="ui-secondary-button min-h-12 rounded-xl px-5 text-sm sm:text-base"
            >
              {content.secondaryCta}
            </button>
          </div>

          <p className="mt-3 text-xs sm:text-sm" style={{ color: theme.textColor, opacity: 0.74 }}>
            {content.trustMicrocopy}
          </p>
        </div>

        <motion.aside
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            borderColor: `${theme.targetColor}44`,
            background: 'linear-gradient(180deg, rgba(8, 15, 22, 0.95), rgba(5, 11, 16, 0.9))',
          }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.textColor, opacity: 0.6 }}>
              Live Score Preview
            </p>
            <span
              className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{
                color: theme.targetColor,
                borderColor: `${theme.targetColor}55`,
                backgroundColor: `${theme.targetColor}15`,
              }}
            >
              Session Ready
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {scorePreview.map((metric, index) => (
              <motion.div
                key={metric.label}
                className="rounded-xl border p-3"
                style={{
                  borderColor: `${theme.targetColor}30`,
                  backgroundColor: 'rgba(8, 14, 20, 0.88)',
                }}
                animate={{ opacity: [0.88, 1, 0.88] }}
                transition={{ duration: 2.2, delay: index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: theme.textColor, opacity: 0.66 }}>
                  {metric.label}
                </p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <p className="text-xl font-black sm:text-2xl" style={{ color: theme.textColor }}>
                    {metric.value}
                  </p>
                  <motion.div
                    className={`h-2 w-20 rounded-full bg-gradient-to-r ${metric.accent}`}
                    animate={{ scaleX: [0.72, 1, 0.72] }}
                    transition={{ duration: 2.4, delay: index * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ transformOrigin: 'left center' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.aside>
      </motion.div>
    </section>
  );
};
