import type { GameModeType } from '../types/game';
import type { SportType } from './sports';
import assetMap from '../../public/assets/asset-map.json';

type ContractorAssetEntry = {
  id: string;
  file: string;
  fallbackFile?: string;
  fallbackGlyph?: string;
};

type ContractorAudioCueEntry = ContractorAssetEntry & {
  channel: 'music' | 'gameplay' | 'training' | 'mode' | 'ui';
  cueKey: string;
};

type ContractorAssetMap = {
  groups: {
    sportIcons: ContractorAssetEntry[];
    modeIcons: ContractorAssetEntry[];
    targetSkins: ContractorAssetEntry[];
    hudBadges: ContractorAssetEntry[];
    audioCues: ContractorAudioCueEntry[];
    sharedVisuals: ContractorAssetEntry[];
  };
  references: {
    sportToSportIcon: Record<SportType, string>;
    sportToTargetSkin: Record<SportType, string>;
    modeToModeIcon: Record<GameModeType, string>;
    modeToAudioCues: Record<GameModeType, string[]>;
  };
};

const manifest = assetMap as ContractorAssetMap;
const baseUrl = import.meta.env.BASE_URL;

const buildAssetPath = (relativePath: string) =>
  `${baseUrl}assets/${relativePath.replace(/^\/+/, '')}`;

const byId = <T extends ContractorAssetEntry>(entries: T[]) =>
  entries.reduce<Record<string, T>>((accumulator, entry) => {
    accumulator[entry.id] = entry;
    return accumulator;
  }, {});

const sportIconsById = byId(manifest.groups.sportIcons);
const targetSkinsById = byId(manifest.groups.targetSkins);
const modeIconsById = byId(manifest.groups.modeIcons);
const hudBadgesById = byId(manifest.groups.hudBadges);
const sharedVisualsById = byId(manifest.groups.sharedVisuals);
const audioCuesById = manifest.groups.audioCues.reduce<Record<string, ContractorAudioCueEntry>>(
  (accumulator, cue) => {
    accumulator[`${cue.channel}:${cue.cueKey}`] = cue;
    return accumulator;
  },
  {},
);

const resolvePathEntry = (
  entry: ContractorAssetEntry | undefined,
  defaultRelativePath: string,
): string => {
  if (entry?.file) {
    return buildAssetPath(entry.file);
  }
  if (entry?.fallbackFile) {
    return buildAssetPath(entry.fallbackFile);
  }
  return buildAssetPath(defaultRelativePath);
};

export const resolveSharedVisualPath = (id: string, defaultRelativePath: string) =>
  resolvePathEntry(sharedVisualsById[id], defaultRelativePath);

export const resolveSportIconPath = (sport: SportType) => {
  const iconId = manifest.references.sportToSportIcon[sport];
  return resolvePathEntry(sportIconsById[iconId], 'icons/target-primate.svg');
};

export const resolveSportIconFallbackPath = (sport: SportType) => {
  const iconId = manifest.references.sportToSportIcon[sport];
  const entry = sportIconsById[iconId];
  if (entry?.fallbackFile) {
    return buildAssetPath(entry.fallbackFile);
  }
  return buildAssetPath('icons/target-primate.svg');
};

export const resolveTargetSkinPath = (sport: SportType) => {
  const skinId = manifest.references.sportToTargetSkin[sport];
  return resolvePathEntry(targetSkinsById[skinId], 'icons/target-primate.svg');
};

export const resolveTargetSkinFallbackPath = (sport: SportType) => {
  const skinId = manifest.references.sportToTargetSkin[sport];
  const entry = targetSkinsById[skinId];
  if (entry?.fallbackFile) {
    return buildAssetPath(entry.fallbackFile);
  }
  return buildAssetPath('icons/target-primate.svg');
};

export interface SportVisualAssetRef {
  assetId?: string;
  fallbackAssetId?: string;
}

const resolveSportAssetByRef = (
  entriesById: Record<string, ContractorAssetEntry>,
  fallbackPathResolver: (sport: SportType) => string,
  mapResolver: (sport: SportType) => string,
  sport: SportType,
  reference?: SportVisualAssetRef,
) => {
  const mappedEntry = entriesById[mapResolver(sport)];
  const requestedEntry = reference?.assetId ? entriesById[reference.assetId] : mappedEntry;
  const fallbackEntry = reference?.fallbackAssetId ? entriesById[reference.fallbackAssetId] : undefined;
  return (
    resolvePathEntry(requestedEntry ?? fallbackEntry, 'icons/target-primate.svg') ||
    fallbackPathResolver(sport)
  );
};

export const resolveSportIconAssetPath = (sport: SportType, reference?: SportVisualAssetRef) =>
  resolveSportAssetByRef(
    sportIconsById,
    resolveSportIconFallbackPath,
    key => manifest.references.sportToSportIcon[key],
    sport,
    reference,
  );

export const resolveTargetSkinAssetPath = (sport: SportType, reference?: SportVisualAssetRef) =>
  resolveSportAssetByRef(
    targetSkinsById,
    resolveTargetSkinFallbackPath,
    key => manifest.references.sportToTargetSkin[key],
    sport,
    reference,
  );

export const resolveModeIconAsset = (mode: GameModeType) => {
  const iconId = manifest.references.modeToModeIcon[mode];
  const entry = modeIconsById[iconId];
  return {
    path: entry?.file ? buildAssetPath(entry.file) : '',
    fallbackGlyph: entry?.fallbackGlyph ?? '•',
  };
};

export const resolveHudBadgePath = (badgeId: string) =>
  resolvePathEntry(hudBadgesById[badgeId], 'ui/hud-vignette.svg');

export const resolveAudioCueAsset = (
  channel: ContractorAudioCueEntry['channel'],
  cueKey: string,
) => {
  const cueEntry = audioCuesById[`${channel}:${cueKey}`];
  if (!cueEntry) {
    return { src: '', fallbackSrc: undefined as string | undefined };
  }
  return {
    src: buildAssetPath(cueEntry.file),
    fallbackSrc: cueEntry.fallbackFile ? buildAssetPath(cueEntry.fallbackFile) : undefined,
  };
};

export const contractorAssetMap = manifest;
