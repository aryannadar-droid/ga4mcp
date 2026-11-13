import { catalog, personas, sellers, sellersIntro, type ProductId } from '../content';
import { usePersona } from '../lib/persona';
import { selectedProduct } from '../lib/sellers';
import { ExternalIcon, VerifiedIcon } from '../components/Icons';
import { findSeller as F } from './content';
import { campaignV2, sellerHrefV2, trackV2 } from './lib';

/**
 * Find a seller — merged section. New quiet design plus everything the original Sellers had:
 * product picker (shared with "View sellers" on the product cards), persona-first ordering with
 * "Best match for you", verified ticks and seller CTAs. Owns the #sellers anchor every
 * "Where to buy" points to. Exact product pages only, UTM campaign = persona id or "home".
 */
export function FindSeller() {
  const persona = usePersona();
  const picked = selectedProduct.use();
  const product: ProductId = picked ?? (persona ? personas[persona].heroProduct : F.defaultProduct);
  const ordered = persona ? [...sellers].sort((a, b) => Number(b.persona === persona) - Number(a.persona === persona)) : sellers;

  return (
    <section id="sellers" aria-labelledby="v2-seller-title" className="scroll-mt-20 border-t border-[var(--v2-line)] py-14 sm:py-20">
      <div className="container-x">
        <h2 id="v2-seller-title" className="font-display text-2xl font-semibold sm:text-3xl">
          {F.title}
        </h2>
        <p className="mt-2 text-[var(--v2-muted)]">{F.sub}</p>

        {/* merged: product picker */}
        <label className="mt-6 flex max-w-md flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-3">
          <span className="shrink-0 text-[var(--v2-muted)]">{sellersIntro.productLabel}</span>
          <span className="relative min-w-0 flex-1">
            <select
              value={product}
              onChange={(e) => selectedProduct.set(e.target.value as ProductId)}
              className="h-12 w-full cursor-pointer appearance-none rounded-full border border-[var(--v2-line)] bg-[var(--v2-black-2)] pr-10 pl-4 font-medium text-[var(--v2-text)]"
            >
              {(Object.keys(catalog) as ProductId[]).map((id) => (
                <option key={id} value={id}>
                  {catalog[id].name}
                </option>
              ))}
            </select>
            <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[var(--v2-muted)]">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </label>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ordered.map((s) => {
            const href = sellerHrefV2(s.id, product, persona);
            const match = persona === s.persona;
            return (
              <li key={s.id}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener"
                  data-buy="seller"
                  onClick={() =>
                    // brief params + the original partner_click params (section stays "sellers")
                    trackV2('partner_click', {
                      section: 'sellers',
                      partner_name: s.name,
                      partner_type: F.types[s.id],
                      product: catalog[product].name,
                      persona_id: persona ?? 'home',
                      seller_name: s.name,
                      link_url: href,
                      utm_campaign: campaignV2(persona),
                    })
                  }
                  className="group flex h-full flex-col rounded-2xl border border-[var(--v2-line)] p-5 transition-colors hover:border-[var(--v2-text)]"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--v2-gold-soft)]">
                      <VerifiedIcon width={16} height={16} className="text-[var(--v2-gold)]" />
                      {sellersIntro.verified}
                    </span>
                    {match && <span className="rounded-full border border-[var(--v2-line)] px-2 py-0.5 text-[11px]">{sellersIntro.forYou}</span>}
                  </span>
                  <span className="mt-4 font-semibold">{s.name}</span>
                  <span className="text-sm text-[var(--v2-muted)]">{s.kind}</span>
                  <span className="mt-3 text-sm">{personas[s.persona].trustLine}</span>
                  <span className="mt-auto flex items-center justify-between gap-2 pt-5 text-sm font-semibold">
                    <span className="min-w-0 truncate">{s.cta}</span>
                    <ExternalIcon width={16} height={16} className="shrink-0 text-[var(--v2-muted)] group-hover:text-[var(--v2-text)]" />
                  </span>
                  <span className="mt-1 truncate text-xs text-[var(--v2-muted)]">{catalog[product].name}</span>
                  <span className="sr-only"> {sellersIntro.newTab}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
