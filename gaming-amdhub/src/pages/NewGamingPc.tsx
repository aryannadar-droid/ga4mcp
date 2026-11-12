import { useState } from 'react';
import { builds, games, newBuildPage as c, personaPageCommon, type BuildId, type GameId } from '../content';
import { track } from '../lib/analytics';
import { formatFps } from '../lib/format';
import { shareLink } from '../lib/share';
import { writeStore } from '../lib/storage';
import { BuildCard } from '../components/BuildCard';
import { BookmarkIcon, CheckIcon, ShareIcon } from '../components/Icons';
import { PlainKey } from '../components/PlainKey';
import { BlockTitle, PersonaSpine } from './PersonaSpine';

export default function NewGamingPc() {
  const [pick, setPick] = useState<BuildId>('a2');
  const [game, setGame] = useState<GameId>('valorant');
  const [status, setStatus] = useState<string | null>(null);
  const build = builds[pick];
  const gameName = games.find((g) => g.id === game)?.name;

  const save = () => {
    writeStore('amdhub.build', { persona: 'new-build', build: pick, game });
    track('build_save', { section: 'persona_new-build', product: build.name, build: pick });
    setStatus(personaPageCommon.saved);
  };
  const share = async () => {
    const r = await shareLink(`${personaPageCommon.shareText}: ${build.name}`);
    if (r !== 'failed') track('build_share', { section: 'persona_new-build', product: build.name, build: pick, method: r });
    if (r === 'copied') setStatus(personaPageCommon.shared);
  };

  const block1 = (
    <>
      <BlockTitle n={1}>{c.blockTitles[0]}</BlockTitle>
      <p className="mb-3 font-medium">{c.budgetLabel}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={c.budgetLabel}>
        {c.budgets.map((b) => (
          <button key={b.id} type="button" className="chip" aria-pressed={b.id === pick} onClick={() => setPick(b.id)}>
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
              track('game_check', { section: 'persona_new-build', game: g.id, resolution: '1080p', product: build.name, build: pick });
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
      <BlockTitle n={2}>{c.blockTitles[1]}</BlockTitle>
      <ul className="grid gap-4 md:grid-cols-3">
        {c.buildOrder.map((id) => {
          const b = builds[id];
          return (
            <li key={id}>
              <BuildCard build={b} active={id === pick} tag={id === pick ? c.recommended : undefined} customize>
                <span className="placeholder-val font-display text-xl font-semibold">{formatFps(b.fps[game]['1080p'])}</span> FPS{' '}
                <span className="text-muted">
                  in {gameName} {c.fpsAt}
                </span>
              </BuildCard>
            </li>
          );
        })}
      </ul>
      <PlainKey className="mt-5" />
    </>
  );

  const block3 = (
    <>
      <BlockTitle n={3}>{c.blockTitles[2]}</BlockTitle>
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
      blockTitles={c.blockTitles}
      product={build.cpu ?? 'r5-8600g'}
      build={pick}
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
