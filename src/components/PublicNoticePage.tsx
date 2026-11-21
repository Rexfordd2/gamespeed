import { ReactNode } from 'react';
import { JungleBackground } from './JungleBackground';
import { JungleButton } from './JungleButton';
import { useTheme } from '../context/ThemeContext';

interface PublicNoticePageProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
  onBackToHome: () => void;
  testId: string;
}

const PublicNoticePage = ({ eyebrow, title, children, onBackToHome, testId }: PublicNoticePageProps) => {
  const { theme } = useTheme();

  return (
    <div
      className="relative w-full overflow-x-hidden px-4 sm:px-6"
      style={{
        minHeight: 'calc(100dvh - 2.25rem)',
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
      }}
      data-testid={testId}
    >
      <JungleBackground variant="clearing" mist />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(2,8,6,0.72), rgba(2,8,6,0.92))' }}
      />
      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-col py-10 sm:py-16">
        <section
          className="rounded-3xl border p-5 sm:p-7"
          style={{ borderColor: `${theme.targetColor}4a`, backgroundColor: 'rgba(5, 12, 18, 0.86)' }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: theme.targetColor }}
          >
            {eyebrow}
          </p>
          <h1
            className="font-display mt-2 text-2xl font-extrabold uppercase tracking-[0.05em] sm:text-3xl"
            style={{ color: theme.textColor }}
          >
            {title}
          </h1>
          <div className="mt-3 space-y-3 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.84 }}>
            {children}
          </div>
          <JungleButton onClick={onBackToHome} className="mt-6 min-h-12 w-full font-display uppercase tracking-[0.1em] sm:w-auto">
            Go to GameSpeed home
          </JungleButton>
        </section>
      </main>
    </div>
  );
};

export const NotFoundPage = ({ onBackToHome }: { onBackToHome: () => void }) => (
  <PublicNoticePage eyebrow="404" title="Page not found" onBackToHome={onBackToHome} testId="not-found-page">
    <p>There is no GameSpeed page at this address. Check the link, or start from the GameSpeed home page.</p>
  </PublicNoticePage>
);

export const PrivacyStatusPage = ({ onBackToHome }: { onBackToHome: () => void }) => (
  <PublicNoticePage
    eyebrow="Privacy"
    title="Privacy policy not yet published"
    onBackToHome={onBackToHome}
    testId="privacy-status-page"
  >
    <p>
      GameSpeed has not published its privacy policy yet. It is waiting for founder and legal review, and this
      page will show it once it is approved.
    </p>
    <p>You can run the benchmark and drills without creating an account.</p>
  </PublicNoticePage>
);
