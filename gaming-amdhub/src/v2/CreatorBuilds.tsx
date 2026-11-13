import { useState } from 'react';
import { catalog } from '../content';
import { configFromBuild, encodeConfig } from '../lib/buildConfig';
import { writeStore } from '../lib/storage';
import { creatorBuilds, creatorsIntro as C, type CreatorBuild } from './content';
import { trackV2 } from './lib';

/** Builds from India's creators. The only horizontal scroller in the new layer. Data is SAMPLE (see content). */
export function CreatorBuilds() {
  return (
    <section aria-labelledby="v2-creators-title" className="py-16 sm:py-24">
      <div className="container-x">
        <h2 id="v2-creators-title" className="v2-display text-[clamp(2.1rem,6vw,3.8rem)]">
          {C.title}
        </h2>
        <p className="mt-3 text-lg text-[var(--v2-muted)]">{C.sub}</p>
        <ul className="no-scrollbar relative -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6">
          {creatorBuilds.map((c) => (
            <li key={c.id} className="w-[80%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]">
              <Card c={c} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Card({ c }: { c: CreatorBuild }) {
  const [msg, setMsg] = useState<string | null>(null);
  const cfg = { ...configFromBuild(null), cpu: c.cpu, gpu: c.gpu };
  const url = () => `${window.location.origin}/build-your-pc?${encodeConfig(cfg)}`;
  const copy = async () => {
    // track first: clipboard access can stall or be refused
    trackV2('build_share', { section: 'v2_creators', build_id: c.id, build: c.id, channel: 'copy', method: 'copied' });
    try {
      await navigator.clipboard.writeText(url());
      setMsg(C.copied);
    } catch {
      setMsg(url());
    }
  };
  const save = () => {
    writeStore(`amdhub.v2.creator.${c.id}`, encodeConfig(cfg));
    trackV2('build_save', { section: 'v2_creators', build_id: c.id, build: c.id, channel: 'device' });
    setMsg(C.saved);
  };
  const initials = c.useCase.split(' ').slice(0, 2).map((w) => w[0]).join('');
  return (
    <article className="flex h-full flex-col rounded-3xl border border-[var(--v2-line)] bg-[var(--v2-black-2)] p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-full font-display font-bold text-[var(--v2-black)]" style={{ background: 'linear-gradient(135deg, var(--v2-gold), var(--v2-gold-soft))' }}>
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{c.handle}</span>
          <span className="block text-sm text-[var(--v2-muted)]">
            {c.useCase} · {c.city}
          </span>
        </span>
        <span className="ml-auto rounded-full border border-[var(--v2-line)] px-2 py-0.5 text-[10px] tracking-wide text-[var(--v2-muted)] uppercase">{C.sampleTag}</span>
      </div>
      <p className="mt-5 font-display text-lg leading-snug font-semibold">
        {catalog[c.cpu].name}
        <br />
        <span className="text-[var(--v2-gold-soft)]">{c.gpu === 'none' ? 'Radeon 760M (built in)' : catalog[c.gpu].name}</span>
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        <button type="button" className="btn v2-btn-quiet min-h-11 px-4 text-sm" onClick={copy}>
          {C.copy}
        </button>
        <button type="button" className="btn v2-btn-quiet min-h-11 px-4 text-sm" onClick={save}>
          {C.save}
        </button>
        {msg && (
          <span className="text-xs text-[var(--v2-muted)]" aria-live="polite">
            {msg}
          </span>
        )}
      </div>
    </article>
  );
}
