import type Lenis from 'lenis';

let lenis: Lenis | null = null;
const lenisListeners = new Set<(l: Lenis | null) => void>();

export function setLenis(l: Lenis | null) {
  lenis = l;
  lenisListeners.forEach((fn) => fn(l));
}
export function getLenis() {
  return lenis;
}
export function onLenis(fn: (l: Lenis | null) => void) {
  lenisListeners.add(fn);
  fn(lenis);
  return () => lenisListeners.delete(fn);
}

export function scrollToTarget(hash: string, immediate = false) {
  const el = hash.length > 1 ? document.querySelector<HTMLElement>(hash) : null;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -72, immediate });
  else el.scrollIntoView({ behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' });
  // Move focus for keyboard and screen-reader users without a second scroll jump.
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
