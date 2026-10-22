import { handleGameSpeedReport } from '../../src/server/athleteHouzeHandlers';
import { houzeDependencies } from '../../src/server/athleteHouzeDependencies';

export default async function handler(
  req: { method?: string; headers?: Record<string, string | string[] | undefined>; body?: unknown },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  if (req.method !== 'POST') {
    res.status(405).json({ retained: true, attachedToHouzeAthlete: false, reason: 'method_not_allowed' });
    return;
  }
  const authorization = req.headers?.authorization;
  try {
  const result = await handleGameSpeedReport(
    { authorization: Array.isArray(authorization) ? authorization[0] : authorization, body: req.body },
    houzeDependencies(),
  );
  res.status(result.status).json(result.body);
  } catch {
    res.status(503).json({ error: 'sharing_temporarily_unavailable', retained: true, linked: false, attachedToHouzeAthlete: false });
  }
}
