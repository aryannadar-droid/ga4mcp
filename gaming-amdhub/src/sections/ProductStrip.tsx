import { m } from 'framer-motion';
import { products, productsIntro, type Product } from '../content';
import { track } from '../lib/analytics';
import { formatINR } from '../lib/format';
import { fadeUp, stagger } from '../lib/motion';
import { Link } from '../lib/router';
import { useCountUp } from '../hooks/useCountUp';
import { useInView } from '../hooks/useInView';
import { GoldBadge } from '../components/GoldBadge';
import { ArrowRight } from '../components/Icons';
import { SectionHeading } from '../components/SectionHeading';

export function ProductStrip() {
  return (
    <section id="products" aria-labelledby="products-title" className="py-16 sm:py-24">
      <div className="container-x">
        <SectionHeading id="products-title" eyebrow={productsIntro.eyebrow} title={productsIntro.title} sub={productsIntro.sub} />
        <m.ul
          className="no-scrollbar relative -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0"
          variants={stagger(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          aria-label="Products"
        >
          {products.map((p) => (
            <m.li key={p.id} variants={fadeUp} id={p.id === 'rx-9060-xt' ? 'graphics' : undefined} className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-auto">
              <ProductCard p={p} />
            </m.li>
          ))}
        </m.ul>
        <p className="mt-4 text-xs text-muted">{productsIntro.priceNote}</p>
      </div>
    </section>
  );
}

function ProductCard({ p }: { p: Product }) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.5 });
  const price = useCountUp(p.fromPrice, inView);
  return (
    <div ref={ref} className="card flex h-full flex-col overflow-hidden">
      <div className="relative">
        <img src={p.image} alt="" width={240} height={160} loading="lazy" decoding="async" className="aspect-[3/2] w-full object-cover" />
        {p.badge && <GoldBadge className="absolute top-3 left-3">{p.badge}</GoldBadge>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold">{p.name}</h3>
        <p className="mt-1 text-sm text-muted">
          <span className="font-medium text-fg">{p.stat}</span> {p.statLabel}
        </p>
        <p className="mt-5 text-sm text-muted">{productsIntro.fromLabel}</p>
        <p className="placeholder-val font-display text-3xl font-semibold text-gold-soft" aria-label={`${productsIntro.fromLabel} ${formatINR(p.fromPrice)}`}>
          {formatINR(price)}
        </p>
        <Link
          href={p.sellersHref}
          className="link mt-5 inline-flex items-center gap-1.5 self-start py-1 font-semibold"
          onClick={() => track('store_search', { section: 'from_strip', product: p.name })}
        >
          {productsIntro.cta}
          <ArrowRight width={16} height={16} />
          <span className="sr-only">for {p.name}</span>
        </Link>
      </div>
    </div>
  );
}
