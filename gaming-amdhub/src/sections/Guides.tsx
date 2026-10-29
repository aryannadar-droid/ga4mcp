import { m } from 'framer-motion';
import { guides, guidesIntro } from '../content';
import { fadeUp, stagger } from '../lib/motion';
import { Link } from '../lib/router';
import { ArrowRight } from '../components/Icons';
import { SectionHeading } from '../components/SectionHeading';

const art = [
  // simple geometric covers: no stock photos
  'radial-gradient(80% 80% at 20% 100%, color-mix(in srgb, var(--orange) 30%, transparent), transparent 60%)',
  'repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 2px, transparent 2px 12px), radial-gradient(60% 60% at 80% 30%, color-mix(in srgb, var(--gold) 22%, transparent), transparent 70%)',
  'conic-gradient(from 200deg at 70% 60%, transparent, color-mix(in srgb, var(--orange) 22%, transparent), transparent 40%)',
];

export function Guides() {
  return (
    <section id="guides" aria-labelledby="guides-title" className="py-16 sm:py-24">
      <div className="container-x">
        <SectionHeading id="guides-title" eyebrow={guidesIntro.eyebrow} title={guidesIntro.title} />
        <m.ul
          className="mt-10 grid gap-4 md:grid-cols-3"
          variants={stagger(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        >
          {guides.map((g, i) => (
            <m.li key={g.id} variants={fadeUp}>
              <Link href={g.href} className="group card relative flex h-full flex-col overflow-hidden transition-colors hover:border-muted">
                <div className="aspect-[16/8] border-b border-line" style={{ background: art[i % art.length] }} aria-hidden />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-semibold">{g.title}</h3>
                  <p className="mt-2 text-muted">{g.blurb}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-sm text-muted transition-[transform,opacity] duration-[400ms] ease-[var(--ease-out)] [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:translate-y-0 [@media(hover:hover)]:group-focus-visible:opacity-100">
                      {g.readTime}
                    </span>
                    <ArrowRight className="text-accent transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </m.li>
          ))}
        </m.ul>
      </div>
    </section>
  );
}
