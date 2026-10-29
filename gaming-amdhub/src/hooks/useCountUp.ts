import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/** Counts from 0 to `target` once `start` is true. Reduced motion shows the final value at once. */
export function useCountUp(target: number | null, start: boolean, duration = 600) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState<number | null>(target == null ? null : reduced ? target : 0);

  useEffect(() => {
    if (target == null) return setValue(null);
    if (reduced) return setValue(target);
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, reduced, duration]);

  return value;
}
