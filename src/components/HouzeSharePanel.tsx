import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

type ShareState =
  | { tone: 'idle' }
  | { tone: 'pending' }
  | { tone: 'linked' }
  | { tone: 'refused'; message: string };

export const HouzeSharePanel = () => {
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<ShareState>({ tone: 'idle' });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!consent || !supabase) {
      setState({ tone: 'refused', message: 'Confirm sharing while signed in.' });
      return;
    }
    setState({ tone: 'pending' });
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setState({ tone: 'refused', message: 'Sign in again before sharing.' });
      return;
    }
    try {
      const response = await fetch('/api/athlete-houze/link', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ connectCode: code, athleteConsent: true }),
      });
      const body = (await response.json()) as { linked?: boolean; error?: string };
      if (response.ok && body.linked === true) {
        setState({ tone: 'linked' });
        return;
      }
      setState({
        tone: 'refused',
        message:
          body.error === 'sharing_not_configured'
            ? 'Athlete Houze sharing is not configured on this deployment.'
            : 'Athlete Houze did not accept this code. The GameSpeed account is not connected.',
      });
    } catch {
      setState({
        tone: 'refused',
        message: 'The share could not be completed. Saved games stay on this account.',
      });
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
      <p className="text-xs sm:text-sm opacity-80">
        Paste a one-time Athlete Houze code to share completed GameSpeed rounds with that athlete.
        Reaction times stay labeled as in-app measurements.
      </p>
      <input
        value={code}
        onChange={event => setCode(event.target.value)}
        placeholder="AHGS code"
        aria-label="Athlete Houze pairing code"
        className="rounded-xl px-3.5 py-2.5 text-sm bg-black/40"
        required
      />
      <label className="text-xs sm:text-sm flex gap-2 items-start">
        <input
          type="checkbox"
          checked={consent}
          onChange={event => setConsent(event.target.checked)}
        />
        I agree to share my completed GameSpeed rounds with the Athlete Houze athlete who created this code.
      </label>
      <button type="submit" className="rounded-xl px-4 py-2.5 text-sm font-semibold" disabled={!consent || state.tone === 'pending'}>
        {state.tone === 'pending' ? 'Sharing...' : 'Share with Athlete Houze'}
      </button>
      {state.tone === 'linked' && (
        <p role="status" className="text-xs sm:text-sm">
          Connected. New saved rounds can be delivered to that athlete.
        </p>
      )}
      {state.tone === 'refused' && (
        <p role="alert" className="text-xs sm:text-sm">
          {state.message}
        </p>
      )}
    </form>
  );
};
