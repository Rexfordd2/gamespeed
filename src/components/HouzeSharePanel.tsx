import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

async function sharingRequest(method = 'GET', body?: unknown, path = 'sharing') {
  if (!supabase) throw new Error('Sign in before managing sharing.');
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Sign in again before managing sharing.');
  const response = await fetch(`/api/athlete-houze/${path}`, {
    method,
    headers: { authorization: `Bearer ${data.session.access_token}`, 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error('Sharing could not be updated. Your saved games are retained.');
  return response.json() as Promise<{ linked?: boolean; pendingCount?: number; heldCount?: number; results?: { attachedToHouzeAthlete: boolean }[] }>;
}

export const HouzeSharePanel = () => {
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [linked, setLinked] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [heldCount, setHeldCount] = useState(0);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('Checking sharing status…');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    sharingRequest().then(status => {
      if (!active) return;
      setLinked(status.linked === true);
      setPendingCount(status.pendingCount ?? 0); setHeldCount(status.heldCount ?? 0);
      setMessage(status.linked ? 'Sharing is on.' : 'Sharing is off.');
    }).catch(() => {
      if (active) { setMessage('Sharing status could not be checked.'); setError('Sharing status is unavailable. Your saved games are retained.'); }
    }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!consent || busy) return;
    setBusy(true); setError('');
    try {
      const result = await sharingRequest('POST', { connectCode: code, athleteConsent: true }, 'link');
      if (result.linked !== true) throw new Error('The link was not confirmed. Create a fresh code in Athlete Houze and try again.');
      setLinked(true); setCode(''); setMessage('Sharing is on for new saved rounds.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Sharing failed.'); }
    finally { setBusy(false); }
  };

  const manage = async (method: 'POST' | 'DELETE') => {
    setBusy(true); setError('');
    try {
      const result = await sharingRequest(method);
      if (method === 'DELETE') {
        setLinked(false); setConsent(false);
        setMessage('New sharing is stopped. A delivery already in progress may finish. Previously shared records remain in Athlete Houze; disconnect GameSpeed there to revoke the Houze link.');
      } else {
        const attached = result.results?.filter(row => row.attachedToHouzeAthlete).length ?? 0;
        setMessage(`${attached} round delivery confirmed. Unconfirmed rounds remain saved.`);
        const status = await sharingRequest();
        setPendingCount(status.pendingCount ?? 0); setHeldCount(status.heldCount ?? 0); setLinked(status.linked === true);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Sharing failed.'); }
    finally { setBusy(false); }
  };

  return (
    <section aria-label="Athlete Houze sharing" className="mt-4 flex flex-col gap-2 text-sm">
      <p role="status" aria-live="polite">{message}</p>
      {error && <p role="alert">{error}</p>}
      {heldCount > 0 && <p>{heldCount} rounds are held without confirmed attachment. Check the athlete connection in Athlete Houze. Earlier activity needs separate sharing consent.</p>}
      {linked ? <>
        <p>{pendingCount}{pendingCount === 25 ? '+' : ''} rounds awaiting confirmed delivery.</p>
        <button type="button" disabled={busy || pendingCount === 0} onClick={() => void manage('POST')} className="rounded-xl px-4 py-2.5 font-semibold">Retry pending deliveries</button>
        <button type="button" disabled={busy} onClick={() => void manage('DELETE')} className="rounded-xl px-4 py-2.5 font-semibold">Stop sharing new rounds</button>
      </> : <form onSubmit={submit} className="flex flex-col gap-2">
        <p>Use a one-time Athlete Houze code to share new saved rounds. Reaction times are in-app drill measurements.</p>
        <input value={code} onChange={event => setCode(event.target.value)} placeholder="AHGS code" aria-label="Athlete Houze pairing code" className="rounded-xl px-3.5 py-2.5 bg-black/40" required maxLength={40} />
        <label className="flex gap-2 items-start"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />I agree to share new GameSpeed rounds with the Athlete Houze athlete who created this code. Earlier rounds will not be shared.</label>
        <button type="submit" disabled={busy || !consent} className="rounded-xl px-4 py-2.5 font-semibold">{busy ? 'Updating…' : 'Share with Athlete Houze'}</button>
      </form>}
    </section>
  );
};
