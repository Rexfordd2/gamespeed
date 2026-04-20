import { useTheme } from '../context/ThemeContext';
import {
  credibilityMetricCards,
  credibilityQuoteCards,
  scoreBands,
  workflowSteps,
} from '../content/credibilityContent';

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold sm:text-2xl" style={{ color: theme.textColor }}>
          Credibility and Benchmark Clarity
        </h2>
        <span
          className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{
            color: theme.targetColor,
            borderColor: `${theme.targetColor}5a`,
            backgroundColor: `${theme.targetColor}14`,
          }}
        >
          Performance-first framework
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.82 }}>
        Built for repeatable readiness, not hype metrics. Use these references as directional guidance until live cohort
        reporting is published.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {credibilityMetricCards.map(item => (
          <article
            key={item.metric}
            className="rounded-2xl border p-4"
            style={{
              borderColor: `${theme.targetColor}32`,
              backgroundColor: 'rgba(4, 10, 14, 0.84)',
            }}
          >
            <p className="text-sm font-semibold leading-relaxed" style={{ color: theme.textColor }}>
              {item.metric}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.1em]" style={{ color: theme.textColor, opacity: 0.64 }}>
              {item.evidence}
            </p>
            <p className="mt-2 text-xs leading-relaxed sm:text-sm" style={{ color: theme.textColor, opacity: 0.78 }}>
              {item.context}
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
            Score interpretation
          </h3>
          <div className="mt-2 space-y-2">
            {scoreBands.map(band => (
              <div
                key={band.band}
                className="rounded-xl border px-3 py-2.5"
                style={{
                  borderColor: `${theme.targetColor}2d`,
                  backgroundColor: 'rgba(3, 10, 14, 0.72)',
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: theme.textColor, opacity: 0.7 }}>
                  {band.band} • {band.range}
                </p>
                <p className="mt-1 text-xs leading-relaxed sm:text-sm" style={{ color: theme.textColor, opacity: 0.84 }}>
                  {band.interpretation}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article
          className="rounded-2xl border p-4"
          style={{
            borderColor: `${theme.targetColor}35`,
            backgroundColor: 'rgba(7, 15, 21, 0.76)',
          }}
        >
          <h3 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
            Latency disclaimer
          </h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.82 }}>
            Input and display latency vary by device, refresh rate, browser state, and background load. Compare scores on
            the same setup for the most reliable trend.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.1em]" style={{ color: theme.textColor, opacity: 0.64 }}>
            [Placeholder note: hardware-normalized benchmarking planned in future release]
          </p>

          <h3 className="mt-4 text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
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

      <div className="mt-6">
        <h3 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
          Coach, player, gamer perspectives
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {credibilityQuoteCards.map(card => (
            <blockquote
              key={card.role}
              className="rounded-2xl border p-4"
              style={{
                borderColor: `${theme.targetColor}30`,
                backgroundColor: 'rgba(5, 12, 17, 0.82)',
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.targetColor }}>
                {card.role}
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.9 }}>
                "{card.quote}"
              </p>
              <footer className="mt-3 text-xs leading-relaxed sm:text-sm" style={{ color: theme.textColor, opacity: 0.72 }}>
                {card.name}
              </footer>
              <p className="mt-2 text-[11px] uppercase tracking-[0.1em]" style={{ color: theme.textColor, opacity: 0.58 }}>
                {card.note}
              </p>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
};
