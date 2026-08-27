import {
  SchulteBoard,
  SchulteBoardConfig,
  SchulteBoardPhase,
  SchulteCell,
  SchulteCompletionStatus,
  SchulteGridSize,
  SchulteRoundAccumulator,
  SchulteScanMetrics,
  SchulteSelectOutcome,
  SchulteSequenceRule,
  SchulteShapeId,
  SchulteToken,
} from '../types/schulte';

export const SCHULTE_GRID_SIZES: SchulteGridSize[] = [3, 4, 5, 6, 7];
export const DEFAULT_SCHULTE_ERROR_PENALTY_MS = 220;
export const DEFAULT_SCHULTE_FLASH_MS = 1600;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COLOR_SEQUENCE: Array<{ label: string; color: string }> = [
  { label: 'Red', color: '#f87171' },
  { label: 'Amber', color: '#fbbf24' },
  { label: 'Lime', color: '#a3e635' },
  { label: 'Cyan', color: '#22d3ee' },
  { label: 'Violet', color: '#a78bfa' },
  { label: 'Rose', color: '#fb7185' },
  { label: 'Orange', color: '#fb923c' },
  { label: 'Teal', color: '#2dd4bf' },
  { label: 'Sky', color: '#38bdf8' },
  { label: 'Fuchsia', color: '#e879f9' },
];
const SHAPE_SEQUENCE: SchulteShapeId[] = ['circle', 'triangle', 'square', 'diamond', 'hexagon'];

export type SchulteRng = () => number;

export const createSchulteRng = (seed: number): SchulteRng => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleInPlace = <T>(items: T[], rng: SchulteRng): T[] => {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const current = items[i];
    items[i] = items[j];
    items[j] = current;
  }
  return items;
};

const cellCount = (size: SchulteGridSize) => size * size;

const numberToken = (value: number): SchulteToken => ({
  kind: 'number',
  label: String(value),
  value,
});

const letterToken = (index: number): SchulteToken => {
  if (index < LETTERS.length) {
    const label = LETTERS[index];
    return { kind: 'letter', label, value: label };
  }
  const label = `${LETTERS[index % LETTERS.length]}${Math.floor(index / LETTERS.length) + 1}`;
  return { kind: 'letter', label, value: label };
};

const colorToken = (index: number): SchulteToken => {
  const swatch = COLOR_SEQUENCE[index % COLOR_SEQUENCE.length];
  const cycle = Math.floor(index / COLOR_SEQUENCE.length);
  const label = cycle === 0 ? swatch.label : `${swatch.label} ${cycle + 1}`;
  return { kind: 'color', label, value: index + 1, color: swatch.color };
};

const shapeToken = (index: number): SchulteToken => {
  const shape = SHAPE_SEQUENCE[index % SHAPE_SEQUENCE.length];
  const cycle = Math.floor(index / SHAPE_SEQUENCE.length);
  const label = cycle === 0 ? shape : `${shape} ${cycle + 1}`;
  return { kind: 'shape', label, value: index + 1, shape };
};

const sportToken = (index: number, symbols: string[]): SchulteToken => {
  if (symbols.length === 0) {
    return letterToken(index);
  }
  const symbol = symbols[index % symbols.length];
  const cycle = Math.floor(index / symbols.length);
  const label = cycle === 0 ? symbol : `${symbol} ${cycle + 1}`;
  return { kind: 'sport', label, value: index + 1, sportSymbol: symbol };
};

const buildTokens = (config: SchulteBoardConfig): SchulteToken[] => {
  const count = cellCount(config.gridSize);
  const symbols = config.sportSymbols ?? [];
  if (config.stimulusSet === 'mixed' || config.sequenceRule === 'alternatingMixed') {
    const tokens: SchulteToken[] = [];
    for (let i = 0; i < count; i += 1) {
      tokens.push(i % 2 === 0 ? numberToken(Math.floor(i / 2) + 1) : letterToken(Math.floor(i / 2)));
    }
    return tokens;
  }
  if (config.stimulusSet === 'letters') {
    return Array.from({ length: count }, (_, index) => letterToken(index));
  }
  if (config.stimulusSet === 'colors') {
    return Array.from({ length: count }, (_, index) => colorToken(index));
  }
  if (config.stimulusSet === 'shapes') {
    return Array.from({ length: count }, (_, index) => shapeToken(index));
  }
  if (config.stimulusSet === 'sportSymbols') {
    return Array.from({ length: count }, (_, index) => sportToken(index, symbols));
  }
  return Array.from({ length: count }, (_, index) => numberToken(index + 1));
};

const isOddNumberToken = (token: SchulteToken) =>
  token.kind === 'number' && typeof token.value === 'number' && token.value % 2 === 1;

const isEvenNumberToken = (token: SchulteToken) =>
  token.kind === 'number' && typeof token.value === 'number' && token.value % 2 === 0;

const compareTokens = (a: SchulteToken, b: SchulteToken) => {
  if (typeof a.value === 'number' && typeof b.value === 'number') {
    return a.value - b.value;
  }
  return String(a.value).localeCompare(String(b.value));
};

