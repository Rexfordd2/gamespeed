import { JungleBackground } from './JungleBackground';
import { useTheme } from '../context/ThemeContext';
import { JungleButton } from './JungleButton';
import { landingContent } from '../content/landingContent';
import { LandingSocialProof } from './landing/LandingSocialProof';
import { CredibilityLayer } from './CredibilityLayer';
import { getAnimalInstinct } from '../config/animalInstincts';
import { getModeIconVisual } from '../config/modeManifest';

interface BenchmarkPageProps {
  onBackToHome: () => void;
  onStartBenchmark: () => void;
}

export const BenchmarkPage = ({ onBackToHome, onStartBenchmark }: BenchmarkPageProps) => {
  const { theme } = useTheme();
  const panther = getAnimalInstinct('reactionBenchmark');
  const icon = getModeIconVisual('reactionBenchmark');

  return (
    <div
      className="relative w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <JungleBackground variant="clearing" animalEyes mist particles />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(150, 255, 102, 0.1), transparent 42%), radial-gradient(circle at 80% 84%, rgba(76, 201, 240, 0.1), transparent 48%), linear-gradient(180deg, rgba(2,8,6,0.72), rgba(2,8,6,0.92))',
        }}
      />

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 py-3 sm:gap-6 sm:py-5">
        <section
          className="rounded-3xl border p-4 sm:p-6"
          style={{
            borderColor: `${theme.targetColor}4a`,
            backgroundColor: 'rgba(5, 12, 18, 0.82)',
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              {icon.path && (
                <img src={icon.path} alt="" aria-hidden="true" className="mt-1 h-14 w-14 object-contain opacity-90" />
              )}
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: theme.targetColor }}
                >
                  60 Second Neural Readiness Benchmark
                </p>
                <h1 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-[0.05em] sm:text-4xl" style={{ color: theme.textColor }}>
                  {panther.experienceName.toUpperCase()} TEST
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.84 }}>
                  {panther.tagline} Measures reaction time, response consistency, accuracy, and performance decay.
                </p>
                <p className="mt-2 text-xs opacity-65" style={{ color: theme.textColor }}>
                  This is a training metric, not a medical or neurological diagnosis.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <JungleButton onClick={onStartBenchmark} className="min-h-12 w-full font-display uppercase tracking-[0.1em] sm:w-auto">
                BEGIN BENCHMARK
              </JungleButton>
              <button
                type="button"
                onClick={onBackToHome}
                className="ui-secondary-button min-h-11 w-full px-4 text-sm sm:w-auto"
              >
                Back to Home
              </button>
            </div>
          </div>
        </section>

        <LandingSocialProof content={landingContent.socialProof} />
        <CredibilityLayer />

        <section
          className="rounded-3xl border p-4 sm:p-6"
          style={{
            borderColor: `${theme.targetColor}36`,
            backgroundColor: 'rgba(6, 12, 18, 0.72)',
          }}
        >
          <h2 className="text-lg font-bold sm:text-2xl" style={{ color: theme.textColor }}>
            Methodology and caveats
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <article
              className="rounded-2xl border p-4"
              style={{
                borderColor: `${theme.targetColor}2f`,
                backgroundColor: 'rgba(4, 10, 14, 0.75)',
              }}
            >
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: theme.targetColor }}>
                What the benchmark is for
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.82 }}>
                Use Panther Readiness as a personal readiness baseline before training or competition.
                The signal is strongest when you compare trends on the same hardware setup.
              </p>
            </article>
            <article
              className="rounded-2xl border p-4"
              style={{
                borderColor: `${theme.targetColor}2f`,
                backgroundColor: 'rgba(4, 10, 14, 0.75)',
              }}
            >
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: theme.targetColor }}>
                Caveats
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.82 }}>
                Device refresh rate, browser load, and input latency can shift absolute values. Do not treat this as
                concussion, disease, fatigue, or medical readiness screening.
              </p>
            </article>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="ui-secondary-button inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm"
              href={landingContent.footer.feedbackUrl}
              target="_blank"
              rel="noreferrer"
            >
              {landingContent.footer.feedbackLabel}
            </a>
            <button
              type="button"
              onClick={onBackToHome}
              className="ui-secondary-button min-h-11 rounded-xl px-4 text-sm"
            >
              Return to homepage
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
