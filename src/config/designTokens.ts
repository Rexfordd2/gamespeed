/** Semantic color and surface tokens for the rainforest performance lab. */

export const forestColors = {
  nearBlack: '#020806',
  deepJungle: '#06120F',
  darkCanopy: '#0B2118',
  forest: '#123B28',
} as const;

export const performanceColors = {
  green: '#52F28C',
  bioluminescent: '#96FF66',
  amber: '#E8A43A',
  danger: '#EF4444',
  cognition: '#4CC9F0',
  bone: '#EAE9DF',
} as const;

export type SemanticAccent = 'green' | 'amber' | 'red' | 'blue';

export const semanticAccentMap: Record<SemanticAccent, string> = {
  green: performanceColors.green,
  amber: performanceColors.amber,
  red: performanceColors.danger,
  blue: performanceColors.cognition,
};

export const designTokens = {
  colors: {
    ...forestColors,
    ...performanceColors,
    text: performanceColors.bone,
    textMuted: 'rgba(234, 233, 223, 0.72)',
    panel: 'rgba(6, 18, 15, 0.82)',
    panelBorder: 'rgba(82, 242, 140, 0.28)',
  },
  fonts: {
    display: '"Barlow Condensed", "Arial Narrow", Impact, sans-serif',
    body: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
} as const;

export const resolveSemanticAccent = (accent: SemanticAccent) => semanticAccentMap[accent];
