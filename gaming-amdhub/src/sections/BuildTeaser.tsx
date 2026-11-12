import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { buildJourney as J, caseFit, type JourneyTab } from '../content';
import { track } from '../lib/analytics';
import { gpuLabel as gpuName, psuLabel } from '../lib/buildConfig';
import { configFromBuild, openBuilder } from '../lib/buildConfig';
import { checkCaseFit, type CaseDims } from '../lib/caseFit';
import { useInView } from '../hooks/useInView';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { BuildStage } from '../components/BuildStage';
import { ArrowRight } from '../components/Icons';
import type { PartId } from '../three/pcModel';

const ORDER: PartId[] = ['board', 'cpu', 'cooler', 'ram', 'gpu', 'psu'];
const ALL = Object.fromEntries(ORDER.map((p) => [p, true])) as Record<PartId, boolean>;
const STEP_MS = 420;
const FIT_MS = 1100;
/** "Fit your case" walks small → recommended, so the fit check visibly changes. */
const FIT_TOUR = ['itx', 'matx', caseFit.recommendedId].map((id) => caseFit.presets.find((p) => p.id === id)!);
const demo = configFromBuild('a2');

/**
 * Build-your-PC journey on the homepage (pattern from a modular-product launch page):
 * one statement → a 3D scene with a three-tab switch → one row per part → configurator.
 */
