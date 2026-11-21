import { LandingContent } from '../../content/landingContent';
import { useTheme } from '../../context/ThemeContext';

interface LandingSocialProofProps {
  content: LandingContent['socialProof'];
}

export const LandingSocialProof = ({ content }: LandingSocialProofProps) => {
  const { theme } = useTheme();

  return (
    <section className="rounded-3xl border p-5 sm:p-6" style={{
      borderColor: `${theme.targetColor}3c`,
      backgroundColor: 'rgba(5, 12, 18, 0.78)',
    }}>
      <h2 className="text-xl font-bold sm:text-2xl" style={{ color: theme.textColor }}>
        {content.heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.82 }}>
        {content.benchmarkFraming}
      </p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {content.protocolFacts.map(item => (
          <div
            key={item.label}
            className="rounded-xl border px-3 py-3"
            style={{
              borderColor: `${theme.targetColor}3f`,
              backgroundColor: 'rgba(2, 7, 11, 0.82)',
            }}
          >
            <dt className="text-[11px] uppercase tracking-[0.11em]" style={{ color: theme.textColor, opacity: 0.62 }}>
              {item.label}
            </dt>
            <dd className="mt-1 text-xs font-semibold sm:text-sm" style={{ color: theme.textColor }}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.78 }}>
        {content.evidenceStatement}
      </p>
    </section>
  );
};
