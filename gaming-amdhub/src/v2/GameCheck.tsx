import { useEffect, useState } from 'react';
import { builds, type BuildId } from '../content';
import { track } from '../lib/analytics';
import { configFromBuild, encodeConfig, openBuilder } from '../lib/buildConfig';
import { writeStore } from '../lib/storage';
import { anchors, gameCheck as G, type BudgetBand, type Screen } from './content';
import { levelFor, matchBuild, pairLabel, trackV2 } from './lib';

const ALL_GAMES = [...G.games, ...G.moreGames];

interface Result {
  build: BuildId;
  stretch: boolean;
  games: string[];
  screen: Screen;
}

/**
 * "Will my game run?": games + screen + budget → a Ryzen + Radeon pair (from the locked builds),
 * plain-words bars per game, and a streaming line. Bars are illustrative until AMD-tested data
 * is wired in. Orange marks one action at a time: Check first, then "See the full build".
 */
export function GameCheck() {
  const [games, setGames] = useState<string[]>(['valorant']);
  const [more, setMore] = useState(false);
  const [screen, setScreen] = useState<Screen>('1080p');
  const [budget, setBudget] = useState<BudgetBand>('60-100');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const toggle = (id: string) => setGames((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  const submit = () => {
    if (!games.length) return setError(true);
    setError(false);
    setStatus(null);
    const m = matchBuild(budget, screen);
    setResult({ build: m.build, stretch: !!m.stretch, games: [...games], screen });
    const pair = pairLabel(m.build);
    // reused event name: brief params + the locked game_check params (product, resolution)
    trackV2('game_check', { section: 'v2_game_check', game: games.join(','), screen, budget_band: budget, build_id: m.build, product: pair.cpu, resolution: screen });
  };

  const shareUrl = (id: BuildId) => `${window.location.origin}/build-your-pc?${encodeConfig(configFromBuild(id))}`;
  const save = () => {
    if (!result) return;
    writeStore('amdhub.v2.match', { build: result.build, games: result.games, screen: result.screen, budget });
    trackV2('build_save', { section: 'v2_game_check', build_id: result.build, build: result.build, channel: 'device' });
    setStatus(G.saved);
  };
  const whatsapp = () => {
    if (!result) return;
    const pair = pairLabel(result.build);
    const text = `${G.shareText}: ${pair.cpu} + ${pair.gpu} — ${shareUrl(result.build)}`;
    trackV2('build_share', { section: 'v2_game_check', build_id: result.build, build: result.build, channel: 'whatsapp', method: 'whatsapp' });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  return (
    <section id={anchors.check} aria-labelledby="v2-check-title" className="scroll-mt-20 py-16 sm:py-24">
      <div className="container-x">
        <h2 id="v2-check-title" className="v2-display text-[clamp(2.1rem,6vw,3.8rem)]">
          {G.title}
        </h2>
        <p className="mt-3 max-w-xl text-lg text-[var(--v2-muted)]">{G.sub}</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          {/* inputs */}
          <div className="space-y-7">
            <fieldset>
              <legend className="mb-3 text-sm font-semibold tracking-wide text-[var(--v2-muted)] uppercase">{G.gamesLabel}</legend>
              <div className="flex flex-wrap gap-2">
                {(more ? ALL_GAMES : G.games).map((g) => (
                  <button key={g.id} type="button" className="v2-chip" aria-pressed={games.includes(g.id)} onClick={() => toggle(g.id)}>
                    {g.name}
                  </button>
                ))}
                <button type="button" className="v2-chip border-dashed text-[var(--v2-muted)]" aria-expanded={more} onClick={() => setMore((m) => !m)}>
                  {more ? G.less : G.more}
                </button>
              </div>
            </fieldset>
            <Radio label={G.screenLabel} options={G.screens} value={screen} onChange={setScreen} />
            <Radio label={G.budgetLabel} options={G.budgets} value={budget} onChange={setBudget} />
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className={`btn min-h-12 px-6 text-base ${result ? 'v2-btn-quiet' : 'v2-btn-act'}`} onClick={submit}>
                {result ? G.update : G.submit}
              </button>
              {error && (
                <span role="alert" className="text-sm text-[var(--v2-gold-soft)]">
                  {G.pickGame}
                </span>
              )}
            </div>
          </div>

          {/* output */}
          <div aria-live="polite" className="rounded-3xl border border-[var(--v2-line)] bg-[var(--v2-black-2)] p-5 sm:p-7">
            {result ? <Output r={result} onSave={save} onWhatsapp={whatsapp} status={status} /> : <Empty />}
          </div>
        </div>
      </div>
    </section>
  );
}

function Radio<T extends string>({ label, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold tracking-wide text-[var(--v2-muted)] uppercase">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className="v2-chip min-w-[88px]" onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Empty() {
  return (
    <div className="flex h-full min-h-[220px] flex-col justify-center">
      <p className="text-sm font-semibold tracking-wide text-[var(--v2-muted)] uppercase">{G.resultTitle}</p>
      <p className="mt-3 text-[var(--v2-muted)]">{G.sub}</p>
      <ul className="mt-6 space-y-3" aria-hidden>
        {[0.9, 0.7, 0.5].map((w) => (
          <li key={w} className="h-3 rounded-full bg-[var(--v2-line)]" style={{ width: `${w * 100}%` }} />
        ))}
      </ul>
    </div>
  );
}

function Output({ r, onSave, onWhatsapp, status }: { r: Result; onSave: () => void; onWhatsapp: () => void; status: string | null }) {
  const pair = pairLabel(r.build);
  const [filled, setFilled] = useState(false);
  // bars fill after the result renders (transform only); instant under reduced motion via CSS
  useEffect(() => {
    setFilled(false);
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, [r]);
  const streaming = G.streamingBuilds.includes(r.build) ? G.streamingYes : G.streamingMaybe;

  return (
    <div>
      <p className="text-sm font-semibold tracking-wide text-[var(--v2-muted)] uppercase">{G.resultTitle}</p>
      <p className="mt-2 v2-display text-3xl sm:text-4xl">
        {pair.cpu} <span className="text-[var(--v2-muted)]">+</span> <span className="text-[var(--v2-gold-soft)]">{pair.gpu}</span>
      </p>
      <p className="mt-1 text-sm text-[var(--v2-muted)]">
        {builds[r.build].name} · {builds[r.build].band}
        {r.stretch && <> · {G.stretch}</>}
      </p>

      <ul className="mt-6 space-y-4">
        {r.games.map((id) => {
          const g = ALL_GAMES.find((x) => x.id === id)!;
          const lv = levelFor(r.build, g.weight, r.screen);
          return (
            <li key={id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-base font-semibold">{g.name}</span>
                <span className="text-sm font-semibold text-[var(--v2-gold-soft)]">{lv.label}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--v2-line)]" aria-hidden>
                <div
                  className="h-full origin-left rounded-full transition-transform duration-[600ms] ease-[var(--ease-out)]"
                  style={{ transform: `scaleX(${filled ? lv.fill : 0})`, background: 'linear-gradient(90deg, var(--v2-gold), var(--v2-gold-soft))' }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-[15px]">{streaming}</p>
      <p className="mt-2 text-xs text-[var(--v2-muted)]">{G.illustrative}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" className="btn v2-btn-act min-h-12 px-5" onClick={() => {
            track('builder_start', { section: 'v2_game_check', build: r.build });
            openBuilder({ build: r.build });
          }}>
          {G.fullBuild}
        </button>
        <button type="button" className="btn v2-btn-quiet min-h-12 px-5" onClick={onSave}>
          {G.save}
        </button>
        <button type="button" className="btn v2-btn-quiet min-h-12 px-5" onClick={onWhatsapp}>
          {G.whatsapp}
        </button>
      </div>
      {status && <p className="mt-2 text-sm text-[var(--v2-muted)]">{status}</p>}
    </div>
  );
}
