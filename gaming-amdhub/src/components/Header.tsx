import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { site } from '../content';
import { DUR, EASE } from '../lib/motion';
import { Link } from '../lib/router';
import { CloseIcon, MenuIcon } from './Icons';
import { WhereToBuy } from './WhereToBuy';
import { Wordmark } from './Wordmark';

/**
 * Sticky header. After 80px it "shrinks" (translateY of the bar + scale of the logo row)
 * and fades in a blurred background layer — transform and opacity only.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 80));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const t = `transform var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out)`;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{ transform: scrolled ? 'translateY(-8px)' : 'none', transition: t }}
    >
      <div
        aria-hidden
        className="absolute inset-0 border-b border-line/80 bg-surface/75 backdrop-blur-xl"
        style={{ opacity: scrolled || open ? 1 : 0, transition: t }}
      />
      <div className="container-x relative flex h-[76px] items-center justify-between gap-4 pt-2">
        <div style={{ transform: scrolled ? 'scale(0.92)' : 'none', transformOrigin: 'left center', transition: t }}>
          <Wordmark />
        </div>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {site.nav.map((n) => (
              <li key={n.label}>
                <Link href={n.href} className="rounded-full px-4 py-2.5 text-[15px] text-fg/90 transition-colors hover:text-accent">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <WhereToBuy section="header" className="btn btn-primary min-h-10 px-4 text-sm" />
          <button
            type="button"
            className="btn btn-ghost min-h-10 px-3 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? site.menuClose : site.menuOpen}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <m.nav
            id="mobile-nav"
            aria-label="Main"
            className="relative border-b border-line bg-surface/95 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DUR.fast, ease: EASE }}
          >
            <ul className="container-x flex flex-col py-2">
              {site.nav.map((n) => (
                <li key={n.label}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-3 text-base">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </m.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
