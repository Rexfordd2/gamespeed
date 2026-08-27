import { SportType } from './sports';

export const GENERAL_POSITION = 'general';
export const ATHLETE_POSITION_STORAGE_KEY = 'gamespeed_athlete_positions_v1';

export interface AthletePositionOption {
  id: string;
  label: string;
  shortLabel: string;
}

export const GENERAL_POSITION_OPTION: AthletePositionOption = {
  id: GENERAL_POSITION,
  label: 'General',
  shortLabel: 'General',
};

const SPORT_POSITIONS: Record<SportType, AthletePositionOption[]> = {
  football: [
    { id: 'qb', label: 'Quarterback', shortLabel: 'QB' },
    { id: 'wr_te', label: 'WR/TE', shortLabel: 'WR' },
    { id: 'rb', label: 'Running Back', shortLabel: 'RB' },
    { id: 'ol', label: 'Offensive Line', shortLabel: 'OL' },
    { id: 'dl', label: 'Defensive Line', shortLabel: 'DL' },
    { id: 'lb', label: 'Linebacker', shortLabel: 'LB' },
    { id: 'db', label: 'Defensive Back', shortLabel: 'DB' },
    { id: 'specialist', label: 'K/P/Specialist', shortLabel: 'K/P' },
  ],
  basketball: [
    { id: 'guard', label: 'Guard', shortLabel: 'Guard' },
    { id: 'wing', label: 'Wing', shortLabel: 'Wing' },
    { id: 'big', label: 'Big', shortLabel: 'Big' },
  ],
  baseball_softball: [
    { id: 'hitter', label: 'Hitter', shortLabel: 'Hitter' },
    { id: 'pitcher', label: 'Pitcher', shortLabel: 'Pitcher' },
    { id: 'infielder', label: 'Infielder', shortLabel: 'INF' },
    { id: 'outfielder', label: 'Outfielder', shortLabel: 'OF' },
    { id: 'catcher', label: 'Catcher', shortLabel: 'C' },
  ],
  soccer: [
    { id: 'keeper', label: 'Keeper', shortLabel: 'GK' },
    { id: 'defender', label: 'Defender', shortLabel: 'DEF' },
    { id: 'midfielder', label: 'Midfielder', shortLabel: 'MID' },
    { id: 'forward', label: 'Forward', shortLabel: 'FWD' },
  ],
  volleyball: [
    { id: 'setter', label: 'Setter', shortLabel: 'Setter' },
    { id: 'hitter', label: 'Hitter', shortLabel: 'Hitter' },
    { id: 'libero', label: 'Libero', shortLabel: 'Libero' },
    { id: 'blocker', label: 'Blocker', shortLabel: 'Blocker' },
  ],
  boxing: [{ id: 'fighter', label: 'Fighter', shortLabel: 'Fighter' }],
  racquet: [
    { id: 'singles', label: 'Singles', shortLabel: 'Singles' },
    { id: 'doubles', label: 'Doubles', shortLabel: 'Doubles' },
  ],
};

type PositionMap = Partial<Record<SportType, string>>;

export const getSportSpecificPositions = (sport: SportType): AthletePositionOption[] =>
  SPORT_POSITIONS[sport] ?? [];

export const getPositionsForSport = (sport: SportType): AthletePositionOption[] => [
  GENERAL_POSITION_OPTION,
  ...getSportSpecificPositions(sport),
];

export const isPositionForSport = (sport: SportType, position: string | null | undefined): boolean => {
  if (!position) return false;
  return getPositionsForSport(sport).some(option => option.id === position);
};

export const resolvePositionId = (sport: SportType, position: string | null | undefined): string => {
  if (isPositionForSport(sport, position) && position) {
    return position;
  }
  return GENERAL_POSITION;
};

export const getPositionOption = (sport: SportType, position: string | null | undefined): AthletePositionOption => {
  const resolved = resolvePositionId(sport, position);
  return getPositionsForSport(sport).find(option => option.id === resolved) ?? GENERAL_POSITION_OPTION;
};

const loadPositionMap = (): PositionMap => {
  try {
    const raw = localStorage.getItem(ATHLETE_POSITION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as PositionMap;
  } catch {
    return {};
  }
};

const savePositionMap = (map: PositionMap): void => {
  try {
    localStorage.setItem(ATHLETE_POSITION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage failures (private mode / quota).
  }
};

export const loadAthletePosition = (sport: SportType): string =>
  resolvePositionId(sport, loadPositionMap()[sport]);

export const saveAthletePosition = (sport: SportType, position: string): void => {
  const map = loadPositionMap();
  map[sport] = resolvePositionId(sport, position);
  savePositionMap(map);
};

export const clearAthletePositions = (): void => {
  try {
    localStorage.removeItem(ATHLETE_POSITION_STORAGE_KEY);
  } catch {
    // ignore
  }
};
