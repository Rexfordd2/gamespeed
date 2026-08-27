import { createClient } from '@supabase/supabase-js';

// These production defaults are intentionally browser-public values. Supabase publishable
// keys are designed to ship to clients and are protected by RLS. Environment variables
// still override them for preview/dev isolation or future key rotation.
const PRODUCTION_SUPABASE_URL = 'https://juyggnkcwfwdbhguzdgn.supabase.co';
const PRODUCTION_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_vqJVuqduP8STWr9_paK5lw_lpHRXOqE';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  (import.meta.env.PROD ? PRODUCTION_SUPABASE_URL : undefined);
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  (import.meta.env.PROD ? PRODUCTION_SUPABASE_PUBLISHABLE_KEY : undefined);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
