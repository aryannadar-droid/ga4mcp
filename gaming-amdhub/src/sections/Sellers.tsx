import { m } from 'framer-motion';
import { catalog, personas, sellers, sellersIntro, type ProductId } from '../content';
import { fadeUp, stagger } from '../lib/motion';
import { usePersona } from '../lib/persona';
import { defaultProduct, selectedProduct } from '../lib/sellers';
import { ExternalIcon, VerifiedIcon } from '../components/Icons';
import { SectionHeading } from '../components/SectionHeading';
import { SellerLink } from '../components/SellerLink';

/** Exactly four curated, named sellers. Each links to the exact listing of the chosen product. */
export function Sellers() {
  const persona = usePersona();
  const picked = selectedProduct.use();
  const product: ProductId = picked ?? defaultProduct(persona);
  // Saved persona's seller(s) — and therefore its trust line — come first.
  const ordered = persona ? [...sellers].sort((a, b) => Number(b.persona === persona) - Number(a.persona === persona)) : sellers;

  return (
    <section id="sellers" aria-labelledby="sellers-title" className="py-16 sm:py-24">
      <div className="container-x">
        <SectionHeading id="sellers-title" eyebrow={sellersIntro.eyebrow} title={sellersIntro.title} sub={sellersIntro.sub} />
        <label className="mt-8 flex max-w-md flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-3">
          <span className="shrink-0 text-muted">{sellersIntro.productLabel}</span>
          <span className="relative min-w-0 flex-1">
            <select
              value={product}
              onChange={(e) => selectedProduct.set(e.target.value as ProductId)}
              className="h-11 w-full cursor-pointer appearance-none rounded-full border border-line bg-raised pr-10 pl-4 font-medium text-fg"
            >
              {(Object.keys(catalog) as ProductId[]).map((id) => (
                <option key={id} value={id}>
                  {catalog[id].name}
                </option>
              ))}
            </select>
            <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </label>
        <m.ul
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={stagger(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        >
          {ordered.map((s) => {
            const match = persona === s.persona;
            return (
              <m.li key={s.id} variants={fadeUp} className="card flex flex-col p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-soft">
                    <VerifiedIcon width={16} height={16} className="text-gold" />
                    {sellersIntro.verified}
                  </span>
                  {match && <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg">{sellersIntro.forYou}</span>}
                </div>
                {/* Named sellers as text: no logo wall. */}
                <h3 className="mt-5 text-xl font-semibold">{s.name}</h3>
                <p className="text-sm text-muted">{s.kind}</p>
                <p className="mt-4 text-[15px]">{personas[s.persona].trustLine}</p>
                <SellerLink seller={s.id} product={product} section="sellers" className="btn btn-ghost mt-6 w-full justify-between hover:border-accent">
                  <span className="min-w-0 truncate">{s.cta}</span>
                  <ExternalIcon width={18} height={18} className="shrink-0 text-accent" />
                </SellerLink>
                <p className="mt-2 truncate text-xs text-muted">{catalog[product].name}</p>
              </m.li>
            );
          })}
        </m.ul>
      </div>
    </section>
  );
}
