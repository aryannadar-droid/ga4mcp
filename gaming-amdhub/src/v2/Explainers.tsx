import { useState } from 'react';
import { explainers as E } from './content';
import { VideoModal } from './VideoModal';

const ART = [
  'radial-gradient(60% 60% at 50% 55%, color-mix(in srgb, var(--v2-gold-soft) 30%, transparent), transparent 70%), repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 2px, transparent 2px 10px)',
  'radial-gradient(55% 55% at 30% 60%, color-mix(in srgb, var(--v2-orange) 24%, transparent), transparent 70%), repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 2px, transparent 2px 14px)',
  'conic-gradient(from 210deg at 65% 55%, transparent, color-mix(in srgb, var(--v2-gold-soft) 26%, transparent), transparent 45%)',
];

/** "Know what you're getting": three 30-second explainers. Play button, duration, one plain line. */
export function Explainers() {
  const [open, setOpen] = useState<(typeof E.cards)[number] | null>(null);
  return (
    <section aria-labelledby="v2-explainers-title" className="py-16 sm:py-24">
      <div className="container-x">
        <h2 id="v2-explainers-title" className="v2-display text-[clamp(2.1rem,6vw,3.8rem)]">
          {E.title}
        </h2>
        <p className="mt-3 text-lg text-[var(--v2-muted)]">{E.sub}</p>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {E.cards.map((c, i) => (
            <li key={c.id} className="overflow-hidden rounded-3xl border border-[var(--v2-line)] bg-[var(--v2-black-2)]">
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setOpen(c)}
                className="group relative block aspect-video w-full"
                style={{ background: ART[i % ART.length] }}
              >
                {/* accessible name is real text, so it includes the visible duration */}
                <span className="sr-only">
                  {E.play}: {c.title}, {c.hook},{' '}
                </span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-16 items-center justify-center rounded-full border border-[var(--v2-gold-soft)] bg-black/60 text-[var(--v2-gold-soft)] backdrop-blur transition-transform duration-300 group-hover:scale-110">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
                <span className="absolute right-3 bottom-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold tabular-nums">{c.duration}</span>
              </button>
              <div className="p-5 sm:p-6">
                <p className="font-display text-sm font-bold tracking-[0.14em] text-[var(--v2-gold-soft)] uppercase">{c.title}</p>
                <h3 className="mt-2 font-display text-xl leading-snug font-semibold">{c.hook}</h3>
                <p className="mt-2 text-[var(--v2-muted)]">{c.line}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {open && <VideoModal id={open.id} title={`${open.title}: ${open.hook}`} src={open.src} onClose={() => setOpen(null)} />}
    </section>
  );
}
