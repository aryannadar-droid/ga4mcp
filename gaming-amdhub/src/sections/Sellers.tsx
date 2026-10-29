import { m } from 'framer-motion';
import { personas, sellers, sellersIntro } from '../content';
import { fadeUp, stagger } from '../lib/motion';
import { usePersona } from '../lib/persona';
import { ExternalIcon, VerifiedIcon } from '../components/Icons';
import { SectionHeading } from '../components/SectionHeading';
import { SellerLink } from '../components/SellerLink';

export function Sellers() {
  const persona = usePersona();
  // Saved persona's seller(s) — and therefore its trust line — come first.
  const ordered = persona ? [...sellers].sort((a, b) => Number(b.persona === persona) - Number(a.persona === persona)) : sellers;
  const product = persona ? personas[persona].heroProducts[0] : 'any';

  return (
    <section id="sellers" aria-labelledby="sellers-title" className="py-16 sm:py-24">
      <div className="container-x">
        <SectionHeading id="sellers-title" eyebrow={sellersIntro.eyebrow} title={sellersIntro.title} sub={sellersIntro.sub} />
        <m.ul
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
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
                {/* Name as text: no third-party logos in the prototype. */}
                <h3 className="mt-5 text-xl font-semibold">{s.name}</h3>
                <p className="text-sm text-muted">{s.kind}</p>
                <p className="mt-4 text-[15px]">{personas[s.persona].trustLine}</p>
                <SellerLink
                  href={s.href}
                  sellerName={s.name}
                  product={product}
                  section="sellers"
                  className="btn btn-ghost mt-6 w-full justify-between hover:border-accent"
                >
                  {s.cta}
                  <ExternalIcon width={18} height={18} className="text-accent" />
                </SellerLink>
              </m.li>
            );
          })}
        </m.ul>
      </div>
    </section>
  );
}
