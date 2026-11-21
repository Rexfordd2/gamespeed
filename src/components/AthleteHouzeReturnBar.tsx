import { useTheme } from '../context/ThemeContext';

export const ATHLETE_HOUZE_HOME_URL = 'https://athletehouze.com/';

/** Ecosystem return link shared in name and placement with the other Athlete Houze apps. */
export const AthleteHouzeReturnBar = () => {
  const { theme } = useTheme();

  return (
    <div
      className="relative z-[110] border-b px-4 sm:px-6"
      style={{ borderColor: `${theme.targetColor}2a`, backgroundColor: 'rgba(2, 8, 6, 0.92)' }}
    >
      <a
        href={ATHLETE_HOUZE_HOME_URL}
        data-testid="athlete-houze-return-link"
        className="inline-flex min-h-9 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ color: theme.textColor, opacity: 0.82 }}
      >
        <span aria-hidden="true">←</span>
        Return to Athlete Houze
      </a>
    </div>
  );
};
