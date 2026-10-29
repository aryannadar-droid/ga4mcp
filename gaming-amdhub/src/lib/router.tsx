import { useEffect, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { scrollToTarget } from './scroll';

/** Tiny history router: four routes don't justify a router dependency. */
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  window.addEventListener('popstate', l);
  return () => {
    listeners.delete(l);
    window.removeEventListener('popstate', l);
  };
};
const getPath = () => window.location.pathname;

export function usePath() {
  return useSyncExternalStore(subscribe, getPath, () => '/');
}

export function navigate(href: string) {
  const url = new URL(href, window.location.href);
  const samePage = url.pathname === window.location.pathname;
  if (samePage && url.hash) {
    history.replaceState(null, '', url.pathname + url.hash);
    scrollToTarget(url.hash);
    return;
  }
  history.pushState(null, '', url.pathname + url.hash);
  listeners.forEach((l) => l());
  if (!url.hash) window.scrollTo(0, 0);
}

/** After a route change with a hash, scroll once the new page has rendered. */
export function useHashScroll(path: string) {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = window.setTimeout(() => scrollToTarget(hash, true), 60);
    return () => window.clearTimeout(id);
  }, [path]);
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function Link({ href, onClick, ...rest }: LinkProps) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!href.startsWith('/') && !href.startsWith('#')) return;
    e.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={handle} {...rest} />;
}
