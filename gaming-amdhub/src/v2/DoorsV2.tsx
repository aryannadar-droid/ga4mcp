import { useState } from 'react';
import { personas, personasIntro, type PersonaId } from '../content';
import { personaFromAnswers, savePersona, usePersona } from '../lib/persona';
import { Link } from '../lib/router';
import { ArrowRight, CheckIcon } from '../components/Icons';
import { doorsV2 } from './content';
import { trackV2 } from './lib';

type Method = 'door' | 'quiz' | 'need_line';

/** persona_select: brief param persona_id + the original params (section, persona, method). */
function choose(id: PersonaId, method: Method) {
  savePersona(id);
  trackV2('persona_select', { section: 'persona_doors', persona_id: id, persona: id, method });
}

/**
 * "What are you building?" — merged section. New design (three stacked doors) plus everything
 * the original doors had: "Saved" badge, what's on each page, the need-led line and the
 * two-question quiz. Owns the #doors anchor (Start building, the pinned bar, persona pages' back link).
 */
export function DoorsV2() {
  const saved = usePersona();
  const need = personasIntro.need;
  return (
    <section id="doors" aria-labelledby="v2-doors-title" className="scroll-mt-20 py-16 sm:py-24">
      <div className="container-x">
        <h2 id="v2-doors-title" className="v2-display text-[clamp(2.1rem,6vw,3.8rem)]">
          {doorsV2.title}
        </h2>
        <ul className="mt-10 grid gap-3 md:grid-cols-3 md:gap-4">
          {doorsV2.doors.map((d) => (
            <li key={d.id}>
              <Link
                href={personas[d.id].route}
                onClick={() => choose(d.id, 'door')}
                className="group flex h-full min-h-[112px] w-full items-center gap-5 rounded-2xl border border-[var(--v2-line)] bg-[var(--v2-black-2)] p-5 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[var(--v2-gold)] sm:p-6 md:min-h-[230px] md:flex-col md:items-start"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[var(--v2-gold)] font-display text-lg font-bold text-[var(--v2-gold-soft)]">{d.letter}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-xl font-semibold sm:text-2xl">{d.title}</span>
                    {saved === d.id && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--v2-line)] px-2 py-0.5 text-xs">
                        <CheckIcon width={12} height={12} /> {personasIntro.savedLabel}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[var(--v2-muted)]">“{d.line}”</span>
                  {/* merged: what's on that page (was the hover preview) */}
                  <span className="mt-2 hidden text-xs text-[var(--v2-muted)] md:block">{personas[d.id].door.preview.join(' · ')}</span>
                  <span className="mt-1 block text-xs font-medium text-[var(--v2-gold-soft)]">{personas[d.id].door.budget}</span>
                </span>
                <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1 md:mt-auto md:self-end" />
              </Link>
            </li>
          ))}
        </ul>

        {/* merged: need-led line */}
        <p className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-lg">
          <strong className="font-display font-semibold">{need.text}</strong>
          <span className="text-[var(--v2-muted)]">{need.detail}</span>
          <Link href={need.href} className="inline-flex items-center gap-1 font-semibold text-[var(--v2-gold-soft)] underline-offset-4 hover:underline" onClick={() => choose('new-build', 'need_line')}>
            {need.cta} <ArrowRight width={16} height={16} />
          </Link>
        </p>
        <Quiz />
      </div>
    </section>
  );
}

/** Merged: the two yes/no questions that put a visitor in exactly one persona. */
function Quiz() {
  const q = personasIntro.quiz;
  const [open, setOpen] = useState(false);
  const [owns, setOwns] = useState<boolean | null>(null);
  const [work, setWork] = useState<boolean | null>(null);
  const result = owns === true ? personaFromAnswers(true, false) : owns === false && work != null ? personaFromAnswers(false, work) : null;

  const YesNo = ({ label, value, onAnswer }: { label: string; value: boolean | null; onAnswer: (v: boolean) => void }) => (
    <fieldset className="mt-4">
      <legend className="mb-3 font-medium">{label}</legend>
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button key={String(v)} type="button" className="v2-chip min-w-24" aria-pressed={value === v} onClick={() => onAnswer(v)}>
            {v ? q.yes : q.no}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="mt-6">
      <button type="button" className="text-[15px] font-semibold text-[var(--v2-gold-soft)] underline-offset-4 hover:underline" aria-expanded={open} aria-controls="persona-quiz" onClick={() => setOpen((o) => !o)}>
        {personasIntro.quizToggle}
      </button>
      {open && (
        <div id="persona-quiz" className="mt-4 max-w-xl rounded-2xl border border-[var(--v2-line)] bg-[var(--v2-black-2)] p-5 sm:p-6">
          <YesNo label={q.q1} value={owns} onAnswer={(v) => (setOwns(v), setWork(null))} />
          {owns === false && <YesNo label={q.q2} value={work} onAnswer={setWork} />}
          <div aria-live="polite">
            {result && (
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--v2-line)] pt-5">
                <p>
                  <span className="text-[var(--v2-muted)]">{q.result}</span> <strong>{personas[result].door.title}</strong>
                </p>
                <Link href={personas[result].route} className="btn v2-btn-act min-h-11 text-sm" onClick={() => choose(result, 'quiz')}>
                  {q.go} <ArrowRight width={16} height={16} />
                </Link>
                <button
                  type="button"
                  className="text-sm text-[var(--v2-muted)] underline underline-offset-2"
                  onClick={() => {
                    setOwns(null);
                    setWork(null);
                  }}
                >
                  {q.reset}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