export const getRequiredSequence = (
  tokens: SchulteToken[],
  rule: SchulteSequenceRule,
): SchulteToken[] => {
  if (rule === 'odd') {
    return tokens.filter(isOddNumberToken).sort(compareTokens);
  }
  if (rule === 'even') {
    return tokens.filter(isEvenNumberToken).sort(compareTokens);
  }
  if (rule === 'alternatingMixed') {
    const numbers = tokens.filter(token => token.kind === 'number').sort(compareTokens);
    const letters = tokens.filter(token => token.kind === 'letter').sort(compareTokens);
    const interleaved: SchulteToken[] = [];
    const length = Math.max(numbers.length, letters.length);
    for (let i = 0; i < length; i += 1) {
      if (numbers[i]) interleaved.push(numbers[i]);
      if (letters[i]) interleaved.push(letters[i]);
    }
    return interleaved;
  }
  const ordered = [...tokens].sort(compareTokens);
  return rule === 'descending' ? ordered.reverse() : ordered;
};

export const getSchultePrompt = (config: SchulteBoardConfig): string => {
  if (config.sequenceRule === 'odd') return 'Tap odd numbers in order.';
  if (config.sequenceRule === 'even') return 'Tap even numbers in order.';
  if (config.sequenceRule === 'alternatingMixed') return 'Tap number, letter, number, letter.';
  if (config.sequenceRule === 'descending') return 'Tap the sequence from last to first.';
  if (config.stimulusSet === 'colors') return 'Tap colors in rainbow order.';
  if (config.stimulusSet === 'shapes') return 'Tap shapes in order.';
  if (config.stimulusSet === 'letters') return 'Tap letters in order.';
  return 'Find the signal inside the noise.';
};

export const getCenterCellCoord = (size: SchulteGridSize) => {
  const mid = Math.floor(size / 2);
  return { row: mid, col: mid };
};

const initialPhase = (config: SchulteBoardConfig): SchulteBoardPhase =>
  config.variant === 'flash' ? 'flashPreview' : 'visible';

export const generateSchulteBoard = (
  config: SchulteBoardConfig,
  nowMs: number,
  rng: SchulteRng = Math.random,
): SchulteBoard => {
  const size = config.gridSize;
  const tokens = buildTokens(config);
  const required = getRequiredSequence(tokens, config.sequenceRule);
  const sequenceKey = (token: SchulteToken) => `${token.kind}:${String(token.value)}:${token.label}`;
  const sequenceLookup = new Map(required.map((token, index) => [sequenceKey(token), index]));
  const positions = shuffleInPlace(
    Array.from({ length: cellCount(size) }, (_, index) => ({
      row: Math.floor(index / size),
      col: index % size,
    })),
    rng,
  );

  const cells: SchulteCell[] = tokens.map((token, index) => {
    const position = positions[index];
    return {
      id: `schulte-${nowMs}-${index}-${position.row}-${position.col}`,
      row: position.row,
      col: position.col,
      token,
      sequenceIndex: sequenceLookup.get(sequenceKey(token)) ?? -1,
      found: false,
    };
  });

  const flashMs = config.flashMs ?? DEFAULT_SCHULTE_FLASH_MS;
  return {
    config,
    cells,
    nextIndex: 0,
    sequenceLength: required.length,
    phase: initialPhase(config),
    startedAtMs: nowMs,
    lastCorrectAtMs: null,
    lockedUntilMs: 0,
    flashUntilMs: config.variant === 'flash' ? nowMs + flashMs : 0,
    transitionsMs: [],
    correct: 0,
    errors: 0,
  };
};

export const tickSchulteBoard = (board: SchulteBoard, nowMs: number): SchulteBoard => {
  if (board.phase !== 'flashPreview' || nowMs < board.flashUntilMs) {
    return board;
  }
  return { ...board, phase: 'flashHidden' };
};

export const shuffleRemainingCells = (board: SchulteBoard, rng: SchulteRng = Math.random): SchulteBoard => {
  const remaining = board.cells.filter(cell => !cell.found);
  const positions = shuffleInPlace(
    remaining.map(cell => ({ row: cell.row, col: cell.col })),
    rng,
  );
  let cursor = 0;
  const cells = board.cells.map(cell => {
    if (cell.found) return cell;
    const position = positions[cursor];
    cursor += 1;
    return { ...cell, row: position.row, col: position.col };
  });
  return { ...board, cells };
};

