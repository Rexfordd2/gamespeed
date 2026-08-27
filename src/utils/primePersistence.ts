import { PrimeSessionRecord, PrimeSummaryMetrics } from '../types/prime';

export const PRIME_SESSIONS_STORAGE_KEY = 'gamespeed_prime_sessions_v1';
const CURRENT_VERSION = 1;
const MAX_SESSIONS = 40;

interface PrimeSessionStore {
  version: number;
  sessions: PrimeSessionRecord[];
}

const isSummary = (value: unknown): value is PrimeSummaryMetrics => {
  if (typeof value !== 'object' || value === null) return false;
  const summary = value as PrimeSummaryMetrics;
  return typeof summary.stepsCompleted === 'number' && typeof summary.totalDurationSeconds === 'number';
};

const normalizeSession = (value: unknown): PrimeSessionRecord | null => {
  if (typeof value !== 'object' || value === null) return null;
  const session = value as Partial<PrimeSessionRecord>;
  if (typeof session.id !== 'string' || typeof session.protocolId !== 'string') return null;
  if (session.status !== 'completed' && session.status !== 'cancelled') return null;
  if (!isSummary(session.summary)) return null;
  return {
    id: session.id,
    ts: typeof session.ts === 'number' ? session.ts : Date.now(),
    protocolId: session.protocolId,
    protocolName: typeof session.protocolName === 'string' ? session.protocolName : 'GameSpeed Prime',
    recipeId: typeof session.recipeId === 'string' && session.recipeId ? session.recipeId : session.protocolId,
    context: session.context ?? 'practice',
    sport: session.sport ?? 'soccer',
    position: typeof session.position === 'string' && session.position ? session.position : 'general',
    status: session.status,
    startedAt: typeof session.startedAt === 'number' ? session.startedAt : Date.now(),
    endedAt: typeof session.endedAt === 'number' ? session.endedAt : Date.now(),
    totalDurationMs: typeof session.totalDurationMs === 'number' ? session.totalDurationMs : 0,
    stepResults: Array.isArray(session.stepResults) ? session.stepResults : [],
    summary: session.summary,
  };
};

export const loadPrimeSessions = (): PrimeSessionRecord[] => {
  try {
    const raw = localStorage.getItem(PRIME_SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<PrimeSessionStore>;
    if (parsed.version !== CURRENT_VERSION || !Array.isArray(parsed.sessions)) {
      return [];
    }
    return parsed.sessions
      .map(normalizeSession)
      .filter((session): session is PrimeSessionRecord => session !== null);
  } catch {
    return [];
  }
};

const savePrimeSessions = (sessions: PrimeSessionRecord[]) => {
  try {
    const trimmed = sessions.slice(-MAX_SESSIONS);
    localStorage.setItem(
      PRIME_SESSIONS_STORAGE_KEY,
      JSON.stringify({ version: CURRENT_VERSION, sessions: trimmed } satisfies PrimeSessionStore),
    );
  } catch {
    // Ignore storage failures.
  }
};

export const recordPrimeSession = (session: PrimeSessionRecord): PrimeSessionRecord => {
  const existing = loadPrimeSessions().filter(item => item.id !== session.id);
  savePrimeSessions([...existing, session]);
  return session;
};

export const clearPrimeSessions = (): void => {
  try {
    localStorage.removeItem(PRIME_SESSIONS_STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const getCompletedPrimeSessions = (): PrimeSessionRecord[] =>
  loadPrimeSessions().filter(session => session.status === 'completed');