export function BuildTeaser() {
  const reduced = useReducedMotion();
  const [sectionRef, near] = useInView<HTMLElement>({ once: true, rootMargin: '700px 0px', threshold: 0 });
  const [stageRef, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.35 });
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<JourneyTab>('snap');
  const [step, setStep] = useState(0);
  const [fitIdx, setFitIdx] = useState(FIT_TOUR.length - 1);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Snap it in: parts click in one by one (once in view; instantly under reduced motion)
  useEffect(() => {
    if (tab !== 'snap' || !inView || !ready || reduced || step >= ORDER.length) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? 300 : STEP_MS);
    return () => window.clearTimeout(id);
  }, [tab, inView, ready, reduced, step]);

  // Fit your case: tour the sizes once, ending on the recommended case
  useEffect(() => {
    if (tab !== 'fit' || reduced || fitIdx >= FIT_TOUR.length - 1) return;
    const id = window.setTimeout(() => setFitIdx((i) => i + 1), FIT_MS);
    return () => window.clearTimeout(id);
  }, [tab, fitIdx, reduced]);

  const pick = (t: JourneyTab) => {
    setTab(t);
    if (t === 'snap') setStep(reduced ? ORDER.length : 0);
    if (t === 'fit') setFitIdx(reduced ? FIT_TOUR.length - 1 : 0);
  };
  const onTabKey = (e: KeyboardEvent, i: number) => {
    const n = J.tabs.length;
    const next = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    pick(J.tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  const placed = reduced ? ORDER.length : step;
  const present = useMemo(
    () => (tab === 'snap' ? (Object.fromEntries(ORDER.map((p, i) => [p, i < placed])) as Record<PartId, boolean>) : ALL),
    [tab, placed],
  );
  const preset = FIT_TOUR[tab === 'fit' ? fitIdx : FIT_TOUR.length - 1];
  const dims: CaseDims = useMemo(() => ({ h: preset.h, w: preset.w, d: preset.d }), [preset]);
  const fit = useMemo(() => checkCaseFit(dims, demo.board), [dims]);
  const current = J.tabs.find((t) => t.id === tab)!;

  const configure = (step?: string) => {
    track('builder_start', { section: 'build_journey', ...(step ? { step } : {}) });
    openBuilder({ build: 'a2', step });
  };

  return (
    <section ref={sectionRef} id="build" aria-labelledby="build-title" className="py-16 sm:py-24">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow mb-3">{J.eyebrow}</p>
          <h2 id="build-title" className="text-4xl leading-[1.02] font-bold tracking-tight uppercase sm:text-6xl">
            {J.statement}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted sm:text-lg">{J.sub}</p>
        </div>

        {/* 3D scene + three-tab switch */}
        <div ref={stageRef} className="mx-auto mt-10 max-w-5xl">
          <BuildStage
            load={near}
            dims={dims}
            board={demo.board}
            fit={fit}
            present={present}
            gpuLabel={gpuName(demo)}
            psuLabel={psuLabel()}
            mode={tab === 'snap' ? 'build' : tab}
            onReady={() => setReady(true)}
            className="aspect-[4/5] sm:aspect-[16/10]"
          >
            {tab === 'fit' && (
              <ul className="pointer-events-none absolute right-3 bottom-3 left-3 flex flex-wrap justify-center gap-2" aria-live="polite">
                <li className="rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                  {preset.label} · {preset.h} × {preset.w} × {preset.d} {caseFit.unit}
                </li>
                {fit.lines.map((l) => (
                  <li key={l.part} className={`rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur ${l.ok ? 'bg-ink/80 text-fg' : 'bg-accent text-ink'}`}>
                    {l.ok ? '✓' : '✕'} {l.ok ? caseFit.results[l.part].ok : caseFit.results[l.part].no}
                  </li>
                ))}
              </ul>
            )}
            {tab === 'run' && (
              <p className="placeholder-val pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink/85 px-4 py-2 font-display text-lg font-bold whitespace-nowrap backdrop-blur sm:bottom-24 sm:text-2xl">
                {J.fpsChip}
              </p>
            )}
          </BuildStage>
          {/* segmented switch under the scene, like a product page's "how it works" tabs */}
          <div role="tablist" aria-label={J.tabsLabel} className="mx-auto mt-4 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
            {J.tabs.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`journey-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="journey-caption"
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => pick(t.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={`flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-colors sm:px-5 sm:text-sm ${
                  tab === t.id ? 'bg-accent text-ink' : 'text-fg hover:bg-raised'
                }`}
              >
                <TabIcon id={t.id} />
                {t.label}
              </button>
            ))}
          </div>
          <p id="journey-caption" role="tabpanel" aria-labelledby={`journey-tab-${tab}`} aria-live="polite" className="mx-auto mt-4 max-w-2xl text-center text-muted">
            {current.caption}
          </p>
          <div className="mt-6 flex justify-center">
            <button type="button" className="btn btn-primary min-h-12 px-6 text-base" onClick={() => configure()}>
              {J.cta}
              <ArrowRight width={18} height={18} />
            </button>
          </div>
        </div>

        {/* one row per part, alternating sides; each deep-links into its configurator step */}
        <ul className="mx-auto mt-12 max-w-5xl space-y-3 sm:mt-16 sm:space-y-6">
          {J.rows.map((r, i) => (
            <li key={r.id} className={`card grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3 overflow-hidden sm:grid-cols-2 sm:gap-8 ${i % 2 ? 'sm:[&>*:first-child]:order-2' : ''}`}>
              <div className="aspect-square sm:aspect-[16/10]" style={{ background: 'radial-gradient(60% 60% at 50% 55%, color-mix(in srgb, var(--orange) 10%, transparent), transparent 70%)' }}>
                <img src={r.image} alt="" width={240} height={160} loading="lazy" decoding="async" className="h-full w-full object-contain" />
              </div>
              <div className="py-4 pr-4 sm:p-8">
                <h3 className="text-xl font-semibold sm:text-3xl">{r.title}</h3>
                <p className="mt-1 text-sm text-muted sm:mt-2 sm:text-base">{r.line}</p>
                <button type="button" className="btn btn-ghost mt-3 min-h-10 px-4 text-sm hover:border-accent sm:mt-5 sm:min-h-11 sm:px-5 sm:text-[15px]" onClick={() => configure(r.step)}>
                  {J.cta}
                  <ArrowRight width={16} height={16} className="text-accent" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TabIcon({ id }: { id: JourneyTab }) {
  const d = {
    snap: 'M12 3v10m0 0l-4-4m4 4l4-4M5 17h14v4H5z',
    fit: 'M4 4h6M4 4v6M20 4h-6M20 4v6M4 20h6M4 20v-6M20 20h-6M20 20v-6',
    run: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M12 3v3M12 18v3M3 12h3M18 12h3',
  }[id];
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
