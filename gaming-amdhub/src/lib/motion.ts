/** Shared motion constants. Transform + opacity only, 200–600ms, one easing curve. */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const DUR = { fast: 0.2, base: 0.4, slow: 0.6 } as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
};

export const stagger = (step = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: step } },
});
