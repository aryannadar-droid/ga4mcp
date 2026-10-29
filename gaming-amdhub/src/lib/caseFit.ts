import { caseFit, type BoardSize } from '../content';

export interface CaseDims {
  h: number;
  w: number;
  d: number;
}

export interface FitLine {
  part: 'board' | 'gpu' | 'cooler';
  ok: boolean;
  /** mm of room left (positive) or overrun (negative). */
  margin: number;
}

export interface FitResult {
  ok: boolean;
  lines: FitLine[];
  /** Largest standard board this case physically takes. */
  maxBoard: BoardSize | null;
}

const order: BoardSize[] = ['itx', 'matx', 'atx'];
export const boardSpec = (id: BoardSize) => caseFit.boards.find((b) => b.id === id)!;

function boardMargin(dims: CaseDims, board: BoardSize) {
  const b = boardSpec(board);
  const { boardVertical, boardDepth } = caseFit.clearance;
  return Math.min(dims.h - boardVertical - b.h, dims.d - boardDepth - b.w);
}

/** The case takes a board when both its height and depth leave the clearance. */
export function largestBoard(dims: CaseDims): BoardSize | null {
  return [...order].reverse().find((b) => boardMargin(dims, b) >= 0) ?? null;
}

export function checkCaseFit(dims: CaseDims, board: BoardSize, sizes = caseFit.partSizes): FitResult {
  const { gpuFront, coolerSide } = caseFit.clearance;
  const line = (part: FitLine['part'], margin: number): FitLine => ({ part, margin, ok: margin >= 0 });
  const lines = [
    line('board', boardMargin(dims, board)),
    line('gpu', dims.d - gpuFront - sizes.gpuLengthMm),
    line('cooler', dims.w - coolerSide - sizes.coolerHeightMm),
  ];
  return { ok: lines.every((l) => l.ok), lines, maxBoard: largestBoard(dims) };
}

export const litres = (d: CaseDims) => (d.h * d.w * d.d) / 1e6;
