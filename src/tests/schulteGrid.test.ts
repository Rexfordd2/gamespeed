import { describe, expect, it } from 'vitest';
import {
  absorbSchulteBoard,
  createSchulteAccumulator,
  createSchulteRng,
  deriveSchulteMetrics,
  generateSchulteBoard,
  getRequiredSequence,
  getSchultePrompt,
  selectSchulteCell,
  shuffleRemainingCells,
  tickSchulteBoard,
  validateSchulteSequence,
} from '../utils/schulteGrid';
import { SchulteBoardConfig } from '../types/schulte';
import { getAnimalInstinct } from '../config/animalInstincts';
import { getSchulteConfigForBoard } from '../modes/schulteScan';

const numbersStatic = (size: 3 | 4 | 5 | 6 | 7 = 3): SchulteBoardConfig => ({
  gridSize: size,
  stimulusSet: 'numbers',
  sequenceRule: 'ascending',
  variant: 'static',
  errorPenaltyMs: 50,
});

const playSequence = (boardStart: ReturnType<typeof generateSchulteBoard>, now = 1_000) => {
  let board = boardStart;
  const ordered = board.cells
    .filter(cell => cell.sequenceIndex >= 0)
    .sort((a, b) => a.sequenceIndex - b.sequenceIndex);
  ordered.forEach((cell, index) => {
    now += 100;
    const result = selectSchulteCell(board, cell.id, now, createSchulteRng(index + 1));
    board = result.board;
    expect(result.outcome === 'correct' || result.outcome === 'complete').toBe(true);
  });
  return board;
};

