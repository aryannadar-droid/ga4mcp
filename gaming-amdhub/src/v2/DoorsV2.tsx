import { personas } from '../content';
import { savePersona } from '../lib/persona';
import { Link } from '../lib/router';
import { ArrowRight } from '../components/Icons';
import { doorsV2 } from './content';
import { trackV2 } from './lib';

/** Three doors to the existing persona pages (unchanged). Full-width stacked cards on phones. */
export function DoorsV2() {
  return (
    <section aria-labelledby="v2-doors-title" className="py-16 sm:py-24">
      <div className="container-x">
        <h2 id="v2-doors-title" className="v2-display text-[clamp(2.1rem,6vw,3.8rem)]">
          {doorsV2.title}
        </h2>
        <ul className="mt-10 grid gap-3 md:grid-cols-3 md:gap-4">
          {doorsV2.doors.map((d) => (
            <li key={d.id}>
              <Link
                href={personas[d.id].route}
                onClick={() => {
                  savePersona(d.id);
                  // reused event name; brief param persona_id + the locked params, so both reports work
                  trackV2('persona_select', { section: 'v2_doors', persona_id: d.id, persona: d.id, method: 'door_v2' });
                }}
                className="group flex min-h-[112px] w-full items-center gap-5 rounded-2xl border border-[var(--v2-line)] bg-[var(--v2-black-2)] p-5 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[var(--v2-gold)] sm:p-6 md:min-h-[200px] md:flex-col md:items-start"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[var(--v2-gold)] font-display text-lg font-bold text-[var(--v2-gold-soft)]">{d.letter}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-semibold sm:text-2xl">{d.title}</span>
                  <span className="mt-1 block text-[var(--v2-muted)]">“{d.line}”</span>
                </span>
                <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1 md:self-end" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
