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
      <p className="mt-2 text-xs uppercase tracking-[0.1em]" style={{ color: theme.textColor, opacity: 0.62 }}>
        Placeholder proof/testimonial data is clearly labeled in `src/content/credibilityContent.ts`.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {content.proofStats.map(item => (
          <div
            key={item.label}
            className="rounded-xl border px-3 py-3"
            style={{
              borderColor: `${theme.targetColor}3f`,
              backgroundColor: 'rgba(2, 7, 11, 0.82)',
            }}
          >
            <p className="text-xs font-semibold sm:text-sm" style={{ color: theme.textColor }}>
              {item.value}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.11em]" style={{ color: theme.textColor, opacity: 0.62 }}>
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {content.testimonials.map(testimonial => (
          <blockquote
            key={`${testimonial.author}-${testimonial.role}`}
            className="rounded-2xl border p-4"
            style={{
              borderColor: `${theme.targetColor}2d`,
              backgroundColor: 'rgba(6, 16, 21, 0.72)',
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.9 }}>
              "{testimonial.quote}"
            </p>
            <footer className="mt-3 text-xs sm:text-sm" style={{ color: theme.textColor, opacity: 0.7 }}>
              {testimonial.author} - {testimonial.role}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
};
