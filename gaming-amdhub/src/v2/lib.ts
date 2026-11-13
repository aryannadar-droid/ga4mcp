/**
 * NEW_HOME_V2 helpers. Reads the locked libraries; changes none of them.
 */
import { useEffect, useRef, useState } from 'react';
import { builds, catalog, listings, type BuildId, type PersonaId, type ProductId, type SellerId } from '../content';
import { getPersona } from '../lib/persona';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { gameCheck as G, type BudgetBand, type Screen } from './content';

/* ---------- tracking ---------- */

export type V2Event = 'presence_view' | 'explainer_play' | 'persona_select' | 'game_check' | 'build_save' | 'build_share' | 'partner_click';

/**
 * Pushes in the same shape as the locked track() ({ event, persona, ...params }) so existing
 * GTM triggers keep working. Event names that already exist are reused, never duplicated.
 */
export function trackV2(event: V2Event, params: Record<string, string | number | boolean | undefined>) {
  const payload = { event, persona: getPersona() ?? 'none', layer: 'home_v2', ...params };
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  } catch {
    /* never let tracking break the page */
  }
  if (import.meta.env.DEV) console.info('[dataLayer]', payload);
}

/* ---------- sellers: exact listing + UTM (campaign = persona id, or "home") ---------- */

export const campaignV2 = (persona: PersonaId | null) => persona ?? 'home';

export function sellerHrefV2(seller: SellerId, product: ProductId, persona: PersonaId | null) {
  const url = new URL(listings[product][seller]);
  url.searchParams.set('utm_source', 'amdhub');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', campaignV2(persona));
  return url.toString();
}

/* ---------- game check ---------- */

export function matchBuild(budget: BudgetBand, screen: Screen) {
  return G.recommend[budget][screen];
}

export function pairLabel(id: BuildId) {
  const b = builds[id];
  const cpu = b.cpu ? catalog[b.cpu].name : '';
  const gpu = b.gpu ? catalog[b.gpu].name : G.builtInGpu;
  return { cpu, gpu };
}

/** Illustrative plain-words level for one game on one build and screen. */
export function levelFor(build: BuildId, weight: number, screen: Screen) {
  const score = G.tier[build] - weight - G.screenLoad[screen];
  return G.levels.find((l) => score >= l.min)!;
}

/* ---------- count-up that never hides the real number ---------- */

/**
 * Shows the final value by default. Only when the element starts below the fold (and motion
 * is allowed) does it drop to 0 and count up as it scrolls into view. Uses a scroll check, not
 * an IntersectionObserver, so the number is right even where observers never fire.
 */
export function useScrollCount(target: number, duration = 900) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const [value, setValue] = useState(target);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return setValue(target);
    const below = () => el.getBoundingClientRect().top > window.innerHeight * 0.92;
    if (!below()) return setValue(target);
    setValue(0);
    let raf = 0;
    let started = false;
    const run = () => {
      started = true;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        setValue(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (!started && !below()) {
        window.removeEventListener('scroll', onScroll);
        run();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [target, reduced, duration]);

  return [ref, value] as const;
}
