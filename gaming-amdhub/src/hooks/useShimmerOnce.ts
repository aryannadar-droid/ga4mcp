import { useEffect } from 'react';
import { useInView } from './useInView';

/** Adds .is-shimmering once when the gold badge scrolls into view (CSS skips it for reduced motion). */
export function useShimmerOnce<T extends HTMLElement>() {
  const [ref, inView] = useInView<T>({ once: true, threshold: 0.6 });
  useEffect(() => {
    if (inView) ref.current?.classList.add('is-shimmering');
  }, [inView, ref]);
  return ref;
}
