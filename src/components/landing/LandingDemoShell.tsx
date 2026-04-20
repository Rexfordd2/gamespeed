import { useTheme } from '../../context/ThemeContext';
import { LandingContent } from '../../content/landingContent';
import { JungleButton } from '../JungleButton';

interface LandingDemoShellProps {
  content: LandingContent['demo'];
  onRunBenchmark: () => void;
}

export const LandingDemoShell = ({ content, onRunBenchmark }: LandingDemoShellProps) => {
  const { theme } = useTheme();

  return (
    <section className="grid gap-4 rounded-3xl border p-5 sm:p-6 lg:grid-cols-[1.2fr_1fr]" style={{
      borderColor: `${theme.targetColor}44`,
      backgroundColor: 'rgba(6, 11, 17, 0.78)',
    }}>
      <div>
        <h2 className="text-xl font-bold sm:text-2xl" style={{ color: theme.textColor }}>
          {content.heading}
        </h2>
        <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.84 }}>
          {content.body}
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {content.metrics.map(metric => (
            <div
              key={metric.label}
              className="rounded-xl border px-3 py-2.5"
              style={{
                borderColor: `${theme.targetColor}3d`,
                backgroundColor: 'rgba(2, 8, 12, 0.75)',
              }}
            >
              <p className="text-[11px] uppercase tracking-[0.15em]" style={{ color: theme.textColor, opacity: 0.62 }}>
                {metric.label}
              </p>
              <p className="mt-1 text-sm font-semibold sm:text-base" style={{ color: theme.textColor }}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl border p-4"
        style={{
          borderColor: `${theme.targetColor}55`,
          background: 'linear-gradient(160deg, rgba(3,13,16,0.95), rgba(6,20,24,0.82))',
          boxShadow: `inset 0 0 0 1px ${theme.targetColor}22`,
        }}
      >
        <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: theme.targetColor }}>
          {content.shellLabel}
        </p>
        <ul className="mt-3 space-y-2">
          {content.steps.map(step => (
            <li key={step} className="text-xs leading-relaxed sm:text-sm" style={{ color: theme.textColor, opacity: 0.86 }}>
              {step}
            </li>
          ))}
        </ul>
        <JungleButton onClick={onRunBenchmark} className="mt-4 w-full min-h-12 text-sm">
          {content.runButton}
        </JungleButton>
      </div>
    </section>
  );
};
