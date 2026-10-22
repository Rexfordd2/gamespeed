import { handleGameSpeedLink, type HouzeDeps, type HouzeServerEnv } from '../../src/server/athleteHouzeHandlers';
import { createClient } from '@supabase/supabase-js';

function env(): HouzeServerEnv {
  return {
    reportUrl: process.env.ATHLETE_HOUZE_REPORT_URL,
    hmacSecret: process.env.ATHLETE_HOUZE_REPORT_HMAC_SECRET,
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
  };
}

function clientFor(token: string) {
  const config = env();
  if (!config.supabaseUrl || !config.supabaseKey) return null;
  return createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

const deps = (): HouzeDeps => ({
  env: env(),
  authenticate: async (accessToken) => {
    const client = clientFor(accessToken);
    if (!client) return null;
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) return null;
    return { id: data.user.id };
  },
  loadRound: async () => null,
  loadEnrollment: async (userId, accessToken) => {
    const client = clientFor(accessToken);
    if (!client) return 'missing';
    const { data } = await client
      .from('athlete_houze_enrollments')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.status === 'linked' ? 'linked' : 'missing';
  },
  recordDelivery: async () => undefined,
  recordEnrollment: async ({ userId, accessToken }) => {
    const client = clientFor(accessToken);
    if (!client) return false;
    const { error } = await client.from('athlete_houze_enrollments').upsert(
      { user_id: userId, status: 'linked', updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    return !error;
  },
});

export default async function handler(
  req: { method?: string; headers?: Record<string, string | string[] | undefined>; body?: unknown },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  if (req.method !== 'POST') {
    res.status(405).json({ linked: false, error: 'method_not_allowed' });
    return;
  }
  const authorization = req.headers?.authorization;
  const result = await handleGameSpeedLink(
    { authorization: Array.isArray(authorization) ? authorization[0] : authorization, body: req.body },
    deps(),
  );
  res.status(result.status).json(result.body);
}
