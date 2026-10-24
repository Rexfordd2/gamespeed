import { houzeClients, houzeDependencies } from '../../src/server/athleteHouzeDependencies';
import { handleGameSpeedReport } from '../../src/server/athleteHouzeHandlers';

type Request = { method?: string; headers?: Record<string, string | string[] | undefined>; body?: unknown };
type Response = { status: (code: number) => { json: (body: unknown) => void }; setHeader: (name: string, value: string) => void };

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'method_not_allowed' }); return;
  }
  const header = req.headers?.authorization;
  const authorization = Array.isArray(header) ? header[0] : header;
  const token = /^Bearer\s+(\S+)$/i.exec(authorization?.trim() ?? '')?.[1];
  if (!token) { res.status(401).json({ error: 'sign_in_required' }); return; }
  try {
    const deps = houzeDependencies();
    const user = await deps.authenticate(token);
    if (!user) { res.status(401).json({ error: 'sign_in_required' }); return; }
    const { caller, server } = houzeClients();
    const client = caller(token);
    if (!client || !server) { res.status(503).json({ error: 'sharing_not_configured' }); return; }
    if (req.method === 'DELETE') {
      const { error } = await server.from('athlete_houze_enrollments')
        .update({ status: 'disconnected', updated_at: new Date().toISOString() }).eq('user_id', user.id);
      if (error) throw error;
      res.status(200).json({ linked: false, sharingStopped: true }); return;
    }
    const enrollment = await deps.loadEnrollment(user.id, token);
    const { data, error } = await client.from('athlete_houze_round_deliveries')
      .select('client_round_id, status').eq('user_id', user.id)
      .in('status', ['pending', 'failed']).order('updated_at', { ascending: true }).limit(25);
    if (error) throw error;
    if (req.method === 'GET') {
      const { count, error: heldError } = await client.from('athlete_houze_round_deliveries')
        .select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'unattached');
      if (heldError) throw heldError;
      res.status(200).json({ linked: Boolean(enrollment), pendingCount: data.length, heldCount: count ?? 0 }); return;
    }
    if (!enrollment) { res.status(409).json({ error: 'not_linked' }); return; }
    // Bounded batch; every attempt repeats authentication, ownership, and consent checks.
    const results = [];
    for (const row of data.slice(0, 2)) {
      const result = await handleGameSpeedReport({ authorization, body: { clientRoundId: row.client_round_id } }, deps);
      results.push({ clientRoundId: row.client_round_id, ...result.body });
    }
    res.status(200).json({ results });
  } catch {
    res.status(503).json({ error: 'sharing_temporarily_unavailable' });
  }
}
