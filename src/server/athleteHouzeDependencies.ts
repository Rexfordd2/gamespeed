import { createClient } from '@supabase/supabase-js';
import type { HouzeDeps } from './athleteHouzeHandlers';

// The caller JWT is used only for authentication and ownership-scoped reads.
// Linkage and delivery receipts are written exclusively by the server.
export function houzeClients() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const server = url && serviceKey ? createClient(url, serviceKey, options) : null;
  const caller = (token: string) => url && anon ? createClient(url, anon, {
    ...options, global: { headers: { Authorization: `Bearer ${token}` } },
  }) : null;
  return { server, caller };
}

export function houzeDependencies(): HouzeDeps {
  const { server, caller } = houzeClients();
  return {
    env: {
      reportUrl: process.env.ATHLETE_HOUZE_REPORT_URL,
      hmacSecret: process.env.ATHLETE_HOUZE_REPORT_HMAC_SECRET,
      vercelEnv: process.env.VERCEL_ENV, nodeEnv: process.env.NODE_ENV,
      storageReady: Boolean(server),
    },
    authenticate: async token => {
      const client = caller(token);
      if (!client) return null;
      const { data, error } = await client.auth.getUser(token);
      return !error && data.user ? { id: data.user.id } : null;
    },
    loadRound: async (userId, roundId, token) => {
      const client = caller(token);
      if (!client) return null;
      const { data, error } = await client.from('user_rounds')
        .select('client_round_id, round_ts, mode, sport, score, misses, accuracy, best_streak, median_reaction_time_ms, meta')
        .eq('user_id', userId).eq('client_round_id', roundId).maybeSingle();
      if (error) throw new Error('round_read_failed');
      return data;
    },
    loadEnrollment: async (userId, token) => {
      const client = caller(token);
      if (!client) return null;
      const { data, error } = await client.from('athlete_houze_enrollments')
        .select('status, linked_at, backfill_consented').eq('user_id', userId).maybeSingle();
      if (error) throw new Error('enrollment_read_failed');
      return data?.status === 'linked'
        ? { linkedAt: data.linked_at, backfillConsented: data.backfill_consented === true } : null;
    },
    recordEnrollment: async ({ userId, backfillConsented }) => {
      if (!server) return false;
      const now = new Date().toISOString();
      const { error } = await server.from('athlete_houze_enrollments').upsert({
        user_id: userId, status: 'linked', linked_at: now,
        backfill_consented: backfillConsented, updated_at: now,
      }, { onConflict: 'user_id' });
      return !error;
    },
    recordDelivery: async ({ userId, clientRoundId, status, receiverStatus }) => {
      if (!server) throw new Error('delivery_storage_unavailable');
      const { error } = await server.from('athlete_houze_round_deliveries').upsert({
        user_id: userId, client_round_id: clientRoundId, status,
        receiver_status: receiverStatus, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,client_round_id' });
      if (error) throw new Error('delivery_storage_failed');
    },
  };
}
