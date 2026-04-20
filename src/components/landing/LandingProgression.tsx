import { LandingContent } from '../../content/landingContent';
import { useTheme } from '../../context/ThemeContext';
import { JungleButton } from '../JungleButton';

interface LandingProgressionProps {
  content: LandingContent['progression'];
  onRunStarter: () => void;
}

export const LandingProgression = ({ content, onRunStarter }: LandingProgressionProps) => {
  const { theme } = useTheme();

  return (
    <section>
      <h2 className="text-xl font-bold sm:text-2xl" style={{ color: theme.textColor }}>
        {content.heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.83 }}>
        {content.body}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {content.hooks.map(hook => (
          <article
            key={hook.title}
            className="rounded-2xl border p-4"
            style={{
              borderColor: `${theme.targetColor}3b`,
              backgroundColor: 'rgba(7, 16, 21, 0.74)',
            }}
          >
            <h3 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
              {hook.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.77 }}>
              {hook.body}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-5">
        <JungleButton onClick={onRunStarter} className="min-h-12">
          {content.cta}
        </JungleButton>
      </div>
    </section>
  );
};
