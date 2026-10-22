import { supabase } from './supabase';

/** Immediate attempt only. The source-round transaction retains the durable queue. */
export async function deliverSavedRound(clientRoundId: string): Promise<void> {
  try {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch('/api/athlete-houze/report', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ clientRoundId }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    // The durable queue remains retryable from the sharing panel.
  }
}
