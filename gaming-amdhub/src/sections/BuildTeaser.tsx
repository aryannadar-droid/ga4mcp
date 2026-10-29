import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { buildTeaser, caseFit, type BoardSize } from '../content';
import { track } from '../lib/analytics';
import { checkCaseFit, litres, type CaseDims } from '../lib/caseFit';
import { formatFps, formatRange } from '../lib/format';
import { DUR, EASE } from '../lib/motion';
import { Link } from '../lib/router';
import { useInView } from '../hooks/useInView';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ArrowRight, CheckIcon, CloseIcon } from '../components/Icons';
import { webglAvailable } from '../lib/webgl';
import type { ViewerApi } from '../three/BuildViewport3D';

/** three.js + the case model download only when this section is about a screen away. */
const BuildViewport3D = lazy(() => import('../three/BuildViewport3D'));

const STEP_MS = 480;
const total = buildTeaser.parts.length;
const recommended = caseFit.presets.find((p) => p.id === caseFit.recommendedId)!;

function sum(vals: (number | null)[]) {
  return vals.some((v) => v == null) ? null : (vals as number[]).reduce((a, b) => a + b, 0);
}

type Mode = 'recommended' | 'mine';

export function BuildTeaser() {
  const reduced = useReducedMotion();
  const [sectionRef, near] = useInView<HTMLElement>({ once: true, rootMargin: '700px 0px', threshold: 0 });
  const [stageRef, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.35 });
  const [webgl] = useState(webglAvailable);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);

  const [mode, setMode] = useState<Mode>('recommended');
  const [presetId, setPresetId] = useState(recommended.id);
  const [dims, setDims] = useState<CaseDims>({ h: recommended.h, w: recommended.w, d: recommended.d });
  const [board, setBoard] = useState<BoardSize>(caseFit.defaultBoard);
  const [glass, setGlass] = useState(true);
  const [interactive, setInteractive] = useState(false);
  const apiRef = useRef<ViewerApi | null>(null);

  const fit = useMemo(() => checkCaseFit(dims, board), [dims, board]);
  const shown = reduced ? total : step;

  // Parts snap in one by one, once, after the 3D stage (or the static fallback) is on screen.
  useEffect(() => {
    if (!inView || reduced || step >= total || (webgl && !ready)) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? 300 : STEP_MS);
    return () => window.clearTimeout(id);
  }, [inView, reduced, step, webgl, ready]);

  // compat_check once the visitor stops adjusting (not on first render)
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const id = window.setTimeout(
      () =>
        track('compat_check', {
          section: 'build_3d',
          product: 'case',
          case_mode: mode,
          case_h: dims.h,
          case_w: dims.w,
          case_d: dims.d,
          board,
          result: fit.ok ? 'fits' : 'no',
        }),
      900,
    );
    return () => window.clearTimeout(id);
  }, [dims, board, mode, fit.ok]);

  const placed = buildTeaser.parts.slice(0, shown);
  const range = formatRange(sum(placed.map((p) => p.min)), sum(placed.map((p) => p.max)));
  const fps = [...placed].reverse().find((p) => p.fps != null)?.fps ?? null;

  const pickPreset = (id: string) => {
    const p = caseFit.presets.find((x) => x.id === id)!;
    setPresetId(id);
    setDims({ h: p.h, w: p.w, d: p.d });
  };
  const switchMode = (m: Mode) => {
    setMode(m);
    if (m === 'recommended') pickPreset(presetId);
  };

  return (
    <section ref={sectionRef} id="build" aria-labelledby="build-title" className="py-16 sm:py-24">
      <div className="container-x">
        <div
          className="relative overflow-hidden rounded-3xl border border-line bg-[#0d0d0f] p-5 sm:p-8 lg:p-10"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)' }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
            {/* ---- heading (first on mobile) ---- */}
            <div className="lg:col-start-1 lg:row-start-1">
              <p className="eyebrow mb-3">{buildTeaser.eyebrow}</p>
              <h2 id="build-title" className="text-3xl leading-[1.08] font-semibold sm:text-4xl">
                {buildTeaser.title}
              </h2>
              <p className="mt-4 max-w-md text-muted">{buildTeaser.sub}</p>
            </div>

            {/* ---- 3D stage ---- */}
            <div className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-start">
              <div
                ref={stageRef}
                className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-line sm:aspect-[5/4] lg:aspect-[4/5]"
                style={{ background: 'radial-gradient(70% 55% at 40% 45%, color-mix(in srgb, var(--orange) 12%, #121215), #0b0b0d 75%)' }}
              >
                {webgl && near ? (
                  <Suspense fallback={<StaticFallback shown={shown} loading />}>
                    <BuildViewport3D
                      dims={dims}
                      board={board}
                      fit={fit}
                      shown={shown}
                      glass={glass}
                      interactive={interactive}
                      apiRef={apiRef}
                      onReady={() => setReady(true)}
                    />
                  </Suspense>
                ) : (
                  <StaticFallback shown={shown} />
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
                    <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2">
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
                      <span className="hidden text-xs text-muted [@media(pointer:fine)]:inline">{caseFit.hint}</span>
                    </div>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-muted">
                {dims.h} × {dims.w} × {dims.d} {caseFit.unit} · {litres(dims).toFixed(1)} {caseFit.litres}
              </p>
            </div>

            {/* ---- totals + parts ---- */}
            <div className="lg:col-start-1 lg:row-start-2">
              <dl className="grid grid-cols-2 gap-3" aria-live="polite">
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <dt className="text-xs text-muted">{buildTeaser.totalLabel}</dt>
                  <dd className="placeholder-val mt-1 font-display text-2xl font-bold sm:text-3xl">
                    <span className="text-heat-grad">{range}</span>
                  </dd>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <dt className="text-xs text-muted">
                    {buildTeaser.fpsLabel} · {buildTeaser.fpsGame}
                  </dt>
                  <dd className="placeholder-val mt-1 font-display text-2xl font-bold sm:text-3xl">{formatFps(fps)}</dd>
                </div>
              </dl>
              <ol className="mt-4 flex flex-wrap gap-2 text-xs">
                {buildTeaser.parts.map((p, i) => (
                  <li key={p.id} className={`rounded-full border px-3 py-1.5 ${i < shown ? 'border-accent text-fg' : 'border-dashed border-line text-muted'}`}>
                    {p.label}
                  </li>
                ))}
              </ol>
            </div>

            {/* ---- case controls + fit check ---- */}
            <div className="lg:col-start-1 lg:row-start-3">
              <CaseControls
                mode={mode}
                onMode={switchMode}
                presetId={presetId}
                onPreset={pickPreset}
                dims={dims}
                onDims={setDims}
                board={board}
                onBoard={setBoard}
              />
              <FitList fit={fit} />
              <Link
                href={buildTeaser.ctaHref}
                className="btn btn-primary mt-6 min-h-12 px-6 text-base"
                onClick={() => track('builder_start', { section: 'build_teaser' })}
              >
                {buildTeaser.cta}
                <ArrowRight width={18} height={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
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

interface ControlsProps {
  mode: Mode;
  onMode: (m: Mode) => void;
  presetId: string;
  onPreset: (id: string) => void;
  dims: CaseDims;
  onDims: (d: CaseDims) => void;
  board: BoardSize;
  onBoard: (b: BoardSize) => void;
}

function CaseControls({ mode, onMode, presetId, onPreset, dims, onDims, board, onBoard }: ControlsProps) {
  return (
    <fieldset className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <legend className="sr-only">{caseFit.caseTitle}</legend>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">{caseFit.caseTitle}</h3>
        <div className="inline-flex rounded-full border border-line p-1" role="group" aria-label={caseFit.caseTitle}>
          {(['recommended', 'mine'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => onMode(m)}
              className={`min-h-9 rounded-full px-3 text-xs font-semibold transition-colors sm:text-sm ${mode === m ? 'bg-accent text-ink' : 'text-fg'}`}
            >
              {caseFit.modes[m]}
            </button>
          ))}
        </div>
      </div>

      {mode === 'recommended' ? (
        <m.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: DUR.fast, ease: EASE }} className="mt-4 grid grid-cols-2 gap-2">
          {caseFit.presets.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={presetId === p.id}
              onClick={() => onPreset(p.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${presetId === p.id ? 'border-accent bg-raised' : 'border-line hover:border-muted'}`}
            >
              <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                {p.label}
                {p.id === caseFit.recommendedId && <span className="text-[11px] font-medium text-gold-soft">{caseFit.recommendedTag}</span>}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {p.h} × {p.w} × {p.d} {caseFit.unit}
              </span>
            </button>
          ))}
        </m.div>
      ) : (
        <m.div key="mine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: DUR.fast, ease: EASE }} className="mt-4 space-y-4">
          {(['h', 'w', 'd'] as const).map((k) => (
            <DimField key={k} k={k} value={dims[k]} onChange={(v) => onDims({ ...dims, [k]: v })} />
          ))}
        </m.div>
      )}

      <p className="mt-5 mb-2 text-sm font-medium">{caseFit.boardLabel}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={caseFit.boardLabel}>
        {caseFit.boards.map((b) => (
          <button key={b.id} type="button" className="chip min-h-9 text-xs sm:text-sm" aria-pressed={board === b.id} onClick={() => onBoard(b.id)}>
            {b.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Slider + number box for one case dimension (mm). */
function DimField({ k, value, onChange }: { k: 'h' | 'w' | 'd'; value: number; onChange: (v: number) => void }) {
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

function FitList({ fit }: { fit: ReturnType<typeof checkCaseFit> }) {
  const r = caseFit.results;
  return (
    <div className="mt-4 rounded-2xl border border-line bg-surface p-4 sm:p-5" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-display text-lg font-semibold">{caseFit.checkTitle}</h3>
        <span className={`text-sm font-semibold ${fit.ok ? 'text-fg' : 'text-gold-soft'}`}>{fit.ok ? r.allGood : r.issues}</span>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {fit.lines.map((l) => (
          <li key={l.part} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${l.ok ? 'bg-accent text-ink' : 'border border-[#ff5a5a] text-[#ff7a7a]'}`}
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

/* ------------------------------------------------------------------ */
/* Static fallback (no WebGL, or while three.js loads)                 */
/* ------------------------------------------------------------------ */

function StaticFallback({ shown, loading = false }: { shown: number; loading?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
      <PcSilhouette shown={shown} />
      {loading && (
        <p role="status" className="mt-3 text-xs text-muted">
          {caseFit.loading}
        </p>
      )}
    </div>
  );
}

/** Flat PC outline; parts drop into their slots as `shown` increases (order: board, cpu, cooler, ram, gpu, psu). */
function PcSilhouette({ shown }: { shown: number }) {
  const part = (i: number) => ({
    initial: false as const,
    animate: i < shown ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 },
    transition: { duration: DUR.base, ease: EASE },
  });
  const stroke = 'var(--orange)';
  return (
    <svg viewBox="0 0 320 360" className="mx-auto w-full max-w-[300px]" role="img" aria-label={`PC build, ${shown} of ${total} parts placed`}>
      <rect x="20" y="10" width="280" height="340" rx="18" fill="#111114" stroke="#33333a" strokeWidth="2" />
      <rect x="36" y="26" width="248" height="308" rx="10" fill="none" stroke="#24242a" strokeDasharray="4 6" />
      <m.g {...part(0)}>
        <rect x="56" y="40" width="190" height="200" rx="6" fill="#18181c" stroke="#3a3a42" />
        <path d="M70 60h40M70 72h28M200 210h30" stroke="#2c2c33" strokeWidth="3" />
      </m.g>
      <m.g {...part(1)}>
        <rect x="120" y="70" width="56" height="56" rx="6" fill="#2a2a30" stroke={stroke} strokeWidth="2" />
        <rect x="134" y="84" width="28" height="28" rx="3" fill="color-mix(in srgb, var(--orange) 35%, #222)" />
      </m.g>
      <m.g {...part(3)}>
        <rect x="196" y="58" width="8" height="84" rx="2" fill="#2a2a30" stroke={stroke} />
        <rect x="210" y="58" width="8" height="84" rx="2" fill="#2a2a30" stroke={stroke} />
      </m.g>
      <m.g {...part(4)}>
        <rect x="56" y="168" width="214" height="44" rx="6" fill="#222227" stroke={stroke} strokeWidth="2" />
        <circle cx="104" cy="190" r="14" fill="none" stroke="#4a4a52" strokeWidth="2" />
        <circle cx="160" cy="190" r="14" fill="none" stroke="#4a4a52" strokeWidth="2" />
        <rect x="200" y="182" width="56" height="16" rx="3" fill="color-mix(in srgb, var(--orange) 30%, #1a1a1d)" />
      </m.g>
      <m.g {...part(5)}>
        <rect x="56" y="262" width="120" height="58" rx="6" fill="#1d1d22" stroke={stroke} strokeWidth="2" />
        <circle cx="116" cy="291" r="18" fill="none" stroke="#4a4a52" strokeWidth="2" />
      </m.g>
    </svg>
  );
}
