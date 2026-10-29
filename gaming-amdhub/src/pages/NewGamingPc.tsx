import { useState } from 'react';
import { games, newBuildPage as c, personaPageCommon, type GameId } from '../content';
import { track } from '../lib/analytics';
import { formatFps, formatINR } from '../lib/format';
import { shareLink } from '../lib/share';
import { writeStore } from '../lib/storage';
import { BookmarkIcon, CheckIcon, ShareIcon } from '../components/Icons';
import { BlockTitle, PersonaSpine } from './PersonaSpine';

export default function NewGamingPc() {
  const [budget, setBudget] = useState(c.budgets[1].id);
  const [game, setGame] = useState<GameId>('valorant');
  const [status, setStatus] = useState<string | null>(null);
  const pick = c.builds.find((b) => b.budgetId === budget) ?? c.builds[0];

  const save = () => {
    writeStore('amdhub.build', { persona: 'new-build', build: pick.id, budget, game });
    track('build_save', { section: 'persona_new-build', product: pick.name, build: pick.id });
    setStatus(personaPageCommon.saved);
  };
  const share = async () => {
    const r = await shareLink(`${personaPageCommon.shareText}: ${pick.name}`);
    if (r !== 'failed') track('build_share', { section: 'persona_new-build', product: pick.name, method: r });
    if (r === 'copied') setStatus(personaPageCommon.shared);
  };

  const block1 = (
    <>
      <BlockTitle n={1}>{c.budgetLabel}</BlockTitle>
      <div className="flex flex-wrap gap-2" role="group" aria-label={c.budgetLabel}>
        {c.budgets.map((b) => (
          <button key={b.id} type="button" className="chip" aria-pressed={b.id === budget} onClick={() => setBudget(b.id)}>
            {b.label}
          </button>
        ))}
      </div>
      <p className="mt-6 mb-3 font-medium">{c.gameLabel}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={c.gameLabel}>
        {games.map((g) => (
          <button
            key={g.id}
            type="button"
            className="chip"
            aria-pressed={g.id === game}
            onClick={() => {
              setGame(g.id);
              track('game_check', { section: 'persona_new-build', game: g.id, resolution: '1080p', product: pick.name });
            }}
          >
            {g.name}
          </button>
        ))}
      </div>
    </>
  );

  const block2 = (
    <>
      <BlockTitle n={2}>Three builds, priced</BlockTitle>
      <ul className="grid gap-4 md:grid-cols-3">
        {c.builds.map((b) => {
          const active = b.id === pick.id;
          return (
            <li
              key={b.id}
              className={`relative rounded-2xl border p-5 transition-colors ${active ? 'border-accent bg-raised' : 'border-line'}`}
            >
              {active && <span className="mb-3 inline-block rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-ink">{c.recommended}</span>}
              <h3 className="text-lg font-semibold">{b.name}</h3>
              <p className="placeholder-val mt-1 font-display text-2xl font-semibold text-gold-soft">{formatINR(b.price)}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted">
                {b.parts.map((part) => (
                  <li key={part}>{part}</li>
                ))}
              </ul>
              <p className="mt-4 border-t border-line pt-3 text-sm">
                <span className="placeholder-val font-display text-xl font-semibold">{formatFps(b.fps[game]['1080p'])}</span> FPS{' '}
                <span className="text-muted">
                  in {games.find((g) => g.id === game)?.name} {c.fpsAt}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );

  const block3 = (
    <>
      <BlockTitle n={3}>{c.whyTitle}</BlockTitle>
      <ul className="space-y-3">
        {c.why.map((line) => (
          <li key={line} className="flex gap-3">
            <CheckIcon className="mt-0.5 shrink-0 text-accent" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <PersonaSpine
      persona="new-build"
      eyebrow={c.eyebrow}
      title={c.title}
      sub={c.sub}
      answer={[block1, block2, block3]}
      product={pick.parts[0]}
      step={
        <div className="flex flex-wrap items-center gap-3" aria-live="polite">
          <button type="button" className="btn btn-ghost" onClick={save}>
            <BookmarkIcon width={18} height={18} /> {c.saveCta}
          </button>
          <button type="button" className="btn btn-ghost" onClick={share}>
            <ShareIcon width={18} height={18} /> {c.shareCta}
          </button>
          {status && <span className="text-sm text-muted">{status}</span>}
        </div>
      }
    />
  );
}
