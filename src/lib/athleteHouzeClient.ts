import { supabase } from './supabase';

/** Asks the GameSpeed server to deliver a round that is already saved. */
export async function deliverSavedRound(clientRoundId: string): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  await fetch('/api/athlete-houze/report', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ clientRoundId }),
  }).catch(() => undefined);
}
