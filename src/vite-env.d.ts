/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_LANDING_EXPERIMENT_VARIANT?: string;
  readonly VITE_APP_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  dataLayer?: Array<Record<string, unknown>>;
  __gamespeedAnalytics?: {
    read: () => import('./lib/analytics').ConversionEventRecord[];
    clear: () => void;
    summaryBy: (
      dimension: 'name' | 'deviceType' | 'environment' | 'experimentVariant',
    ) => Array<{ key: string; count: number }>;
  };
}
