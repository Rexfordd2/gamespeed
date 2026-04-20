import { FormEvent, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const getSuggestedNameFromEmail = (email: string | null | undefined) => {
  if (!email) {
    return '';
  }
  const localPart = email.split('@')[0] ?? '';
  return localPart.replace(/[._-]+/g, ' ').trim();
};

export const AuthPanel = () => {
  const { theme } = useTheme();
  const {
    isConfigured,
    isLoading,
    isProfileLoading,
    user,
    profile,
    signInWithProvider,
    upsertProfile,
    signOut,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestedName = useMemo(
    () => getSuggestedNameFromEmail(user?.email),
    [user?.email],
  );

  const panelStyle = {
    backgroundColor: 'rgba(8, 16, 22, 0.84)',
    border: `1px solid ${theme.targetColor}44`,
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.28)',
  };

  const handleMagicLinkSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    const result = await signInWithProvider('magic_link', email);
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setInfoMessage('Magic link sent. Check your inbox and open it on this device.');
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    const result = await upsertProfile(displayName || suggestedName);
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setInfoMessage('Profile saved.');
  };

  const handleSignOut = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    const result = await signOut();
    setIsSubmitting(false);
    if (result.error) {
      setErrorMessage(result.error);
    }
  };

  if (!isConfigured) {
    return (
      <section className="rounded-2xl p-4 sm:p-5 mb-5" style={panelStyle}>
        <p
          className="text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] mb-2"
          style={{ color: theme.targetColor }}
        >
          Account setup required
        </p>
        <p className="text-sm" style={{ color: theme.textColor, opacity: 0.82 }}>
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to enable sign-in.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl p-4 sm:p-5 mb-5" style={panelStyle}>
        <p className="text-sm sm:text-base" style={{ color: theme.textColor, opacity: 0.86 }}>
          Restoring session...
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl p-4 sm:p-5 mb-5" style={panelStyle}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <p
          className="text-xs sm:text-sm uppercase tracking-[0.16em] font-semibold"
          style={{ color: theme.targetColor }}
        >
          Player account
        </p>
        {user && (
          <button
            className="ui-secondary-button px-3 py-1.5 text-xs sm:text-sm"
            onClick={handleSignOut}
            disabled={isSubmitting}
          >
            Sign out
          </button>
        )}
      </div>

      {!user && (
        <form className="flex flex-col sm:flex-row gap-2.5" onSubmit={handleMagicLinkSubmit}>
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="you@team.com"
            className="flex-1 rounded-xl px-3.5 py-2.5 text-sm"
            style={{
              backgroundColor: 'rgba(2, 8, 12, 0.9)',
              color: theme.textColor,
              border: `1px solid ${theme.targetColor}40`,
            }}
          />
          <button
            type="submit"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{
              background: `linear-gradient(135deg, ${theme.targetColor}, #a3e635)`,
              color: '#102013',
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Email me a magic link'}
          </button>
        </form>
      )}

      {user && !isProfileLoading && !profile && (
        <div>
          <p className="text-xs sm:text-sm mb-2" style={{ color: theme.textColor, opacity: 0.75 }}>
            Signed in as {user.email}. Add your display name to finish setup.
          </p>
          <form className="flex flex-col sm:flex-row gap-2.5" onSubmit={handleProfileSubmit}>
            <input
              type="text"
              value={displayName}
              onChange={event => setDisplayName(event.target.value)}
              required
              minLength={2}
              maxLength={80}
              placeholder={suggestedName ? `Display name (e.g. ${suggestedName})` : 'Display name'}
              className="flex-1 rounded-xl px-3.5 py-2.5 text-sm"
              style={{
                backgroundColor: 'rgba(2, 8, 12, 0.9)',
                color: theme.textColor,
                border: `1px solid ${theme.targetColor}40`,
              }}
            />
            <button
              type="submit"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold"
              style={{
                background: `linear-gradient(135deg, ${theme.targetColor}, #a3e635)`,
                color: '#102013',
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </div>
      )}

      {user && isProfileLoading && (
        <p className="text-sm" style={{ color: theme.textColor, opacity: 0.82 }}>
          Loading your profile...
        </p>
      )}

      {user && profile && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <p className="text-sm sm:text-base font-semibold" style={{ color: theme.textColor }}>
            Signed in as {profile.display_name}
          </p>
          <p className="text-xs sm:text-sm" style={{ color: theme.textColor, opacity: 0.72 }}>
            {profile.email}
          </p>
        </div>
      )}

      {errorMessage && (
        <p className="mt-3 text-xs sm:text-sm" style={{ color: '#fda4af' }}>
          {errorMessage}
        </p>
      )}

      {infoMessage && (
        <p className="mt-3 text-xs sm:text-sm" style={{ color: theme.targetColor }}>
          {infoMessage}
        </p>
      )}
    </section>
  );
};
