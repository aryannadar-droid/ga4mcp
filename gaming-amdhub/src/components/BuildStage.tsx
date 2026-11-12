import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { m } from 'framer-motion';
import { caseFit, type BoardSize } from '../content';
import type { CaseDims, FitResult } from '../lib/caseFit';
import { DUR, EASE } from '../lib/motion';
import { webglTier } from '../lib/webgl';
import type { SceneMode, ViewerApi } from '../three/BuildViewport3D';
import type { PartId } from '../three/pcModel';

/** three.js + the case model download only when `load` turns true (section about a screen away). */
const BuildViewport3D = lazy(() => import('../three/BuildViewport3D'));

interface Props {
  load: boolean;
  dims: CaseDims;
  board: BoardSize;
  fit: FitResult;
  present: Record<PartId, boolean>;
  gpuLabel: string;
  psuLabel: string;
  mode?: SceneMode;
  label?: string;
  onReady?: () => void;
  className?: string;
  /** Overlays inside the stage (tabs, chips, toggles). */
  children?: ReactNode;
}

/** The 3D build stage shared by the homepage journey and the configurator. */
export function BuildStage({ load, dims, board, fit, present, gpuLabel, psuLabel, mode = 'build', label, onReady, className = '', children }: Props) {
  const [tier] = useState(webglTier);
  const [optIn, setOptIn] = useState(false);
  const webgl = tier === 'hardware' || (tier === 'software' && optIn);
  const [ready, setReady] = useState(false);
  // start 3D once the browser is idle, so it never competes with first paint
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!load || idle) return;
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) {
      const id = ric(() => setIdle(true), { timeout: 1500 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setIdle(true), 300);
    return () => window.clearTimeout(id);
  }, [load, idle]);
  const [glass, setGlass] = useState(true);
  const [interactive, setInteractive] = useState(false);
  const apiRef = useRef<ViewerApi | null>(null);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-line ${className}`}
      style={{ background: 'radial-gradient(70% 55% at 40% 45%, color-mix(in srgb, var(--orange) 12%, #121215), #0b0b0d 75%)' }}
    >
      {webgl && load && idle ? (
        <Suspense fallback={<StaticFallback present={present} loading />}>
          <BuildViewport3D
            dims={dims}
            board={board}
            fit={fit}
            present={present}
            gpuLabel={gpuLabel}
            psuLabel={psuLabel}
            glass={glass}
            mode={mode}
            label={label}
            interactive={interactive}
            apiRef={apiRef}
            onReady={() => {
              setReady(true);
              onReady?.();
            }}
          />
        </Suspense>
      ) : (
        <StaticFallback present={present} />
      )}
      {tier === 'software' && !optIn && (
        // no graphics hardware for WebGL: the flat drawing stays unless the visitor asks for 3D
        <button type="button" className="btn btn-ghost absolute top-3 left-1/2 min-h-10 -translate-x-1/2 bg-ink/80 text-sm" onClick={() => setOptIn(true)}>
          {caseFit.show3d}
        </button>
      )}

      {webgl && ready && (
        <>
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <IconBtn label={caseFit.zoomIn} onClick={() => apiRef.current?.zoom(0.85)}>
              +
            </IconBtn>
            <IconBtn label={caseFit.zoomOut} onClick={() => apiRef.current?.zoom(1.18)}>
              −
            </IconBtn>
            <IconBtn label={caseFit.reset} onClick={() => apiRef.current?.reset()}>
              ⟲
            </IconBtn>
          </div>
          <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
            <button type="button" className={`chip min-h-9 text-xs backdrop-blur ${glass ? '' : 'bg-ink/70'}`} aria-pressed={glass} onClick={() => setGlass((g) => !g)}>
              {caseFit.glass}
            </button>
            {/* touch screens opt in to rotation so the page keeps scrolling */}
            <button
              type="button"
              className={`chip min-h-9 text-xs backdrop-blur [@media(pointer:fine)]:hidden ${interactive ? '' : 'bg-ink/70'}`}
              aria-pressed={interactive}
              onClick={() => setInteractive((v) => !v)}
            >
              {interactive ? caseFit.interactDone : caseFit.interact}
            </button>
          </div>
        </>
      )}
      {children}
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-10 items-center justify-center rounded-full border border-line bg-ink/70 text-lg leading-none text-fg backdrop-blur transition-colors hover:border-accent"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}

function StaticFallback({ present, loading = false }: { present: Record<PartId, boolean>; loading?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
      <PcSilhouette present={present} />
      {loading && (
        <p role="status" className="mt-3 text-xs text-muted">
          {caseFit.loading}
        </p>
      )}
    </div>
  );
}

/** Flat PC outline (no-WebGL fallback); present parts sit in their slots. */
function PcSilhouette({ present }: { present: Record<PartId, boolean> }) {
  const part = (id: PartId) => ({
    initial: false as const,
    animate: present[id] ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 },
    transition: { duration: DUR.base, ease: EASE },
  });
  const stroke = 'var(--orange)';
  return (
    <svg viewBox="0 0 320 360" className="mx-auto w-full max-w-[300px]" role="img" aria-label={`PC build, ${Object.values(present).filter(Boolean).length} of 6 parts placed`}>
      <rect x="20" y="10" width="280" height="340" rx="18" fill="#111114" stroke="#33333a" strokeWidth="2" />
      <rect x="36" y="26" width="248" height="308" rx="10" fill="none" stroke="#24242a" strokeDasharray="4 6" />
      <m.g {...part('board')}>
        <rect x="56" y="40" width="190" height="200" rx="6" fill="#18181c" stroke="#3a3a42" />
        <path d="M70 60h40M70 72h28M200 210h30" stroke="#2c2c33" strokeWidth="3" />
      </m.g>
      <m.g {...part('cpu')}>
        <rect x="120" y="70" width="56" height="56" rx="6" fill="#2a2a30" stroke={stroke} strokeWidth="2" />
        <rect x="134" y="84" width="28" height="28" rx="3" fill="color-mix(in srgb, var(--orange) 35%, #222)" />
      </m.g>
      <m.g {...part('ram')}>
        <rect x="196" y="58" width="8" height="84" rx="2" fill="#2a2a30" stroke={stroke} />
        <rect x="210" y="58" width="8" height="84" rx="2" fill="#2a2a30" stroke={stroke} />
      </m.g>
      <m.g {...part('gpu')}>
        <rect x="56" y="168" width="214" height="44" rx="6" fill="#222227" stroke={stroke} strokeWidth="2" />
        <circle cx="104" cy="190" r="14" fill="none" stroke="#4a4a52" strokeWidth="2" />
        <circle cx="160" cy="190" r="14" fill="none" stroke="#4a4a52" strokeWidth="2" />
        <rect x="200" y="182" width="56" height="16" rx="3" fill="color-mix(in srgb, var(--orange) 30%, #1a1a1d)" />
      </m.g>
      <m.g {...part('psu')}>
        <rect x="56" y="262" width="120" height="58" rx="6" fill="#1d1d22" stroke={stroke} strokeWidth="2" />
        <circle cx="116" cy="291" r="18" fill="none" stroke="#4a4a52" strokeWidth="2" />
      </m.g>
    </svg>
  );
}
