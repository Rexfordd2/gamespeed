import { useTheme } from '../context/ThemeContext';
import { recordedSignals, workflowSteps } from '../content/credibilityContent';

export const CredibilityLayer = () => {
  const { theme } = useTheme();

  return (
    <section
      className="rounded-3xl border p-4 sm:p-6 md:p-7"
      style={{
        borderColor: `${theme.targetColor}38`,
        backgroundColor: 'rgba(5, 12, 18, 0.78)',
      }}
    >
      <h2 className="text-xl font-bold sm:text-2xl" style={{ color: theme.textColor }}>
        What the Benchmark Records
      </h2>

      <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.82 }}>
        Each benchmark round records these signals from your own taps.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {recordedSignals.map(item => (
          <article
            key={item.signal}
            className="rounded-2xl border p-4"
            style={{
              borderColor: `${theme.targetColor}32`,
              backgroundColor: 'rgba(4, 10, 14, 0.84)',
            }}
          >
            <h3 className="text-sm font-semibold leading-relaxed" style={{ color: theme.textColor }}>
              {item.signal}
            </h3>
            <p className="mt-2 text-xs leading-relaxed sm:text-sm" style={{ color: theme.textColor, opacity: 0.78 }}>
              {item.description}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <article
          className="rounded-2xl border p-4"
          style={{
            borderColor: `${theme.targetColor}35`,
            backgroundColor: 'rgba(7, 15, 21, 0.76)',
          }}
        >
          <h3 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
            Benchmark explanation
          </h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.82 }}>
            The benchmark holds timing and cue frequency constant so your score reflects response quality, not drill
            randomness. Run it first, then compare against your own rolling baseline.
          </p>

          <h3 className="mt-4 text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
            Latency disclaimer
          </h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.82 }}>
            Input and display latency vary by device, refresh rate, browser state, and background load. Compare scores on
            the same setup for the most reliable trend.
          </p>
        </article>

        <article
          className="rounded-2xl border p-4"
          style={{
            borderColor: `${theme.targetColor}35`,
            backgroundColor: 'rgba(7, 15, 21, 0.76)',
          }}
        >
          <h3 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
            How GameSpeed Works
          </h3>
          <ul className="mt-2 space-y-2">
            {workflowSteps.map(step => (
              <li key={step.title} className="rounded-xl border px-3 py-2.5" style={{
                borderColor: `${theme.targetColor}2d`,
                backgroundColor: 'rgba(3, 10, 14, 0.72)',
              }}>
                <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: theme.textColor, opacity: 0.72 }}>
                  {step.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed sm:text-sm" style={{ color: theme.textColor, opacity: 0.84 }}>
                  {step.body}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
};
