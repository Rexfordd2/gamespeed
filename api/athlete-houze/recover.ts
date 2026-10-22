import { timingSafeEqual } from 'node:crypto';
import { houzeDependencies } from '../../src/server/athleteHouzeDependencies';
import { recoverDueGameSpeedDeliveries } from '../../src/server/athleteHouzeHandlers';

type Request = { method?: string; headers?: Record<string, string | string[] | undefined> };
type Response = { status: (code: number) => { json: (body: unknown) => void }; setHeader: (name: string, value: string) => void };

function authorized(header: string | undefined): boolean {
  const secret = process.env.HOUZE_RECOVERY_SECRET || process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const presented = header.replace(/^Bearer\s+/i, '').trim();
  const left = Buffer.from(presented);
  const right = Buffer.from(secret);
  if (left.length !== right.length) {
    timingSafeEqual(right, right);
    return false;
  }
  return timingSafeEqual(left, right);
}

/** Vercel Cron calls GET. A manual operator may POST. Both require the server secret. */
export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const header = req.headers?.authorization;
  const authorization = Array.isArray(header) ? header[0] : header;
  if (!authorized(authorization)) {
    res.status(401).json({ error: 'recovery_unauthorized' });
    return;
  }
  try {
    const recovered = await recoverDueGameSpeedDeliveries(houzeDependencies(), { limit: 10 });
    res.status(200).json({
      attempted: recovered.attempted,
      attached: recovered.results.filter((row) => row.attachedToHouzeAthlete).length,
    });
  } catch {
    res.status(503).json({ error: 'recovery_temporarily_unavailable' });
  }
}
