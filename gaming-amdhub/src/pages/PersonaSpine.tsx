import { useEffect, type ReactNode } from 'react';
import { m } from 'framer-motion';
import { personaPageCommon, personas, sellers, type PersonaId } from '../content';
import { fadeUp } from '../lib/motion';
import { getPersona, savePersona } from '../lib/persona';
import { Link } from '../lib/router';
import { ArrowLeft, ExternalIcon, VerifiedIcon } from '../components/Icons';
import { SellerLink } from '../components/SellerLink';

interface Props {
  persona: PersonaId;
  eyebrow: string;
  title: string;
  sub: string;
  /** Blocks 1–3: the persona's answer. */
  answer: [ReactNode, ReactNode, ReactNode];
  /** Product name passed to partner_click on the exit button. */
  product: string;
  /** Block 6: the low-commitment step. */
  step: ReactNode;
}

/**
 * The six-block spine shared by every persona page:
 * 1–3 answer · 4 exit to a seller · 5 trust line · 6 low-commitment step.
 */
export function PersonaSpine({ persona, eyebrow, title, sub, answer, product, step }: Props) {
  const p = personas[persona];
  const primary = sellers.find((s) => s.id === p.sellers[0])!;

  // Landing here (from a door, the quiz or a shared link) counts as choosing this persona.
  useEffect(() => {
    if (getPersona() !== persona) savePersona(persona);
  }, [persona]);

  return (
    <main id="main" className="pt-24 sm:pt-28">
      <div className="container-x">
        <Link href="/#doors" className="inline-flex items-center gap-2 rounded-full py-2 text-sm text-muted hover:text-fg">
          <ArrowLeft width={16} height={16} /> {personaPageCommon.back}
        </Link>
        {/* CSS-only reveal so the LCP heading never waits on the motion runtime */}
        <header className="mt-6 max-w-3xl">
          <p className="fade-reveal eyebrow mb-3">{eyebrow}</p>
          <h1 className="fade-reveal text-[clamp(2.1rem,6vw,3.75rem)] leading-[1.02] font-bold" style={{ animationDelay: '60ms' }}>
            {title}
          </h1>
          <p className="fade-reveal mt-4 text-lg text-muted" style={{ animationDelay: '120ms' }}>
            {sub}
          </p>
        </header>

        <div className="mt-12 space-y-6">
          {answer.map((block, i) => (
            <m.section
              key={i}
              aria-label={`Step ${i + 1}`}
              className="card p-5 sm:p-8"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '0px 0px -8% 0px' }}
            >
              {block}
            </m.section>
          ))}

          {/* 4 · exit to a seller  +  5 · trust line */}
          <m.section
            aria-label="Where to buy"
            className="card relative overflow-hidden p-5 sm:p-8"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="eyebrow mb-3">{personaPageCommon.trustTitle}</h2>
                <p className="flex items-center gap-2 text-lg font-medium">
                  <VerifiedIcon className="shrink-0 text-gold" />
                  <span>{p.trustLine}</span>
                </p>
              </div>
              <SellerLink href={primary.href} sellerName={primary.name} product={product} section={`persona_${persona}`} className="btn btn-primary min-h-12 px-6 text-base">
                {personaPageCommon.exitPrefix} {primary.name}
                <ExternalIcon width={18} height={18} />
              </SellerLink>
            </div>
          </m.section>

          {/* 6 · low-commitment step */}
          <m.section
            aria-labelledby="step-title"
            className="rounded-2xl border border-dashed border-line p-5 sm:p-8"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <h2 id="step-title" className="eyebrow mb-4">
              {personaPageCommon.stepTitle}
            </h2>
            {step}
          </m.section>
        </div>
      </div>
    </main>
  );
}

export function BlockTitle({ children, n }: { children: ReactNode; n: number }) {
  return (
    <h2 className="mb-5 flex items-baseline gap-3 text-xl font-semibold sm:text-2xl">
      <span className="font-display text-sm text-muted">0{n}</span>
      {children}
    </h2>
  );
}

export function SourceLine({ source, date }: { source: string; date: string }) {
  return (
    <p className="mt-4 text-xs text-muted">
      {personaPageCommon.sourcePrefix} {source}, {date}
    </p>
  );
}
