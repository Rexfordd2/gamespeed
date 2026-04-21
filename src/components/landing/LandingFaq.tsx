import { LandingContent } from '../../content/landingContent';
import { useTheme } from '../../context/ThemeContext';

interface LandingFaqProps {
  content: LandingContent['faq'];
}

export const LandingFaq = ({ content }: LandingFaqProps) => {
  const { theme } = useTheme();

  return (
    <section>
      <h2 className="text-xl font-bold sm:text-2xl" style={{ color: theme.textColor }}>
        {content.heading}
      </h2>
      <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
        {content.items.map(item => (
          <details
            key={item.question}
            className="rounded-2xl border px-3.5 py-3 sm:px-4"
            style={{
              borderColor: `${theme.targetColor}35`,
              backgroundColor: 'rgba(6, 12, 16, 0.72)',
            }}
          >
            <summary className="cursor-pointer text-sm font-semibold sm:text-base" style={{ color: theme.textColor }}>
              {item.question}
            </summary>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.78 }}>
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
};
