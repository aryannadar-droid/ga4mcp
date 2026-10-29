import { useEffect, useState } from 'react';
import { personaPageCommon, workPlayPage as c } from '../content';
import { track } from '../lib/analytics';
import { formatDate, formatINR } from '../lib/format';
import { shareLink } from '../lib/share';
import { useInView } from '../hooks/useInView';
import { AlertForm } from '../components/AlertForm';
import { DownloadIcon, ShareIcon } from '../components/Icons';
import { BlockTitle, PersonaSpine, SourceLine } from './PersonaSpine';

export default function WorkAndPlay() {
  const [cmpRef, cmpSeen] = useInView<HTMLDivElement>({ once: true, threshold: 0.4 });
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (cmpSeen) track('compare_view', { section: 'persona_work-play', product: c.builds.map((b) => b.parts[0]).join(' | '), compared: c.compare.columns.join(' | ') });
  }, [cmpSeen]);

  const share = async () => {
    const r = await shareLink(`${personaPageCommon.shareText}: ${c.builds.map((b) => b.name).join(' / ')}`);
    if (r !== 'failed') track('build_share', { section: 'persona_work-play', product: c.builds[0].parts[0], method: r });
    if (r === 'copied') setStatus(personaPageCommon.shared);
  };

  const block1 = (
    <>
      <BlockTitle n={1}>Creator and Professional builds</BlockTitle>
      <ul className="grid gap-4 md:grid-cols-2">
        {c.builds.map((b) => (
          <li key={b.id} className="rounded-2xl border border-line p-5 sm:p-6">
            <h3 className="text-xl font-semibold">{b.name}</h3>
            <p className="placeholder-val mt-1 font-display text-2xl font-semibold text-gold-soft">{formatINR(b.price)}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {b.parts.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <ul className="mt-4 space-y-1 border-t border-line pt-3 text-sm text-muted">
              {b.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );

  const block2 = (
    <div ref={cmpRef}>
      <BlockTitle n={2}>{c.compare.title}</BlockTitle>
      <p className="-mt-3 mb-5 text-muted">{c.compare.sub}</p>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium text-muted">
                <span className="sr-only">Measure</span>
              </th>
              {c.compare.columns.map((col, i) => (
                <th key={col} scope="col" className={`py-2 pr-3 font-semibold ${i === 0 ? 'text-accent' : ''}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.compare.rows.map((r) => (
              <tr key={r.label} className="border-t border-line">
                <th scope="row" className="py-3 pr-3 font-medium text-muted">{r.label}</th>
                {r.values.map((v, i) => (
                  <td key={i} className="placeholder-val py-3 pr-3">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SourceLine source={c.compare.source} date={formatDate(c.compare.date)} />
    </div>
  );

  const block3 = (
    <>
      <BlockTitle n={3}>Spec sheet</BlockTitle>
      <p className="mb-5 text-muted">Full parts list, warranty and benchmark notes for both builds.</p>
      <a href={c.specSheet.href} download className="btn btn-ghost">
        <DownloadIcon width={18} height={18} /> {c.specSheet.label}
      </a>
    </>
  );

  return (
    <PersonaSpine
      persona="work-play"
      eyebrow={c.eyebrow}
      title={c.title}
      sub={c.sub}
      answer={[block1, block2, block3]}
      product={c.builds[0].parts[0]}
      step={
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-3 font-medium">{c.alertCta}</p>
            <AlertForm section="persona_work-play" product={c.builds[0].parts[0]} compact />
          </div>
          <div aria-live="polite">
            <button type="button" className="btn btn-ghost" onClick={share}>
              <ShareIcon width={18} height={18} /> {c.shareCta}
            </button>
            {status && <p className="mt-2 text-sm text-muted">{status}</p>}
          </div>
        </div>
      }
    />
  );
}
