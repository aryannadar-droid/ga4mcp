import { useEffect } from 'react';
import { track } from './analytics';

const DEPTHS = [10, 25, 50, 75, 90];

/** Scroll position as a percentage of the scrollable page (0–100), not screens or pixels. */
function scrollPercent() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / max) * 100));
}

/**
 * Per page view:
 * - scroll_depth at 10 / 25 / 50 / 75 / 90 %
 * - first_buy_visible: the scroll % at which the first "Where to buy" button enters the viewport
 */
export function useScrollTracking(path: string) {
  useEffect(() => {
    const fired = new Set<number>();
    let raf = 0;
    const check = () => {
      raf = 0;
      const pct = scrollPercent();
      for (const d of DEPTHS)
        if (pct >= d && !fired.has(d)) {
          fired.add(d);
          track('scroll_depth', { section: 'page', page: path, percent: d });
        }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // first Where-to-buy button in view (buttons can mount later, e.g. the pinned bar)
    let buySeen = false;
    const io = new IntersectionObserver((entries) => {
      const hit = entries.find((e) => e.isIntersecting);
      if (!hit || buySeen) return;
      buySeen = true;
      track('first_buy_visible', {
        section: hit.target.getAttribute('data-buy-section') ?? 'unknown',
        page: path,
        scroll_percent: scrollPercent(),
      });
      io.disconnect();
      mo.disconnect();
    });
    const observeAll = () => document.querySelectorAll('[data-buy="where-to-buy"]').forEach((el) => io.observe(el));
    const mo = new MutationObserver(() => !buySeen && observeAll());
    const start = window.setTimeout(() => {
      observeAll();
      mo.observe(document.body, { childList: true, subtree: true });
    }, 50);

    return () => {
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
      mo.disconnect();
    };
  }, [path]);
}
