import { GameModeType } from '../types/game';
import {
  SportAccentTokens,
  SportPack,
  SportReadinessCopy,
  SportRunwayCopy,
  sportPacksById,
} from './sportPacks';

export type SportType =
  | 'soccer'
  | 'football'
  | 'volleyball'
  | 'boxing'
  | 'baseball_softball'
  | 'racquet'
  | 'basketball';

export interface SportConfig {
  id: SportType;
  displayName: string;
  accents: SportAccentTokens;
  cueVocabulary: string[];
  defaultRecommendedModes: GameModeType[];
  readinessCopy: SportReadinessCopy;
  runwayCopy: SportRunwayCopy;
}

export const DEFAULT_SPORT: SportType = 'soccer';
export const SPORT_SELECTION_STORAGE_KEY = 'gamespeed_selected_sport_v1';

export const SPORT_ORDER: SportType[] = [
  'soccer',
  'volleyball',
  'boxing',
  'baseball_softball',
  'racquet',
  'football',
  'basketball',
];

const toSportConfig = (sportPack: SportPack): SportConfig => ({
  id: sportPack.id,
  displayName: sportPack.displayName,
  accents: sportPack.accentTokens,
  cueVocabulary: sportPack.cueVocabulary.sequence,
  defaultRecommendedModes: sportPack.defaultRecommendedModes,
  readinessCopy: sportPack.introCopy,
  runwayCopy: sportPack.runwayCopy,
});

export const sportConfigs: Record<SportType, SportConfig> = Object.values(sportPacksById).reduce(
  (accumulator, sportPack) => {
    accumulator[sportPack.id] = toSportConfig(sportPack);
    return accumulator;
  },
  {} as Record<SportType, SportConfig>,
);

export const isSportType = (value: string): value is SportType => value in sportConfigs;

export const resolveSportType = (value: string | null | undefined): SportType => {
  if (value && isSportType(value)) {
    return value;
  }
  return DEFAULT_SPORT;
};

export const getSportConfig = (sport: SportType): SportConfig => sportConfigs[sport];

export const getSportPack = (sport: SportType): SportPack =>
  sportPacksById[sport] ?? sportPacksById[DEFAULT_SPORT];

export const loadSelectedSport = (): SportType => {
  try {
    const stored = localStorage.getItem(SPORT_SELECTION_STORAGE_KEY);
    return resolveSportType(stored);
  } catch {
    return DEFAULT_SPORT;
  }
};

export const saveSelectedSport = (sport: SportType): void => {
  try {
    localStorage.setItem(SPORT_SELECTION_STORAGE_KEY, sport);
  } catch {
    // Ignore storage failures (private mode / quota).
  }
};
