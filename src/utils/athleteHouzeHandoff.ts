export const ATHLETE_HOUZE_SOURCE = 'athlete-houze';
export const ATHLETE_HOUZE_ORIGIN = 'https://athletehouze.com';
export const ATHLETE_HOUZE_HANDOFF_STORAGE_KEY = 'gamespeed_handoff_source_v1';

const SOURCE_QUERY_KEY = 'source';
const RETURN_QUERY_KEY = 'return_to';

export interface AthleteHouzeHandoff {
  source: typeof ATHLETE_HOUZE_SOURCE;
  returnUrl: string;
}

/**
 * Only URLs on the hard-coded Athlete Houze origin are allowed; anything else
 * (other hosts, protocol-relative, javascript:, http:) falls back to the root.
 */
export const resolveAthleteHouzeReturnUrl = (candidate: string | null | undefined): string => {
  const fallback = `${ATHLETE_HOUZE_ORIGIN}/`;
  if (!candidate) {
    return fallback;
  }
  try {
    const parsed = new URL(candidate, ATHLETE_HOUZE_ORIGIN);
    if (parsed.origin !== ATHLETE_HOUZE_ORIGIN || parsed.username || parsed.password) {
      return fallback;
    }
    return parsed.toString();
  } catch {
    return fallback;
  }
};

const persistHandoff = (handoff: AthleteHouzeHandoff) => {
  try {
    sessionStorage.setItem(ATHLETE_HOUZE_HANDOFF_STORAGE_KEY, JSON.stringify(handoff));
  } catch {
    // Ignore storage failures (private mode / quota).
  }
};

const loadPersistedHandoff = (): AthleteHouzeHandoff | null => {
  try {
    const raw = sessionStorage.getItem(ATHLETE_HOUZE_HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AthleteHouzeHandoff> | null;
    if (!parsed || parsed.source !== ATHLETE_HOUZE_SOURCE) return null;
    return {
      source: ATHLETE_HOUZE_SOURCE,
      returnUrl: resolveAthleteHouzeReturnUrl(parsed.returnUrl),
    };
  } catch {
    return null;
  }
};

/**
 * Reads `?source=athlete-houze` (and optional `return_to`) from the entry URL.
 * The handoff is kept for the browser tab session because in-app navigation
 * rewrites the query string.
 */
export const readAthleteHouzeHandoff = (search: string): AthleteHouzeHandoff | null => {
  const params = new URLSearchParams(search);
  if (params.get(SOURCE_QUERY_KEY)?.trim().toLowerCase() === ATHLETE_HOUZE_SOURCE) {
    const handoff: AthleteHouzeHandoff = {
      source: ATHLETE_HOUZE_SOURCE,
      returnUrl: resolveAthleteHouzeReturnUrl(params.get(RETURN_QUERY_KEY)),
    };
    persistHandoff(handoff);
    return handoff;
  }
  return loadPersistedHandoff();
};
