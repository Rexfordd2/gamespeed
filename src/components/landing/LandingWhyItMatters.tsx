import { LandingContent, LandingPersona } from '../../content/landingContent';
import { useTheme } from '../../context/ThemeContext';

interface LandingWhyItMattersProps {
  content: LandingContent['whyItMatters'];
  persona: LandingPersona;
}

export const LandingWhyItMatters = ({ content, persona }: LandingWhyItMattersProps) => {
  const { theme } = useTheme();
  const cards = persona === 'athlete' ? content.athlete : content.gamer;

  return (
    <section>
      <h2 className="text-xl font-bold sm:text-2xl" style={{ color: theme.textColor }}>
        {content.heading} {content.personaSuffix[persona]}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {cards.map(card => (
          <article
            key={card.title}
            className="rounded-2xl border p-4"
            style={{
              borderColor: `${theme.targetColor}36`,
              backgroundColor: 'rgba(7, 14, 20, 0.75)',
            }}
          >
            <h3 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
              {card.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.78 }}>
              {card.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};
