/** Shared motion constants. Transform + opacity only, 200–600ms, one easing curve. */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const DUR = { fast: 0.2, base: 0.4, slow: 0.6 } as const;

/**
 * Scroll reveal: transform only, opacity stays 1. Content is fully visible even if the
 * reveal never runs (JS animations off, IntersectionObserver missing, screenshot tools).
 */
export const fadeUp = {
  hidden: { y: 18 },
  show: { y: 0, transition: { duration: DUR.slow, ease: EASE } },
};

export const stagger = (step = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: step } },
});
