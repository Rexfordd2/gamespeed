import { JungleBackground } from './JungleBackground';
import { useTheme } from '../context/ThemeContext';
import { JungleButton } from './JungleButton';
import { landingContent } from '../content/landingContent';
import { LandingSocialProof } from './landing/LandingSocialProof';
import { CredibilityLayer } from './CredibilityLayer';

interface BenchmarkPageProps {
  onBackToHome: () => void;
  onStartBenchmark: () => void;
}

export const BenchmarkPage = ({ onBackToHome, onStartBenchmark }: BenchmarkPageProps) => {
  const { theme } = useTheme();

  return (
    <div
      className="relative w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <JungleBackground />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(125, 211, 252, 0.12), transparent 42%), radial-gradient(circle at 80% 84%, rgba(16, 185, 129, 0.14), transparent 48%), linear-gradient(180deg, rgba(3,8,12,0.72), rgba(2,8,10,0.92))',
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: theme.targetColor }}
              >
                Benchmark Methodology
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: theme.textColor }}>
                How GameSpeed Scoring Works
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.84 }}>
                Clear scoring logic, benchmark interpretation, trust notes, and caveats in one place.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <JungleButton onClick={onStartBenchmark} className="min-h-12 w-full sm:w-auto">
                Run the 60-Second Test
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
                Use the benchmark as a personal readiness baseline before training, scrims, or competition.
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
                Device refresh rate, browser load, and input latency can shift absolute values. Interpret scores as
                directional with better confidence when measured consistently over time.
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