describe('schulte grid engine', () => {
  it('generates 3x3 through 7x7 boards with unique cells and a valid sequence', () => {
    ([3, 4, 5, 6, 7] as const).forEach(size => {
      const board = generateSchulteBoard(numbersStatic(size), 10, createSchulteRng(size));
      expect(board.cells).toHaveLength(size * size);
      expect(validateSchulteSequence(board)).toEqual([]);
      expect(board.sequenceLength).toBe(size * size);
    });
  });

  it('builds number, letter, mixed, color, and shape stimulus sets', () => {
    const letter = generateSchulteBoard(
      { gridSize: 4, stimulusSet: 'letters', sequenceRule: 'ascending', variant: 'static' },
      1,
      createSchulteRng(2),
    );
    expect(letter.cells.every(cell => cell.token.kind === 'letter')).toBe(true);

    const mixed = generateSchulteBoard(
      { gridSize: 4, stimulusSet: 'mixed', sequenceRule: 'alternatingMixed', variant: 'static' },
      1,
      createSchulteRng(3),
    );
    const mixedSeq = getRequiredSequence(
      mixed.cells.map(cell => cell.token),
      'alternatingMixed',
    );
    expect(mixedSeq[0].kind).toBe('number');
    expect(mixedSeq[1].kind).toBe('letter');

    const colors = generateSchulteBoard(
      { gridSize: 3, stimulusSet: 'colors', sequenceRule: 'ascending', variant: 'static' },
      1,
      createSchulteRng(4),
    );
    expect(colors.cells.every(cell => cell.token.kind === 'color' && cell.token.color)).toBe(true);

    const shapes = generateSchulteBoard(
      { gridSize: 3, stimulusSet: 'shapes', sequenceRule: 'ascending', variant: 'static' },
      1,
      createSchulteRng(5),
    );
    expect(shapes.cells.every(cell => cell.token.kind === 'shape' && cell.token.shape)).toBe(true);
  });

  it('keeps sport-symbol architecture available without requiring a pack', () => {
    const fallback = generateSchulteBoard(
      { gridSize: 3, stimulusSet: 'sportSymbols', sequenceRule: 'ascending', variant: 'static' },
      1,
      createSchulteRng(6),
    );
    expect(fallback.cells.length).toBe(9);
    const withSymbols = generateSchulteBoard(
      {
        gridSize: 3,
        stimulusSet: 'sportSymbols',
        sequenceRule: 'ascending',
        variant: 'static',
        sportSymbols: ['lane', 'press', 'gap'],
      },
      1,
      createSchulteRng(7),
    );
    expect(withSymbols.cells.some(cell => cell.token.kind === 'sport')).toBe(true);
  });

  it('validates odd/even sequences and treats other cells as noise', () => {
    const board = generateSchulteBoard(
      { gridSize: 3, stimulusSet: 'numbers', sequenceRule: 'odd', variant: 'static' },
      20,
      createSchulteRng(8),
    );
    const required = board.cells.filter(cell => cell.sequenceIndex >= 0);
    expect(required.every(cell => Number(cell.token.value) % 2 === 1)).toBe(true);
    expect(board.cells.some(cell => cell.sequenceIndex < 0)).toBe(true);
  });

  it('counts errors without advancing and completes a clean static board', () => {
    const board = generateSchulteBoard(numbersStatic(3), 100, createSchulteRng(9));
    const first = board.cells.find(cell => cell.sequenceIndex === 0);
    const wrong = board.cells.find(cell => cell.sequenceIndex === 2);
    if (!first || !wrong) throw new Error('expected cells');
    const miss = selectSchulteCell(board, wrong.id, 150);
    expect(miss.outcome).toBe('error');
    expect(miss.board.nextIndex).toBe(0);
    expect(miss.board.errors).toBe(1);
    const locked = selectSchulteCell(miss.board, first.id, 160);
    expect(locked.outcome).toBe('locked');
    const completed = playSequence(miss.board, 300);
    expect(completed.phase).toBe('complete');
    expect(completed.correct).toBe(9);
  });

  it('shuffles remaining cells after a correct tap', () => {
    const start = generateSchulteBoard(
      { gridSize: 3, stimulusSet: 'numbers', sequenceRule: 'ascending', variant: 'shuffle' },
      1,
      createSchulteRng(11),
    );
    const first = start.cells.find(cell => cell.sequenceIndex === 0);
    if (!first) throw new Error('missing first cell');
    const after = selectSchulteCell(start, first.id, 50, createSchulteRng(99));
    expect(after.outcome).toBe('correct');
    const remainingBefore = start.cells.filter(cell => cell.sequenceIndex > 0);
    const remainingAfter = after.board.cells.filter(cell => !cell.found);
    const moved = remainingBefore.some(cell => {
      const next = remainingAfter.find(item => item.id === cell.id);
      return next && (next.row !== cell.row || next.col !== cell.col);
    });
    expect(moved).toBe(true);
    expect(shuffleRemainingCells(after.board, createSchulteRng(4)).cells).toHaveLength(9);
  });

  it('hides flash boards after the preview window, then still accepts the remembered order', () => {
    const start = generateSchulteBoard(
      {
        gridSize: 3,
        stimulusSet: 'numbers',
        sequenceRule: 'ascending',
        variant: 'flash',
        flashMs: 200,
      },
      1_000,
      createSchulteRng(12),
    );
    expect(start.phase).toBe('flashPreview');
    const first = start.cells.find(cell => cell.sequenceIndex === 0);
    if (!first) throw new Error('missing first cell');
    expect(selectSchulteCell(start, first.id, 1_050).outcome).toBe('locked');
    const hidden = tickSchulteBoard(start, 1_250);
    expect(hidden.phase).toBe('flashHidden');
    const completed = playSequence(hidden, 1_300);
    expect(completed.phase).toBe('complete');
  });

  it('captures transition metrics without invented visual-processing scores', () => {
    const config = numbersStatic(3);
    const board = playSequence(generateSchulteBoard(config, 0, createSchulteRng(13)), 0);
    const metrics = deriveSchulteMetrics({
      accumulator: absorbSchulteBoard(createSchulteAccumulator(config, 0), board, true),
      endedAtMs: 2_000,
    });
    expect(metrics.boardsCompleted).toBe(1);
    expect(metrics.correctSelections).toBe(9);
    expect(metrics.errors).toBe(0);
    expect(metrics.accuracyPct).toBe(100);
    expect(metrics.averageTransitionMs).toBeGreaterThan(0);
    expect(metrics.fastestTransitionMs).toBeGreaterThan(0);
    expect(metrics.slowestTransitionMs).toBeGreaterThan(0);
    expect(metrics.completionStatus).toBe('completed');
    expect(metrics).not.toHaveProperty('visualProcessingScore');
  });

  it('keeps Macaw Scan copy centralized and Prime-ready', () => {
    expect(getAnimalInstinct('schulteScan').experienceName).toBe('Macaw Scan');
    expect(getAnimalInstinct('schulteScan').tagline).toContain('signal inside the noise');
    expect(getSchulteConfigForBoard(0).variant).toBe('static');
    expect(getSchulteConfigForBoard(2).variant).toBe('shuffle');
    expect(getSchulteConfigForBoard(0, { prime: true }).gridSize).toBe(4);
    expect(getSchulteConfigForBoard(0, { prime: true }).variant).toBe('static');
    expect(getSchulteConfigForBoard(1, { prime: true }).variant).toBe('shuffle');
    expect(getSchultePrompt(numbersStatic(4))).toContain('signal inside the noise');
  });
});
