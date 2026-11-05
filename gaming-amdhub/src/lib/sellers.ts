import { catalog, listings, personas, type PersonaId, type ProductId, type SellerId } from '../content';
import { createStore } from './store';

/** utm_campaign = persona slug; visitors without a saved persona count as "general". */
export const utmCampaign = (persona: PersonaId | null) => persona ?? 'general';

/** Exact product listing for a seller, tagged utm_source=amdhub&utm_medium=referral&utm_campaign=[persona]. */
export function sellerHref(seller: SellerId, product: ProductId, persona: PersonaId | null) {
  const url = new URL(listings[product][seller]);
  url.searchParams.set('utm_source', 'amdhub');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', utmCampaign(persona));
  return url.toString();
}

export const productName = (id: ProductId) => catalog[id].name;

/** Product the Sellers section shows listings for. Set by "View sellers" on a product card. */
export const selectedProduct = createStore<ProductId | null>(null);

export function defaultProduct(persona: PersonaId | null): ProductId {
  return persona ? personas[persona].heroProduct : 'r7-5700x3d';
}
