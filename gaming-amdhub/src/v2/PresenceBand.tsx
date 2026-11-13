import { useEffect, useRef } from 'react';
import { anchors, presence, type Stat } from './content';
import { trackV2, useScrollCount } from './lib';

/** "AMD is everywhere you play." Four gold proof numbers that count up, each with its source. */
export function PresenceBand() {
  const ref = useRef<HTMLElement>(null);

  // presence_view: band 50% visible, once per page
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          trackV2('presence_view', { section: 'v2_presence', page: window.location.pathname });
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id={anchors.presence} aria-labelledby="v2-presence-title" className="border-y border-[var(--v2-line)] py-16 sm:py-24">
      <div className="container-x">
        <h2 id="v2-presence-title" className="v2-display max-w-4xl text-[clamp(2.1rem,6.5vw,4.2rem)]">
          {presence.title} <span className="text-[var(--v2-muted)]">{presence.sub}</span>
        </h2>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {presence.stats.map((s) => (
            <StatTile key={s.id} s={s} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function StatTile({ s }: { s: Stat }) {
  const [ref, v] = useScrollCount(s.value);
  const num = s.grouped ? Math.round(v).toLocaleString('en-IN') : v.toFixed(s.decimals ?? 0);
  const final = `${s.prefix ?? ''}${s.grouped ? s.value.toLocaleString('en-IN') : s.value.toFixed(s.decimals ?? 0)}${s.suffix ?? ''}`;
  return (
    <li ref={ref as React.Ref<HTMLLIElement>} className="flex flex-col rounded-2xl border border-[var(--v2-line)] bg-[var(--v2-black-2)] p-6">
      <p className="v2-display text-5xl text-[var(--v2-gold-soft)] tabular-nums sm:text-6xl" data-final={final}>
        {/* screen readers get the final figure; the counting digits are visual only */}
        <span className="sr-only">{final}</span>
        <span aria-hidden>
          {s.prefix && <span className="text-3xl sm:text-4xl">{s.prefix}</span>}
          {num}
          {s.suffix}
        </span>
      </p>
      <p className="mt-3 text-[15px] leading-snug">{s.label}</p>
      <p className="mt-auto pt-4 text-xs text-[var(--v2-muted)]">Source: {s.source}</p>
    </li>
  );
}
