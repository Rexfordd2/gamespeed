import { SchulteBoard, SchulteCell, SchulteToken } from '../types/schulte';
import { getCenterCellCoord, getSchultePrompt } from '../utils/schulteGrid';

interface SchulteGridBoardProps {
  board: SchulteBoard;
  disabled?: boolean;
  reducedMotion?: boolean;
  lowStimulus?: boolean;
  accentColor: string;
  textColor: string;
  onSelectCell: (cellId: string) => void;
}

const ShapeMark = ({ token, color }: { token: SchulteToken; color: string }) => {
  const common = { width: '42%', height: '42%' };
  if (token.shape === 'triangle') {
    return (
      <span
        aria-hidden="true"
        style={{
          width: 0,
          height: 0,
          borderLeft: '0.55rem solid transparent',
          borderRight: '0.55rem solid transparent',
          borderBottom: `0.95rem solid ${color}`,
        }}
      />
    );
  }
  if (token.shape === 'diamond') {
    return (
      <span
        aria-hidden="true"
        className="block"
        style={{ ...common, backgroundColor: color, transform: 'rotate(45deg)', borderRadius: 2 }}
      />
    );
  }
  if (token.shape === 'hexagon') {
    return (
      <span
        aria-hidden="true"
        className="block"
        style={{
          ...common,
          backgroundColor: color,
          clipPath: 'polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0 50%)',
        }}
      />
    );
  }
  if (token.shape === 'square') {
    return <span aria-hidden="true" className="block rounded-[3px]" style={{ ...common, backgroundColor: color }} />;
  }
  return <span aria-hidden="true" className="block rounded-full" style={{ ...common, backgroundColor: color }} />;
};

const cellVisual = (cell: SchulteCell, textColor: string, accentColor: string, labelsHidden: boolean) => {
  if (cell.found) {
    return { background: 'rgba(2, 8, 12, 0.35)', border: `${accentColor}22`, label: '' };
  }
  if (cell.token.kind === 'color') {
    return {
      background: labelsHidden ? 'rgba(6, 12, 16, 0.82)' : `${cell.token.color ?? accentColor}33`,
      border: cell.token.color ?? accentColor,
      label: labelsHidden ? '' : cell.token.label,
    };
  }
  return {
    background: 'rgba(6, 12, 16, 0.82)',
    border: `${accentColor}66`,
    label: labelsHidden ? '' : cell.token.label,
    color: textColor,
  };
};

export const SchulteGridBoard = ({
  board,
  disabled = false,
  reducedMotion = false,
  lowStimulus = false,
  accentColor,
  textColor,
  onSelectCell,
}: SchulteGridBoardProps) => {
  const size = board.config.gridSize;
  const hideLabels = board.phase === 'flashHidden';
  const previewing = board.phase === 'flashPreview';
  const prompt = getSchultePrompt(board.config);
  const nextCell = board.cells.find(cell => cell.sequenceIndex === board.nextIndex && !cell.found);
  const center = getCenterCellCoord(size);
  const showFixation = board.config.variant === 'peripheral';

  return (
    <div className="absolute inset-0 z-[12] flex flex-col items-center justify-center px-3 pb-4 pt-2 sm:px-6">
      <p
        className="mb-2 max-w-[36rem] px-2 text-center text-[11px] uppercase tracking-[0.16em] sm:text-xs"
        style={{ color: textColor, opacity: 0.72 }}
      >
        {previewing ? 'Memorize the grid' : hideLabels ? 'Recall the order' : prompt}
      </p>
      {nextCell && !hideLabels && !previewing && (
        <p className="sr-only" aria-live="polite">
          Next signal {nextCell.token.label}
        </p>
      )}
      <div
        className="relative w-full"
        style={{
          maxWidth: 'min(100%, calc(100dvh - 11.5rem))',
          maxHeight: 'min(100%, calc(100dvh - 11.5rem))',
        }}
      >
        {showFixation && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: accentColor,
                boxShadow: lowStimulus ? 'none' : `0 0 18px ${accentColor}`,
                opacity: 0.85,
              }}
            />
          </div>
        )}
        <div
          role="grid"
          aria-label={`Macaw Scan ${size} by ${size} grid`}
          className="relative z-[2] grid w-full"
          style={{
            aspectRatio: '1 / 1',
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gap: size >= 6 ? 4 : 6,
          }}
        >
          {board.cells
            .slice()
            .sort((a, b) => a.row - b.row || a.col - b.col)
            .map(cell => {
              const visual = cellVisual(cell, textColor, accentColor, hideLabels);
              const isCenter = cell.row === center.row && cell.col === center.col;
              return (
                <button
                  key={cell.id}
                  type="button"
                  role="gridcell"
                  aria-label={
                    cell.found
                      ? `Cleared ${cell.token.label}`
                      : hideLabels
                        ? `Hidden cell row ${cell.row + 1} column ${cell.col + 1}`
                        : `Macaw Scan cell ${cell.token.label}`
                  }
                  aria-disabled={disabled || cell.found || previewing}
                  disabled={disabled || cell.found || previewing}
                  onClick={() => onSelectCell(cell.id)}
                  className="flex min-h-0 min-w-0 items-center justify-center rounded-xl font-extrabold tabular-nums touch-manipulation"
                  style={{
                    backgroundColor: visual.background,
                    border: `1px solid ${visual.border}`,
                    color: cell.token.color && !hideLabels && cell.token.kind === 'color' ? cell.token.color : textColor,
                    opacity: cell.found ? 0.35 : showFixation && !isCenter ? 0.92 : 1,
                    boxShadow:
                      lowStimulus || reducedMotion || cell.found
                        ? 'none'
                        : `0 8px 18px rgba(0,0,0,0.35)`,
                    transform: reducedMotion ? 'none' : undefined,
                    fontSize: size >= 6 ? 'clamp(0.7rem, 3.1vw, 1.05rem)' : 'clamp(0.95rem, 4.2vw, 1.45rem)',
                    lineHeight: 1,
                  }}
                >
                  {cell.token.kind === 'shape' && !hideLabels && !cell.found ? (
                    <ShapeMark token={cell.token} color={cell.token.color ?? accentColor} />
                  ) : (
                    visual.label
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
