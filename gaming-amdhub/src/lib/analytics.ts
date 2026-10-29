import { getPersona } from './persona';

/** GA4 event map. Parameters are flat so they map 1:1 to GA4 custom dimensions. */
export type EventName =
  | 'persona_select'
  | 'game_check'
  | 'build_save'
  | 'build_share'
  | 'compat_check'
  | 'compare_view'
  | 'alert_signup'
  | 'store_search'
  | 'partner_click'
  | 'bundle_redeem_click'
  | 'builder_start';

export interface EventParams {
  section: string;
  persona?: string;
  product?: string;
  seller_name?: string;
  link_url?: string;
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export function track(event: EventName, params: EventParams) {
  const payload = { event, persona: getPersona() ?? 'none', ...params };
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  } catch {
    /* never let tracking break the page */
  }
  if (import.meta.env.DEV) console.info('[dataLayer]', payload);
}

/** partner_click always carries seller_name, product, persona and link_url. */
export function trackPartner(p: { seller_name: string; product: string; link_url: string; section: string }) {
  track('partner_click', p);
}
