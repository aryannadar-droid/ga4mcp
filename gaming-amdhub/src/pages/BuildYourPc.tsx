import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { builds, caseFit, configurator as C, buildJourney as J, sellers, type BuildId } from '../content';
import { track } from '../lib/analytics';
import { BAR_SENTINEL_ID, barBuy, useBarSections } from '../lib/bar';
import {
  buildTotal,
  builderPreset,
  configFromBuild,
  decodeConfig,
  encodeConfig,
  gpuAllowed,
  gpuLabel,
  partCount,
  presentParts,
  psuLabel,
  selectedOptions,
  type BuildConfig,
  type ExtraId,
} from '../lib/buildConfig';
import { checkCaseFit, type CaseDims, type FitLine } from '../lib/caseFit';
import { formatINR } from '../lib/format';
import { getLenis } from '../lib/scroll';
import { Link } from '../lib/router';
import { shareLink } from '../lib/share';
import { writeStore } from '../lib/storage';
import { BuildStage } from '../components/BuildStage';
import { CaseControls, FitList } from '../components/CaseFitControls';
import { ArrowLeft, BookmarkIcon, CloseIcon, ExternalIcon, ShareIcon, StoreIcon } from '../components/Icons';
import { PlainKey } from '../components/PlainKey';
import { SellerLink } from '../components/SellerLink';

const THUMB: Record<string, string> = {
  'r5-8600g': '/placeholders/cpu-ryzen-5.svg',
  'r5-7500f': '/placeholders/cpu-ryzen-5.svg',
  'r9-9900x': '/placeholders/cpu-ryzen-9.svg',
  'r9-9950x3d': '/placeholders/cpu-ryzen-9.svg',
  'rx-9060xt-8': '/placeholders/gpu-rx-9060-xt.svg',
  'rx-9060xt-16': '/placeholders/gpu-rx-9060-xt.svg',
  'rx-9070': '/placeholders/gpu-rx-9070.svg',
  'rx-9070xt': '/placeholders/gpu-rx-9070-xt.svg',
};

const BAR = [
  { id: C.steps.case.id, label: C.steps.case.title },
  { id: C.steps.cpu.id, label: C.steps.cpu.title },
  { id: C.steps.gpu.id, label: C.steps.gpu.title },
  { id: C.steps.extras.id, label: C.steps.extras.title },
  { id: 'cfg-buy', label: C.buyCta },
];

/**
 * Configurator (pattern from a modular-product page): sticky live 3D build, "Select case"
 * decides what fits (like choosing a dock), part cards add / remove with unavailable
 * states, "See it in action", and a live total on the buy button.
 */
