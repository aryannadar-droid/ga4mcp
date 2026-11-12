import { useEffect, useId, useState } from 'react';
import { builds, personaPageCommon, workPlayPage as c, type BuildGoal, type BuildId, type WorkType } from '../content';
import { track } from '../lib/analytics';
import { formatDate } from '../lib/format';
import { navigate } from '../lib/router';
import { shareLink } from '../lib/share';
import { useInView } from '../hooks/useInView';
import { AlertForm } from '../components/AlertForm';
import { BuildCard } from '../components/BuildCard';
import { DownloadIcon, ShareIcon } from '../components/Icons';
import { PlainKey } from '../components/PlainKey';
import { BlockTitle, PersonaSpine, SourceLine } from './PersonaSpine';

const BOTH: BuildId[] = ['c-pro', 'c-creator'];

export default function WorkAndPlay() {
  const [work, setWork] = useState<WorkType | null>(null);
  const [goal, setGoal] = useState<BuildGoal | null>(null);
  const [shown, setShown] = useState<BuildId | null>(null); // matched build, once revealed
  const [showOther, setShowOther] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [cmpRef, cmpSeen] = useInView<HTMLDivElement>({ once: true, threshold: 0.4 });

  const matched = goal ? c.match[goal] : null;
  const current: BuildId = shown ?? matched ?? 'c-pro';
  const other = BOTH.find((b) => b !== current)!;

  useEffect(() => {
    if (cmpSeen)
      track('compare_view', {
        section: 'persona_work-play',
        product: builds[current].name,
        build: current,
        compared: c.compare.columns.map((x) => x.name).join(' | '),
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmpSeen]);

  const reveal = () => {
    if (!work || !goal || !matched) return;
    setShown(matched);
    setShowOther(false);
    track('persona_select', { section: 'persona_work-play', persona: 'work-play', method: 'questions', work_type: work, build_goal: goal, build: matched });
    navigate('#step-2');
  };

  const share = async () => {
    const r = await shareLink(`${personaPageCommon.shareText}: ${builds[current].name}`);
    if (r !== 'failed') track('build_share', { section: 'persona_work-play', product: builds[current].name, build: current, method: r });
    if (r === 'copied') setStatus(personaPageCommon.shared);
  };

  const block1 = (
    <>
      <BlockTitle n={1}>{c.blockTitles[0]}</BlockTitle>
      <fieldset>
        <legend className="mb-3 font-display text-lg font-semibold">{c.q1}</legend>
        <div className="flex flex-wrap gap-2">
          {c.work.map((w) => (
            <button key={w.id} type="button" className="chip" aria-pressed={work === w.id} onClick={() => setWork(w.id)}>
              {w.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-6">
        <legend className="mb-3 font-display text-lg font-semibold">{c.q2}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {c.goals.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={goal === g.id}
              onClick={() => setGoal(g.id)}
              className={`rounded-xl border p-4 text-left font-medium transition-colors ${goal === g.id ? 'border-accent bg-raised' : 'border-line hover:border-muted'}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={reveal} disabled={!work || !goal} aria-disabled={!work || !goal}>
          {c.matchCta}
        </button>
        {(!work || !goal) && <span className="text-sm text-muted">{c.answerFirst}</span>}
      </div>
    </>
  );

  const block2 = (
    <>
      <BlockTitle n={2}>{c.blockTitles[1]}</BlockTitle>
      {shown ? (
        <div aria-live="polite">
          <div className="grid gap-4 md:grid-cols-2">
            <BuildCard build={builds[current]} active tag={c.matchedTag} customize>
              {work && <span>{c.workNotes[work]}</span>}
            </BuildCard>
            {showOther && <BuildCard build={builds[other]} />}
          </div>
          {!showOther && (
            <button type="button" className="link mt-4 text-sm font-semibold" onClick={() => setShowOther(true)}>
              {c.otherBuild}
            </button>
          )}
        </div>
      ) : (
        // before answering, both builds are visible so this block is never empty
        <>
          <p className="mb-4 text-muted">{c.answerFirst}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {BOTH.map((id) => (
              <BuildCard key={id} build={builds[id]} />
            ))}
          </div>
        </>
      )}
      <PlainKey className="mt-5" />
    </>
  );

  const block3 = (
    <div ref={cmpRef}>
      <BlockTitle n={3}>{c.compare.title}</BlockTitle>
      <p className="-mt-3 mb-5 text-muted">{c.compare.sub}</p>
      <CompareCards />
      <SourceLine source={c.compare.source} date={formatDate(c.compare.date)} />
      <a href={c.specSheet.href} download className="btn btn-ghost mt-6">
        <DownloadIcon width={18} height={18} /> {c.specSheet.label}
      </a>
    </div>
  );

  return (
    <PersonaSpine
      persona="work-play"
      eyebrow={c.eyebrow}
      title={c.title}
      sub={c.sub}
      answer={[block1, block2, block3]}
      blockTitles={c.blockTitles}
      product={builds[current].cpu ?? 'r9-9900x'}
      build={current}
      step={
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-3 font-medium">{c.alertCta}</p>
            <AlertForm section="persona_work-play" product={builds[current].name} compact />
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

/**
 * Phone-first compare: one card per system, two visible at a time with swipe (all three
 * on wide screens). Key rows always show; the rest sit under one "See specs" toggle.
 * The Mac column is a reference point, styled and labelled as such — not a competitor.
 */
function CompareCards() {
  const [open, setOpen] = useState(false);
  const specsId = useId();
  const cmp = c.compare;
  const keyRows = cmp.rows.filter((r) => r.key);
  const moreRows = cmp.rows.filter((r) => !r.key);

  return (
    <>
      <ul aria-label={cmp.title} className="no-scrollbar relative -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
        {cmp.columns.map((col, i) => {
          const ref = col.role === 'reference';
          return (
            <li
              key={col.name}
              className={`w-[calc(50%-6px)] shrink-0 snap-start rounded-2xl border p-4 sm:p-5 lg:w-auto ${
                col.role === 'ours' ? 'border-accent bg-raised' : ref ? 'border-dashed border-line' : 'border-line'
              }`}
            >
              <h3 className={`font-display text-base leading-tight font-semibold sm:text-lg ${ref ? 'text-muted' : ''}`}>{col.name}</h3>
              {ref && 'note' in col && <p className="mt-1 text-xs text-muted">{col.note}</p>}
              <dl className="mt-3 space-y-3 text-sm">
                {keyRows.map((r) => (
                  <div key={r.label}>
                    <dt className="text-xs text-muted">{r.label}</dt>
                    <dd className="placeholder-val mt-0.5 font-display text-lg font-semibold">{r.values[i]}</dd>
                    {/* GeForce: always both prices, each dated */}
                    {col.role === 'rival' && r.label === cmp.rows[0].label && (
                      <dd className="mt-1 space-y-0.5 text-xs text-muted">
                        <span className="block">
                          {cmp.nvidiaPrices.list.label}: {cmp.nvidiaPrices.list.value}, {formatDate(cmp.nvidiaPrices.list.date)}
                        </span>
                        <span className="block">
                          {cmp.nvidiaPrices.street.label}: {cmp.nvidiaPrices.street.value}, {formatDate(cmp.nvidiaPrices.street.date)}
                        </span>
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
              <dl id={`${specsId}-${i}`} hidden={!open} className="mt-3 space-y-3 border-t border-line pt-3 text-sm">
                {moreRows.map((r) => (
                  <div key={r.label}>
                    <dt className="text-xs text-muted">{r.label}</dt>
                    <dd className="placeholder-val mt-0.5 font-medium">{r.values[i]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="chip"
          aria-expanded={open}
          aria-controls={cmp.columns.map((_, i) => `${specsId}-${i}`).join(' ')}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? cmp.hideSpecs : cmp.seeSpecs}
        </button>
        <span className="text-xs text-muted lg:hidden" aria-hidden>
          {cmp.swipeHint} →
        </span>
      </div>
    </>
  );
}
