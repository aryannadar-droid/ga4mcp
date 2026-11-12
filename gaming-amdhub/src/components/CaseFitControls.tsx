import { useEffect, useState } from 'react';
import { caseFit, configurator as C, type BoardSize } from '../content';
import type { CaseDims, FitLine, FitResult } from '../lib/caseFit';
import { CheckIcon, CloseIcon } from './Icons';

interface Props {
  caseId: string;
  dims: CaseDims;
  board: BoardSize;
  onCase: (caseId: string, dims: CaseDims) => void;
  onBoard: (b: BoardSize) => void;
}

/**
 * "Select case": recommended sizes as cards (like choosing a dock), or "My case" with
 * height / width / depth in mm. Plus motherboard size. The 3D case reshapes live.
 */
export function CaseControls({ caseId, dims, board, onCase, onBoard }: Props) {
  const custom = caseId === 'custom';
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {caseFit.presets.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={caseId === p.id}
            onClick={() => onCase(p.id, { h: p.h, w: p.w, d: p.d })}
            className={`rounded-xl border p-3 text-left transition-colors ${caseId === p.id ? 'border-accent bg-raised' : 'border-line hover:border-muted'}`}
          >
            <span className="flex flex-wrap items-center justify-between gap-x-2 text-sm font-semibold">
              {p.label}
              {p.id === caseFit.recommendedId && <span className="text-[11px] font-medium text-gold-soft">{caseFit.recommendedTag}</span>}
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              {p.h} × {p.w} × {p.d} {caseFit.unit}
            </span>
          </button>
        ))}
        <button
          type="button"
          aria-pressed={custom}
          onClick={() => onCase('custom', dims)}
          className={`rounded-xl border p-3 text-left transition-colors ${custom ? 'border-accent bg-raised' : 'border-dashed border-line hover:border-muted'}`}
        >
          <span className="block text-sm font-semibold">{C.caseCustom}</span>
          <span className="mt-0.5 block text-xs text-muted">{caseFit.dims.h.label}, {caseFit.dims.w.label.toLowerCase()}, {caseFit.dims.d.label.toLowerCase()}</span>
        </button>
      </div>
      {custom && (
        <div className="mt-4 space-y-4 rounded-xl border border-line p-4">
          {(['h', 'w', 'd'] as const).map((k) => (
            <DimField key={k} k={k} value={dims[k]} onChange={(v) => onCase('custom', { ...dims, [k]: v })} />
          ))}
        </div>
      )}
      <p className="mt-5 mb-2 text-sm font-medium">{caseFit.boardLabel}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={caseFit.boardLabel}>
        {caseFit.boards.map((b) => (
          <button key={b.id} type="button" className="chip min-h-9 text-xs sm:text-sm" aria-pressed={board === b.id} onClick={() => onBoard(b.id)}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Slider + number box for one case dimension (mm). */
export function DimField({ k, value, onChange }: { k: 'h' | 'w' | 'd'; value: number; onChange: (v: number) => void }) {
  const spec = caseFit.dims[k];
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = (raw: string) => {
    const n = Math.round(Number(raw));
    if (Number.isFinite(n)) onChange(Math.min(spec.max, Math.max(spec.min, n)));
    else setText(String(value));
  };
  const id = `case-${k}`;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm text-muted">
          {spec.label}
        </label>
        <span className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            aria-label={`${spec.label} in ${caseFit.unit}`}
            min={spec.min}
            max={spec.max}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)}
            className="placeholder-val h-9 w-20 rounded-lg border border-line bg-raised px-2 text-right text-sm text-fg"
          />
          <span className="text-xs text-muted">{caseFit.unit}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={spec.min}
        max={spec.max}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--orange)]"
      />
    </div>
  );
}

export function FitList({ fit, skip = [] }: { fit: FitResult; skip?: FitLine['part'][] }) {
  const lines = fit.lines.filter((l) => !skip.includes(l.part));
  const ok = lines.every((l) => l.ok);
  const r = caseFit.results;
  return (
    <div className="mt-4 rounded-2xl border border-line bg-surface p-4 sm:p-5" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-display text-lg font-semibold">{caseFit.checkTitle}</h3>
        <span className={`text-sm font-semibold ${ok ? 'text-fg' : 'text-accent'}`}>{ok ? r.allGood : r.issues}</span>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {lines.map((l) => (
          <li key={l.part} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${l.ok ? 'bg-accent text-ink' : 'border-2 border-accent text-accent'}`}
              aria-hidden
            >
              {l.ok ? <CheckIcon width={13} height={13} strokeWidth={3} /> : <CloseIcon width={12} height={12} strokeWidth={3} />}
            </span>
            <span>
              {l.ok ? r[l.part].ok : r[l.part].no}
              <span className="text-muted">
                {' '}
                · {Math.abs(l.margin)} {caseFit.unit} {l.ok ? r.room : r.over}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{caseFit.partSizesNote}</p>
    </div>
  );
}

