import type { ReactNode } from 'react';
import { buildCardLabels as L, catalog, type Build } from '../content';
import { formatINR } from '../lib/format';

interface Props {
  build: Build;
  /** Orange "act" highlight, e.g. the build that fits the chosen budget. */
  active?: boolean;
  tag?: string;
  /** Extra line under the four (FPS for the chosen game, work note…). */
  children?: ReactNode;
}

/**
 * Every build card, everywhere, shows the same four lines:
 * specs · what the parts do in plain words · good for · what changes vs the build before.
 */
export function BuildCard({ build: b, active = false, tag, children }: Props) {
  const cpu = b.cpu ? `${catalog[b.cpu].name} · ${catalog[b.cpu].specs}` : b.cpuText;
  const gpu = b.gpu ? `${catalog[b.gpu].name}${catalog[b.gpu].name.includes('GB') ? '' : ` · ${catalog[b.gpu].specs}`}` : b.gpuText;
  return (
    <article className={`flex h-full flex-col rounded-2xl border p-5 transition-colors sm:p-6 ${active ? 'border-accent bg-raised' : 'border-line'}`}>
      {tag && <span className={`mb-3 self-start rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-accent text-ink' : 'border border-line text-fg'}`}>{tag}</span>}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-xl font-semibold">{b.name}</h3>
        <span className="text-sm font-medium text-muted">{b.band}</span>
      </div>
      <p className="placeholder-val mt-1 font-display text-2xl font-semibold text-gold-soft">
        {formatINR(b.price)} <span className="font-sans text-xs font-normal text-muted">{L.price}</span>
      </p>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{L.specs}</dt>
          <dd className="mt-0.5">
            {cpu}
            <br />
            {gpu}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{L.plain}</dt>
          <dd className="mt-0.5">{b.plain}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{L.goodFor}</dt>
          <dd className="mt-0.5">{b.goodFor}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{b.changes ? L.changes : L.firstBuild}</dt>
          <dd className="mt-0.5 font-medium">{b.changes ?? '–'}</dd>
        </div>
      </dl>
      {children && <div className="mt-auto border-t border-line pt-3 text-sm">{children}</div>}
    </article>
  );
}
