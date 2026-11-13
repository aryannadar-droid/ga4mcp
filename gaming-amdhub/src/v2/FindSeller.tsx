import { catalog, personas, sellers } from '../content';
import { usePersona } from '../lib/persona';
import { ExternalIcon, VerifiedIcon } from '../components/Icons';
import { anchors, findSeller as F } from './content';
import { campaignV2, sellerHrefV2, trackV2 } from './lib';

/** Quiet, at the end: four named partners, one trust line each, exact product pages with UTM. */
export function FindSeller() {
  const persona = usePersona();
  const product = persona ? personas[persona].heroProduct : F.defaultProduct;
  return (
    <section id={anchors.seller} aria-labelledby="v2-seller-title" className="scroll-mt-20 border-t border-[var(--v2-line)] py-14 sm:py-20">
      <div className="container-x">
        <h2 id="v2-seller-title" className="font-display text-2xl font-semibold sm:text-3xl">
          {F.title}
        </h2>
        <p className="mt-2 text-[var(--v2-muted)]">
          {F.sub} {F.forProduct} {catalog[product].name}.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sellers.map((s) => {
            const href = sellerHrefV2(s.id, product, persona);
            return (
              <li key={s.id}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener"
                  onClick={() =>
                    // reused event name: brief params + the locked partner_click params
                    trackV2('partner_click', {
                      section: 'v2_find_seller',
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
                    <span className="font-semibold">{s.name}</span>
                    <ExternalIcon width={16} height={16} className="shrink-0 text-[var(--v2-muted)] group-hover:text-[var(--v2-text)]" />
                  </span>
                  <span className="mt-3 flex items-start gap-2 text-sm text-[var(--v2-muted)]">
                    <VerifiedIcon width={16} height={16} className="mt-0.5 shrink-0 text-[var(--v2-gold)]" />
                    {personas[s.persona].trustLine}
                  </span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
