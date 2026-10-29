import { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { personaOrder, personas, personasIntro, type PersonaId } from '../content';
import { track } from '../lib/analytics';
import { DUR, EASE, fadeUp, stagger } from '../lib/motion';
import { personaFromAnswers, savePersona, usePersona } from '../lib/persona';
import { Link } from '../lib/router';
import { ArrowRight, CheckIcon } from '../components/Icons';
import { SectionHeading } from '../components/SectionHeading';

function choose(id: PersonaId, method: 'door' | 'quiz') {
  savePersona(id);
  track('persona_select', { section: 'persona_doors', persona: id, method });
}

export function PersonaDoors() {
  const saved = usePersona();
  return (
    <section id="doors" aria-labelledby="doors-title" className="relative py-16 sm:py-24">
      <div className="container-x">
        <SectionHeading id="doors-title" eyebrow={personasIntro.eyebrow} title={personasIntro.title} sub={personasIntro.sub} />
        <m.ul
          className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5"
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        >
          {personaOrder.map((id, i) => (
            <m.li key={id} variants={fadeUp}>
              <Door id={id} index={i} saved={saved === id} />
            </m.li>
          ))}
        </m.ul>
        <Quiz />
      </div>
    </section>
  );
}

function Door({ id, index, saved }: { id: PersonaId; index: number; saved: boolean }) {
  const p = personas[id];
  return (
    <Link
      href={p.route}
      onClick={() => choose(id, 'door')}
      className="group relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-transform duration-[400ms] ease-[var(--ease-out)] hover:-translate-y-1.5 focus-visible:-translate-y-1.5 active:scale-[0.98] sm:min-h-[300px] sm:p-7"
    >
      {/* orange edge glow: opacity-only transition */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-[400ms] group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{ boxShadow: 'inset 0 0 0 1px var(--orange), inset 0 -60px 80px -60px color-mix(in srgb, var(--orange) 45%, transparent)' }}
      />
      <div className="flex items-start justify-between">
        <span className="font-display text-sm text-muted">0{index + 1}</span>
        {saved && (
          <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-fg">
            <CheckIcon width={14} height={14} /> {personasIntro.savedLabel}
          </span>
        )}
      </div>
      <h3 className="mt-6 text-2xl leading-tight font-semibold sm:text-[1.7rem]">{p.door.title}</h3>
      <p className="mt-3 text-muted">{p.door.line}</p>
      <p className="mt-4 text-sm font-medium text-fg">{p.door.budget}</p>
      <span
        aria-hidden
        className="mt-auto flex size-11 items-center justify-center self-end rounded-full border border-line text-fg transition-[transform,background-color] duration-[400ms] group-hover:translate-x-1 group-hover:border-accent group-hover:bg-accent group-hover:text-ink"
      >
        <ArrowRight />
      </span>
      {/* preview: slides up on hover/focus; always visible on touch screens */}
      <div className="pointer-events-none mt-5 rounded-xl border border-line bg-raised/95 p-4 transition-[transform,opacity] duration-[400ms] ease-[var(--ease-out)] [@media(hover:hover)]:absolute [@media(hover:hover)]:inset-x-4 [@media(hover:hover)]:bottom-4 [@media(hover:hover)]:translate-y-[calc(100%+1rem)] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:translate-y-0 [@media(hover:hover)]:group-focus-visible:opacity-100">
        <p className="eyebrow mb-2 text-[10px]">On this page</p>
        <ul className="space-y-1.5 text-sm">
          {p.door.preview.map((line) => (
            <li key={line} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}

function Quiz() {
  const q = personasIntro.quiz;
  const [open, setOpen] = useState(false);
  const [owns, setOwns] = useState<boolean | null>(null);
  const [work, setWork] = useState<boolean | null>(null);
  const result = owns === true ? personaFromAnswers(true, false) : owns === false && work != null ? personaFromAnswers(false, work) : null;
  const reset = () => {
    setOwns(null);
    setWork(null);
  };

  const YesNo = ({ onAnswer, value, label }: { onAnswer: (v: boolean) => void; value: boolean | null; label: string }) => (
    <fieldset className="mt-4">
      <legend className="mb-3 font-medium">{label}</legend>
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button key={String(v)} type="button" className="chip min-w-20 justify-center" aria-pressed={value === v} onClick={() => onAnswer(v)}>
            {v ? q.yes : q.no}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="mt-8">
      <button type="button" className="link text-[15px] font-medium" aria-expanded={open} aria-controls="persona-quiz" onClick={() => setOpen((o) => !o)}>
        {personasIntro.quizToggle}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id="persona-quiz"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DUR.base, ease: EASE }}
            className="card mt-4 max-w-xl p-5 sm:p-6"
          >
            <YesNo label={q.q1} value={owns} onAnswer={(v) => (setOwns(v), setWork(null))} />
            {owns === false && <YesNo label={q.q2} value={work} onAnswer={setWork} />}
            <div aria-live="polite">
              {result && (
                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
                  <p>
                    <span className="text-muted">{q.result}</span> <strong>{personas[result].door.title}</strong>
                  </p>
                  <Link href={personas[result].route} className="btn btn-primary min-h-10 text-sm" onClick={() => choose(result, 'quiz')}>
                    {q.go} <ArrowRight width={16} height={16} />
                  </Link>
                  <button type="button" className="text-sm text-muted underline underline-offset-2" onClick={reset}>
                    {q.reset}
                  </button>
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