export const selectSchulteCell = (
  board: SchulteBoard,
  cellId: string,
  nowMs: number,
  rng: SchulteRng = Math.random,
): { board: SchulteBoard; outcome: SchulteSelectOutcome } => {
  if (board.phase === 'complete') {
    return { board, outcome: 'ignored' };
  }
  if (board.phase === 'flashPreview') {
    return { board, outcome: 'locked' };
  }
  if (nowMs < board.lockedUntilMs) {
    return { board, outcome: 'locked' };
  }

  const cell = board.cells.find(item => item.id === cellId);
  if (!cell || cell.found) {
    return { board, outcome: 'ignored' };
  }

  const isCorrect = cell.sequenceIndex === board.nextIndex;
  if (!isCorrect) {
    const penalty = board.config.errorPenaltyMs ?? DEFAULT_SCHULTE_ERROR_PENALTY_MS;
    return {
      board: {
        ...board,
        errors: board.errors + 1,
        lockedUntilMs: nowMs + penalty,
      },
      outcome: 'error',
    };
  }

  const transitionMs = board.lastCorrectAtMs === null ? nowMs - board.startedAtMs : nowMs - board.lastCorrectAtMs;
  const nextIndex = board.nextIndex + 1;
  const cells = board.cells.map(item => (item.id === cellId ? { ...item, found: true } : item));
  let nextBoard: SchulteBoard = {
    ...board,
    cells,
    nextIndex,
    lastCorrectAtMs: nowMs,
    transitionsMs: [...board.transitionsMs, Math.max(0, transitionMs)],
    correct: board.correct + 1,
  };

  if (nextIndex >= board.sequenceLength) {
    return { board: { ...nextBoard, phase: 'complete' }, outcome: 'complete' };
  }

  if (board.config.variant === 'shuffle') {
    nextBoard = shuffleRemainingCells(nextBoard, rng);
  }

  return { board: nextBoard, outcome: 'correct' };
};

const average = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

export const deriveSchulteMetrics = ({
  accumulator,
  endedAtMs,
  completionStatus,
}: {
  accumulator: SchulteRoundAccumulator;
  endedAtMs: number;
  completionStatus?: SchulteCompletionStatus;
}): SchulteScanMetrics => {
  const transitions = accumulator.transitionsMs;
  const attempts = accumulator.correct + accumulator.errors;
  const firstSlice = transitions.slice(0, Math.max(1, Math.floor(transitions.length / 4)));
  const lastSlice = transitions.slice(Math.max(0, transitions.length - Math.max(1, Math.floor(transitions.length / 4))));
  const firstAvg = average(firstSlice);
  const lastAvg = average(lastSlice);
  const status: SchulteCompletionStatus =
    completionStatus ??
    (accumulator.boardsCompleted > 0 ? 'completed' : accumulator.correct > 0 ? 'partial' : 'timeout');

  return {
    gridSize: accumulator.lastConfig.gridSize,
    variant: accumulator.lastConfig.variant,
    stimulusSet: accumulator.lastConfig.stimulusSet,
    sequenceRule: accumulator.lastConfig.sequenceRule,
    boardsCompleted: accumulator.boardsCompleted,
    completionTimeMs: Math.max(0, endedAtMs - accumulator.startedAtMs),
    correctSelections: accumulator.correct,
    errors: accumulator.errors,
    accuracyPct: attempts > 0 ? Math.round((accumulator.correct / attempts) * 100) : 0,
    averageTransitionMs: average(transitions),
    fastestTransitionMs: transitions.length > 0 ? Math.min(...transitions) : null,
    slowestTransitionMs: transitions.length > 0 ? Math.max(...transitions) : null,
    lateRoundSlowdownMs:
      firstAvg === null || lastAvg === null || transitions.length < 4 ? null : lastAvg - firstAvg,
    completionStatus: status,
  };
};

export const createSchulteAccumulator = (
  config: SchulteBoardConfig,
  startedAtMs: number,
): SchulteRoundAccumulator => ({
  startedAtMs,
  boardsCompleted: 0,
  correct: 0,
  errors: 0,
  transitionsMs: [],
  lastConfig: config,
});

export const absorbSchulteBoard = (
  accumulator: SchulteRoundAccumulator,
  board: SchulteBoard,
  completed: boolean,
): SchulteRoundAccumulator => ({
  startedAtMs: accumulator.startedAtMs,
  boardsCompleted: accumulator.boardsCompleted + (completed ? 1 : 0),
  correct: accumulator.correct + board.correct,
  errors: accumulator.errors + board.errors,
  transitionsMs: [...accumulator.transitionsMs, ...board.transitionsMs],
  lastConfig: board.config,
});

export const validateSchulteSequence = (board: SchulteBoard): string[] => {
  const errors: string[] = [];
  const inSequence = board.cells
    .filter(cell => cell.sequenceIndex >= 0)
    .sort((a, b) => a.sequenceIndex - b.sequenceIndex);
  if (inSequence.length !== board.sequenceLength) {
    errors.push('sequence length does not match indexed cells');
  }
  inSequence.forEach((cell, index) => {
    if (cell.sequenceIndex !== index) {
      errors.push(`sequence hole at ${index}`);
    }
  });
  const seen = new Set<string>();
  board.cells.forEach(cell => {
    const key = `${cell.row}:${cell.col}`;
    if (seen.has(key)) errors.push(`duplicate position ${key}`);
    seen.add(key);
  });
  if (seen.size !== board.cells.length) {
    errors.push('cell count does not match unique positions');
  }
  return errors;
};
