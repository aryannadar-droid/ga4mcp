import { m } from 'framer-motion';
import { guides, guidesIntro, type Guide } from '../content';
import { fadeUp, stagger } from '../lib/motion';
import { usePersona } from '../lib/persona';
import { Link } from '../lib/router';
import { ArrowRight } from '../components/Icons';
import { SectionHeading } from '../components/SectionHeading';

const art = [
  // simple geometric covers: no stock photos
  'radial-gradient(80% 80% at 20% 100%, color-mix(in srgb, var(--orange) 30%, transparent), transparent 60%)',
  'repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 2px, transparent 2px 12px), radial-gradient(60% 60% at 80% 30%, color-mix(in srgb, var(--orange) 18%, transparent), transparent 70%)',
  'conic-gradient(from 200deg at 70% 60%, transparent, color-mix(in srgb, var(--orange) 22%, transparent), transparent 40%)',
];

/** One guide per persona, in the format that persona researches in; the saved persona's comes first. */
export function Guides() {
  const persona = usePersona();
  const main = guides.filter((g) => g.persona);
  const ordered = persona ? [...main].sort((a, b) => Number(b.persona === persona) - Number(a.persona === persona)) : main;
  const extra = guides.filter((g) => !g.persona);

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
          {ordered.map((g, i) => (
            <m.li key={g.id} variants={fadeUp}>
              <GuideCard g={g} cover={art[i % art.length]} />
            </m.li>
          ))}
        </m.ul>
        {extra.length > 0 && (
          <>
            <h3 className="eyebrow mt-10 mb-4">{guidesIntro.moreTitle}</h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {extra.map((g) => (
                <li key={g.id}>
                  <Link href={g.href} className="group card flex items-center justify-between gap-4 p-5 transition-colors hover:border-muted">
                    <span>
                      <span className="block font-display text-lg font-semibold">{g.title}</span>
                      <span className="mt-1 block text-sm text-muted">{g.blurb}</span>
                    </span>
                    <ArrowRight className="shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function GuideCard({ g, cover }: { g: Guide; cover: string }) {
  return (
    <Link href={g.href} className="group card relative flex h-full flex-col overflow-hidden transition-colors hover:border-muted">
      <div className="relative aspect-[16/8] border-b border-line" style={{ background: cover }}>
        <span className="absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold">{g.format}</span>
      </div>
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
  );
}
