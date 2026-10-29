import { hero, sources } from '../content';
import { track } from '../lib/analytics';
import { Link } from '../lib/router';
import { OfferChip } from '../components/OfferChip';
import { ArrowRight } from '../components/Icons';
import { WhereToBuy } from '../components/WhereToBuy';
import { HeroChip } from './HeroChip';

export function Hero() {
  const words = hero.headline.split(' ');
  const footnote = sources.findIndex((s) => s.id === hero.footnoteId) + 1;

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
      {/* edge lighting */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{ background: 'radial-gradient(60% 60% at 70% 20%, color-mix(in srgb, var(--orange) 14%, transparent), transparent 70%)' }}
      />
      <div className="container-x relative grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
        <div className="min-w-0">
          <p className="eyebrow mb-5">{hero.eyebrow}</p>
          <h1 id="hero-title" className="text-[clamp(2.4rem,8.4vw,5.25rem)] leading-[0.98] font-bold">
            {words.map((w, i) => {
              const accent = w.replace(/[^\w]/g, '') === hero.headlineAccent;
              return (
                <span key={i}>
                  <span className={`word-reveal ${accent ? 'text-heat-grad' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
                    {w}
                  </span>
                  {i < words.length - 1 && ' '}
                </span>
              );
            })}
            <sup className="ml-1 align-super text-base font-medium">
              <a href={`#src-${hero.footnoteId}`} className="link" aria-label={`Source ${footnote}`}>
                {footnote}
              </a>
            </sup>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">{hero.sub}</p>
          <div className="mt-6">
            <OfferChip />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/#doors" className="btn btn-primary min-h-12 px-6 text-base" onClick={() => track('builder_start', { section: 'hero' })}>
              {hero.primaryCta}
              <ArrowRight width={18} height={18} />
            </Link>
            <WhereToBuy section="hero" className="btn btn-ghost min-h-12 px-6 text-base" label={hero.secondaryCta} />
          </div>
          <p className="mt-6 text-xs text-muted">
            <sup>{footnote}</sup> {sources[footnote - 1]?.text}
          </p>
        </div>
        <HeroChip />
      </div>
    </section>
  );
}
