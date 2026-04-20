import { LandingContent } from '../../content/landingContent';
import { useTheme } from '../../context/ThemeContext';
import { JungleButton } from '../JungleButton';

interface LandingFinalCtaProps {
  content: LandingContent['finalCta'];
  onPrimary: () => void;
  onSecondary: () => void;
}

export const LandingFinalCta = ({ content, onPrimary, onSecondary }: LandingFinalCtaProps) => {
  const { theme } = useTheme();

  return (
    <section
      className="rounded-3xl border p-6 text-center sm:p-8"
      style={{
        borderColor: `${theme.targetColor}55`,
        background: 'linear-gradient(165deg, rgba(5,11,17,0.94), rgba(8,23,20,0.8))',
        boxShadow: `0 18px 42px rgba(0,0,0,0.4), inset 0 0 0 1px ${theme.targetColor}22`,
      }}
    >
      <h2 className="text-2xl font-bold leading-tight sm:text-3xl" style={{ color: theme.textColor }}>
        {content.heading}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.84 }}>
        {content.body}
      </p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <JungleButton onClick={onPrimary} className="min-h-12 sm:min-w-56">
          {content.primaryCta}
        </JungleButton>
        <button
          type="button"
          onClick={onSecondary}
          className="ui-secondary-button min-h-12 rounded-xl px-5 text-sm sm:text-base"
        >
          {content.secondaryCta}
        </button>
      </div>
    </section>
  );
};
