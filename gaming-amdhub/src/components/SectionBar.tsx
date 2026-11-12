import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { personas, sectionBar } from '../content';
import { BAR_SENTINEL_ID, barActive, barBuy, barSections } from '../lib/bar';
import { StoreIcon } from './Icons';
import { DUR, EASE } from '../lib/motion';
import { usePersona } from '../lib/persona';
import { Link, navigate, usePath } from '../lib/router';
import { ArrowRight } from './Icons';
import { WhereToBuy } from './WhereToBuy';

const YOURS = '__yours__';
const HEADER_H = 80;

/**
 * Slim bar pinned to the top after the hero, on every screen size (NVIDIA pattern):
 * section dropdown on the left, saved-persona shortcut, "Where to buy" on the right.
 * Replaces the old bottom bar on phones; the main header slides away while it shows.
 */
export function SectionBar() {
  const path = usePath();
  const active = barActive.use();
  const sections = barSections.use();
  const buy = barBuy.use();
  const persona = usePersona();
  const p = persona ? personas[persona] : null;
  const [current, setCurrent] = useState('');

  // Show once the sentinel after the hero has scrolled past the top. A scroll check, not an
  // IntersectionObserver: a jump straight past the sentinel (anchor links) never "intersects".
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const el = document.getElementById(BAR_SENTINEL_ID);
      // hero gone = sentinel has passed under the header (anchor jumps stop it ~72px down)
      barActive.set(!!el && el.getBoundingClientRect().top <= HEADER_H + 4);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const id = window.setTimeout(check, 120); // page may still be resolving after a route change
    check();
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(id);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      barActive.set(false);
    };
  }, [path]);

  // scrollspy: the section crossing the middle of the screen
  useEffect(() => {
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [sections]);

  const onPick = (id: string) => {
    if (id === YOURS && p) return navigate(p.route);
    setCurrent(id);
    navigate(`#${id}`);
  };

  return (
    <AnimatePresence>
      {active && (
        <m.div
          key="bar"
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: DUR.base, ease: EASE }}
          className="fixed inset-x-0 top-0 z-50 border-b border-line bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl"
        >
          <nav aria-label="Page sections" className="container-x flex h-14 items-center gap-2 sm:gap-3">
            {sections.length > 0 && (
              <label className="relative min-w-0 flex-1 sm:max-w-64">
                <span className="sr-only">{sectionBar.jumpLabel}</span>
                <select
                  value={sections.some((s) => s.id === current) ? current : ''}
                  onChange={(e) => onPick(e.target.value)}
                  className="h-10 w-full min-w-0 cursor-pointer appearance-none truncate rounded-full border border-line bg-raised py-0 pr-9 pl-4 text-sm font-medium text-fg"
                >
                  <option value="" disabled>
                    {sectionBar.jumpLabel}
                  </option>
                  {p && (
                    <optgroup label={sectionBar.yours}>
                      <option value={YOURS}>{p.short} →</option>
                    </optgroup>
                  )}
                  <optgroup label="On this page">
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </label>
            )}
            {p && path !== p.route && (
              <Link href={p.route} className="hidden min-w-0 items-center gap-1.5 rounded-full border border-line px-3 py-2 text-sm sm:inline-flex">
                <span className="text-muted">{sectionBar.yours}:</span>
                <span className="truncate">{p.short}</span>
                <ArrowRight width={14} height={14} className="shrink-0" />
              </Link>
            )}
            {buy ? (
              <button type="button" data-buy="where-to-buy" data-buy-section="section_bar" className="btn btn-primary ml-auto min-h-10 shrink-0 px-4 text-sm" onClick={buy}>
                <StoreIcon width={18} height={18} />
                {sectionBar.whereToBuy}
              </button>
            ) : (
              <WhereToBuy section="section_bar" className="btn btn-primary ml-auto min-h-10 shrink-0 px-4 text-sm" label={sectionBar.whereToBuy} />
            )}
          </nav>
        </m.div>
      )}
    </AnimatePresence>
  );
}
