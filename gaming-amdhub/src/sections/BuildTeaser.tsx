import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { buildTeaser } from '../content';
import { track } from '../lib/analytics';
import { formatFps, formatRange } from '../lib/format';
import { DUR, EASE } from '../lib/motion';
import { Link } from '../lib/router';
import { useInView } from '../hooks/useInView';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ArrowRight } from '../components/Icons';

const STEP_MS = 520;

function sum(vals: (number | null)[]) {
  return vals.some((v) => v == null) ? null : (vals as number[]).reduce((a, b) => a + b, 0);
}

export function BuildTeaser() {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.4 });
  const total = buildTeaser.parts.length;
  const [step, setStep] = useState(0);
  const shown = reduced ? total : step;

  // Parts snap in one by one, once, only after the card is on screen.
  useEffect(() => {
    if (!inView || reduced || step >= total) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? 250 : STEP_MS);
    return () => window.clearTimeout(id);
  }, [inView, reduced, step, total]);

  const placed = buildTeaser.parts.slice(0, shown);
  const range = formatRange(sum(placed.map((p) => p.min)), sum(placed.map((p) => p.max)));
  const fps = placed.length ? placed[placed.length - 1].fps : null;

  return (
    <section id="build" aria-labelledby="build-title" className="py-16 sm:py-24">
      <div className="container-x">
        <div
          ref={ref}
          className="relative grid overflow-hidden rounded-3xl border border-line bg-[#0d0d0f] p-6 sm:p-10 lg:grid-cols-2 lg:gap-10 lg:p-14"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)' }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -bottom-24 size-[420px] rounded-full opacity-60"
            style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--orange) 22%, transparent), transparent)' }}
          />
          <div className="relative">
            <p className="eyebrow mb-3">{buildTeaser.eyebrow}</p>
            <h2 id="build-title" className="text-3xl leading-[1.08] font-semibold sm:text-4xl">
              {buildTeaser.title}
            </h2>
            <p className="mt-4 max-w-md text-muted">{buildTeaser.sub}</p>

            <dl className="mt-8 grid grid-cols-2 gap-4" aria-live="polite">
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
            <ol className="mt-5 flex flex-wrap gap-2 text-xs">
              {buildTeaser.parts.map((p, i) => (
                <li
                  key={p.id}
                  className={`rounded-full border px-3 py-1.5 ${i < shown ? 'border-accent text-fg' : 'border-dashed border-line text-muted'}`}
                >
                  {p.label}
                </li>
              ))}
            </ol>
            <Link
              href={buildTeaser.ctaHref}
              className="btn btn-primary mt-8 min-h-12 px-6 text-base"
              onClick={() => track('builder_start', { section: 'build_teaser' })}
            >
              {buildTeaser.cta}
              <ArrowRight width={18} height={18} />
            </Link>
          </div>
          <div className="relative mt-10 lg:mt-0">
            <PcSilhouette shown={shown} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** PC case outline; each part drops into its slot as `shown` increases. */
function PcSilhouette({ shown }: { shown: number }) {
  const part = (i: number) => ({
    initial: false as const,
    animate: i < shown ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 },
    transition: { duration: DUR.base, ease: EASE },
  });
  const stroke = 'var(--orange)';
  return (
    <svg viewBox="0 0 320 360" className="mx-auto w-full max-w-[360px]" role="img" aria-label={`PC build, ${shown} of 5 parts placed`}>
      {/* case */}
      <rect x="20" y="10" width="280" height="340" rx="18" fill="#111114" stroke="#33333a" strokeWidth="2" />
      <rect x="36" y="26" width="248" height="308" rx="10" fill="none" stroke="#24242a" strokeDasharray="4 6" />
      {/* motherboard */}
      <m.g {...part(1)}>
        <rect x="56" y="40" width="190" height="200" rx="6" fill="#18181c" stroke="#3a3a42" />
        <path d="M70 60h40M70 72h28M200 210h30" stroke="#2c2c33" strokeWidth="3" />
      </m.g>
      {/* cpu */}
      <m.g {...part(0)}>
        <rect x="120" y="70" width="56" height="56" rx="6" fill="#2a2a30" stroke={stroke} strokeWidth="2" />
        <rect x="134" y="84" width="28" height="28" rx="3" fill="color-mix(in srgb, var(--orange) 35%, #222)" />
      </m.g>
      {/* ram */}
      <m.g {...part(2)}>
        <rect x="196" y="58" width="8" height="84" rx="2" fill="#2a2a30" stroke={stroke} />
        <rect x="210" y="58" width="8" height="84" rx="2" fill="#2a2a30" stroke={stroke} />
      </m.g>
      {/* gpu */}
      <m.g {...part(3)}>
        <rect x="56" y="168" width="214" height="44" rx="6" fill="#222227" stroke={stroke} strokeWidth="2" />
        <circle cx="104" cy="190" r="14" fill="none" stroke="#4a4a52" strokeWidth="2" />
        <circle cx="160" cy="190" r="14" fill="none" stroke="#4a4a52" strokeWidth="2" />
        <rect x="200" y="182" width="56" height="16" rx="3" fill="color-mix(in srgb, var(--orange) 30%, #1a1a1d)" />
      </m.g>
      {/* psu */}
      <m.g {...part(4)}>
        <rect x="56" y="262" width="120" height="58" rx="6" fill="#1d1d22" stroke={stroke} strokeWidth="2" />
        <circle cx="116" cy="291" r="18" fill="none" stroke="#4a4a52" strokeWidth="2" />
      </m.g>
    </svg>
  );
}