export default function BuildYourPc() {
  useBarSections(BAR);
  const [cfg, setCfg] = useState<BuildConfig>(() => {
    const fromLink = typeof window !== 'undefined' ? decodeConfig(window.location.search) : null;
    return fromLink ?? configFromBuild(builderPreset.get()?.build ?? null);
  });
  const [run, setRun] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => () => builderPreset.set(null), []);

  const fit = useMemo(() => checkCaseFit(cfg.dims, cfg.board), [cfg.dims, cfg.board]);
  const skip: FitLine['part'][] = [...(cfg.gpu === 'none' ? ['gpu' as const] : []), ...(cfg.extras.cooler ? [] : ['cooler' as const])];
  const total = buildTotal(cfg);
  const count = partCount(cfg);
  const present = useMemo(() => presentParts(cfg), [cfg]);

  // compat_check once the visitor stops changing the case (not on first render)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const ok = fit.lines.filter((l) => !skip.includes(l.part)).every((l) => l.ok);
    const id = window.setTimeout(
      () => track('compat_check', { section: 'configurator', product: 'case', case: cfg.caseId, case_h: cfg.dims.h, case_w: cfg.dims.w, case_d: cfg.dims.d, board: cfg.board, result: ok ? 'fits' : 'no' }),
      900,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.caseId, cfg.dims, cfg.board]);

  const configure = (part: string, product: string, action: 'add' | 'remove' | 'select') => track('build_configure', { section: 'configurator', part, product, action });

  const setCase = (caseId: string, dims: CaseDims) =>
    // the size boxes commit on Enter and again on blur: ignore no-op updates
    setCfg((c) => (c.caseId === caseId && c.dims.h === dims.h && c.dims.w === dims.w && c.dims.d === dims.d ? c : { ...c, caseId, dims }));
  const pickCpu = (id: string) => {
    // a processor without gaming graphics can't stay on "built-in graphics": add the entry card
    const keep = gpuAllowed(id, cfg.gpu);
    setNotice(keep ? null : `${C.unavailable.noIgpu}: added ${C.gpus[1].label}.`);
    setCfg({ ...cfg, cpu: id, gpu: keep ? cfg.gpu : C.gpus[1].id });
    configure('cpu', id, 'select');
  };
  const pickGpu = (id: string) => {
    setNotice(null);
    setCfg((c) => ({ ...c, gpu: id }));
    configure('gpu', id, 'select');
  };
  const toggleExtra = (id: ExtraId) => {
    const on = !cfg.extras[id];
    setCfg({ ...cfg, extras: { ...cfg.extras, [id]: on } });
    configure(id, id, on ? 'add' : 'remove');
  };
  const startFrom = (id: BuildId) => {
    const b = configFromBuild(id);
    setNotice(null);
    setCfg((c) => ({ ...c, cpu: b.cpu, gpu: b.gpu }));
    configure('preset', id, 'select');
  };

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?${encodeConfig(cfg)}`;
    const r = await shareLink(C.title, url);
    if (r !== 'failed') track('build_share', { section: 'configurator', build: 'custom', product: selectedOptions(cfg).cpu.label, method: r });
    if (r === 'copied') setStatus(C.copied);
  };
  const save = () => {
    writeStore('amdhub.custom-build', encodeConfig(cfg));
    track('build_save', { section: 'configurator', build: 'custom', product: selectedOptions(cfg).cpu.label });
    setStatus(C.saved);
  };
  const openSheet = (section = 'configurator') => {
    track('store_search', { section, build: 'custom', product: selectedOptions(cfg).cpu.label });
    setSheet(true);
  };
  // the pinned bar's "Where to buy" opens this build's sheet instead of leaving the page
  const openRef = useRef(openSheet);
  openRef.current = openSheet;
  useEffect(() => {
    barBuy.set(() => openRef.current('section_bar'));
    return () => barBuy.set(null);
  }, []);

  return (
    <main id="main" className="pt-24 pb-28 sm:pt-28 lg:pb-16">
      <div className="container-x">
        <Link href="/#build" className="inline-flex items-center gap-2 rounded-full py-2 text-sm text-muted hover:text-fg">
          <ArrowLeft width={16} height={16} /> {J.eyebrow}
        </Link>
        <div id={BAR_SENTINEL_ID} aria-hidden />

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
          {/* live 3D build: sticky under the pinned bar on phones, in the left column on desktop */}
          <div className="sticky top-[60px] z-20 -mx-4 bg-ink px-4 pt-2 pb-3 sm:-mx-6 sm:px-6 lg:top-24 lg:mx-0 lg:self-start lg:bg-transparent lg:p-0">
            <BuildStage
              load
              dims={cfg.dims}
              board={cfg.board}
              fit={fit}
              present={present}
              gpuLabel={gpuLabel(cfg)}
              psuLabel={psuLabel()}
              mode={run ? 'run' : 'build'}
              label={C.viewerLabel}
              className="h-[34svh] min-h-[220px] lg:h-[calc(100svh-150px)] lg:max-h-[760px]"
            >
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
                {run && <span className="placeholder-val rounded-full bg-ink/85 px-3 py-1.5 text-xs font-bold whitespace-nowrap backdrop-blur sm:text-sm">{J.fpsChip}</span>}
                <label className="flex cursor-pointer items-center gap-2 rounded-full bg-ink/80 py-1.5 pr-1.5 pl-3 text-xs font-semibold whitespace-nowrap backdrop-blur">
                  {C.seeInAction}
                  <input
                    type="checkbox"
                    role="switch"
                    checked={run}
                    onChange={(e) => setRun(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span aria-hidden className="relative h-6 w-10 rounded-full border border-line bg-raised transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                    <span className={`absolute top-0.5 left-0.5 size-[18px] rounded-full bg-fg transition-transform duration-200 ${run ? 'translate-x-4' : ''}`} />
                  </span>
                </label>
              </div>
            </BuildStage>
          </div>

          {/* steps */}
          <div className="min-w-0">
            <p className="eyebrow mb-2">{C.eyebrow}</p>
            <h1 className="fade-reveal text-3xl font-bold sm:text-4xl">{C.title}</h1>
            <p className="mt-2 text-muted">{C.sub}</p>
            <p className="mt-4 flex items-baseline gap-3" aria-live="polite">
              <span className="placeholder-val font-display text-3xl font-bold text-gold-soft">{formatINR(total)}</span>
              <span className="text-sm text-muted">
                {count} {C.partsCount}
              </span>
            </p>

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">{C.startTitle}</p>
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {C.startPresets.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className="chip min-h-9 shrink-0 text-xs sm:text-sm"
                    aria-pressed={builds[id].cpu === cfg.cpu && (builds[id].gpu ?? 'none') === cfg.gpu}
                    onClick={() => startFrom(id)}
                  >
                    {builds[id].name}
                  </button>
                ))}
              </div>
            </div>

            <Step id={C.steps.case.id} n={1} title={C.steps.case.title}>
              <CaseControls caseId={cfg.caseId} dims={cfg.dims} board={cfg.board} onCase={setCase} onBoard={(board) => setCfg((c) => ({ ...c, board }))} />
              <FitList fit={fit} skip={skip} />
            </Step>

            <Step id={C.steps.cpu.id} n={2} title={C.steps.cpu.title}>
              <ul className="space-y-2">
                {C.cpus.map((o) => (
                  <OptionCard key={o.id} label={o.label} note={o.note} price={o.price} thumb={THUMB[o.id]} state={cfg.cpu === o.id ? 'selected' : 'available'} onClick={() => pickCpu(o.id)} />
                ))}
              </ul>
            </Step>

            <Step id={C.steps.gpu.id} n={3} title={C.steps.gpu.title}>
              {notice && (
                <p className="mb-3 rounded-xl border border-accent px-4 py-3 text-sm" role="status">
                  {notice}
                </p>
              )}
              <ul className="space-y-2">
                {C.gpus.map((o) => {
                  const allowed = gpuAllowed(cfg.cpu, o.id);
                  return (
                    <OptionCard
                      key={o.id}
                      label={o.label}
                      note={allowed ? o.note : C.unavailable.needsCard}
                      price={o.id === 'none' ? undefined : o.price}
                      thumb={THUMB[o.id]}
                      state={!allowed ? 'disabled' : cfg.gpu === o.id ? 'selected' : 'available'}
                      onClick={() => allowed && pickGpu(o.id)}
                    />
                  );
                })}
              </ul>
            </Step>

            <Step id={C.steps.extras.id} n={4} title={C.steps.extras.title}>
              <ul className="space-y-2">
                {C.extras.map((e) => (
                  <OptionCard
                    key={e.id}
                    label={e.label}
                    note={e.note}
                    price={e.price}
                    state={e.required ? 'needed' : cfg.extras[e.id as ExtraId] ? 'added' : 'available'}
                    toggle
                    onClick={() => !e.required && toggleExtra(e.id as ExtraId)}
                  />
                ))}
              </ul>
              <PlainKey className="mt-4" />
            </Step>

            <div id="cfg-buy" className="mt-8 space-y-3">
              <p className="rounded-xl bg-raised px-4 py-3 text-xs text-muted">{C.note}</p>
              <button type="button" data-buy="where-to-buy" data-buy-section="configurator" className="btn btn-primary hidden min-h-12 w-full text-base lg:flex" onClick={() => openSheet()}>
                <StoreIcon width={18} height={18} /> {C.buyCta} · {formatINR(total)}
              </button>
              <div className="flex flex-wrap items-center gap-3" aria-live="polite">
                <button type="button" className="btn btn-ghost" onClick={save}>
                  <BookmarkIcon width={18} height={18} /> {C.save}
                </button>
                <button type="button" className="btn btn-ghost" onClick={share}>
                  <ShareIcon width={18} height={18} /> {C.share}
                </button>
                {status && <span className="text-sm text-muted">{status}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* phones: live total + buy, pinned to the bottom */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <p className="text-[11px] text-muted">
              {C.totalLabel} · {count} {C.partsCount}
            </p>
            <p className="placeholder-val font-display text-lg leading-tight font-bold text-gold-soft">{formatINR(total)}</p>
          </div>
          <button type="button" data-buy="where-to-buy" data-buy-section="configurator_bar" className="btn btn-primary ml-auto min-h-11 px-4 text-sm" onClick={() => openSheet()}>
            <StoreIcon width={18} height={18} /> {C.buyCta}
          </button>
        </div>
      </div>

      {sheet && <BuySheet cfg={cfg} onClose={() => setSheet(false)} />}
    </main>
  );
}

function Step({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-8 scroll-mt-[calc(34svh+90px)] lg:scroll-mt-24">
      <h2 id={`${id}-title`} className="mb-3 flex items-baseline gap-3 font-display text-sm font-semibold tracking-[0.14em] uppercase">
        <span className="text-muted">0{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

type CardState = 'selected' | 'available' | 'disabled' | 'needed' | 'added';

/** Part card: thumbnail, name, price, one line, and an Add / Remove (or Selected) pill. */
function OptionCard({
  label,
  note,
  price,
  thumb,
  state,
  toggle = false,
  onClick,
}: {
  label: string;
  note: string;
  price?: number | null;
  thumb?: string;
  state: CardState;
  toggle?: boolean;
  onClick: () => void;
}) {
  const on = state === 'selected' || state === 'added' || state === 'needed';
  const disabled = state === 'disabled' || state === 'needed';
  const pill = state === 'needed' ? C.needed : toggle ? (on ? C.remove : C.add) : on ? C.selected : C.add;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={on}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors sm:gap-4 ${
          on ? 'border-accent bg-raised' : state === 'disabled' ? 'border-line opacity-55' : 'border-line hover:border-muted'
        } ${state === 'needed' ? 'cursor-default' : ''}`}
      >
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface sm:size-16">
          {thumb ? <img src={thumb} alt="" width={64} height={64} loading="lazy" className="h-full w-full object-cover" /> : <span aria-hidden className="size-6 rounded-md border-2 border-line" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{label}</span>
          {price !== undefined && <span className="placeholder-val block text-sm font-semibold text-gold-soft">{formatINR(price)}</span>}
          <span className="block text-xs text-muted sm:text-sm">{note}</span>
        </span>
        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide uppercase ${
            on ? 'bg-accent text-ink' : 'border border-line text-fg'
          } ${state === 'needed' ? 'bg-transparent text-muted ring-1 ring-line' : ''}`}
        >
          {pill}
        </span>
      </button>
    </li>
  );
}

/** "Where to buy this build": each AMD part links to its exact listing; or one builder quote. */
function BuySheet({ cfg, onClose }: { cfg: BuildConfig; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { cpu, gpu, extras } = selectedOptions(cfg);
  const amdParts = [cpu, gpu].filter(Boolean) as typeof C.gpus;
  const shops = sellers.filter((s) => s.id !== 'builder');

  useEffect(() => {
    ref.current?.showModal();
    getLenis()?.stop();
    return () => getLenis()?.start();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="buy-title"
      data-lenis-prevent
      className="m-0 mt-auto max-h-[88svh] w-full max-w-none overflow-y-auto rounded-t-3xl border border-line bg-surface p-0 text-fg backdrop:bg-black/70 sm:m-auto sm:max-w-xl sm:rounded-3xl"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id="buy-title" className="text-xl font-semibold">
          {C.buyTitle}
        </h2>
        <button type="button" className="btn btn-ghost min-h-10 px-3" aria-label={C.close} onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className="space-y-5 p-5">
        <p className="text-sm text-muted">{C.buySub}</p>
        {amdParts.map((o) => (
          <div key={o.id} className="rounded-2xl border border-line p-4">
            <p className="font-semibold">{o.label}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {shops.map((s) => (
                <SellerLink key={s.id} seller={s.id} product={o.product!} build="custom" section="configurator" className="btn btn-ghost min-h-10 justify-between px-4 text-sm hover:border-accent">
                  <span className="truncate">{s.name}</span>
                  <ExternalIcon width={16} height={16} className="shrink-0 text-accent" />
                </SellerLink>
              ))}
            </div>
          </div>
        ))}
        {extras.length > 0 && <p className="text-xs text-muted">{extras.map((e) => e.label).join(' · ')}</p>}
        <SellerLink seller="builder" product={cpu.product!} build="custom" section="configurator" className="btn btn-primary min-h-12 w-full py-3 text-center text-base whitespace-normal">
          {C.builderCta}
          <ExternalIcon width={18} height={18} />
        </SellerLink>
        <p className="text-center text-xs text-muted">{caseFit.partSizesNote}</p>
      </div>
    </dialog>
  );
}
