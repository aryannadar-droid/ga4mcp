import { useState, type FormEvent } from 'react';
import { builds, catalog, personaPageCommon, sellers, upgradePage as c, type Platform, type ProductId, type UpgradePath } from '../content';
import { track } from '../lib/analytics';
import { formatDate, formatFps, formatINR } from '../lib/format';
import { writeStore } from '../lib/storage';
import { AlertForm } from '../components/AlertForm';
import { BuildCard } from '../components/BuildCard';
import { BookmarkIcon, CheckIcon, ExternalIcon } from '../components/Icons';
import { PlainKey } from '../components/PlainKey';
import { SellerLink } from '../components/SellerLink';
import { BlockTitle, PersonaSpine, SourceLine } from './PersonaSpine';

type Verdict = 'fits' | 'check' | 'no';
type LineState = 'ok' | 'check' | 'no';
interface FitResult {
  verdict: Verdict;
  lines: { text: string; state: LineState }[];
}

type BiosAnswer = keyof typeof c.biosResults;
type CoolerAnswer = keyof typeof c.coolerResults;

function verdictOf(lines: FitResult['lines']): Verdict {
  if (lines.some((l) => l.state === 'no')) return 'no';
  return lines.some((l) => l.state === 'check') ? 'check' : 'fits';
}

/** B1 · AM4 processor drop-in: BIOS version + cooler. */
function checkCpu(bios: BiosAnswer, cooler: CoolerAnswer): FitResult {
  const lines: FitResult['lines'] = [
    { text: c.biosResults[bios], state: bios === 'yes' ? 'ok' : 'check' },
    { text: c.coolerResults[cooler], state: cooler === 'tower' || cooler === 'aio' ? 'ok' : 'check' },
  ];
  return { verdict: verdictOf(lines), lines };
}

/** B2 / B3 · graphics card: power supply + space for the card's length. */
function checkGpu(cardId: ProductId, psuW: number, spaceMm: number): FitResult {
  const card = c.cards.find((x) => x.id === cardId)!;
  const r = c.results;
  const lines: FitResult['lines'] = [];
  if (card.recommendedPsuW == null) lines.push({ text: r.psuUnknown, state: 'check' });
  else lines.push(psuW >= card.recommendedPsuW ? { text: r.psuOk, state: 'ok' } : { text: r.psuLow, state: 'no' });
  if (card.lengthMm == null) lines.push({ text: r.lenUnknown, state: 'check' });
  else lines.push(spaceMm >= card.lengthMm ? { text: r.lenOk, state: 'ok' } : { text: r.lenNo, state: 'no' });
  lines.push({ text: r.driver, state: 'ok' });
  return { verdict: verdictOf(lines), lines };
}

export default function Upgrade() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [override, setOverride] = useState<UpgradePath | null>(null);
  const [bios, setBios] = useState<BiosAnswer>('unsure');
  const [cooler, setCooler] = useState<CoolerAnswer>('tower');
  const [cardId, setCardId] = useState<ProductId>(c.cards[1].id);
  const [psuW, setPsuW] = useState(650);
  const [spaceMm, setSpaceMm] = useState(300);
  const [result, setResult] = useState<FitResult | null>(null);
  const [saved, setSaved] = useState(false);

  const path: UpgradePath | null = platform ? (override ?? c.routes[platform]) : null;
  // B1 (and before a platform is picked) the processor; B2 / B3 the chosen card
  const product: ProductId = !path || path === 'b1' ? 'r7-5700x3d' : cardId;
  const pathInfo = path ? c.paths[path] : null;
  const pathBuild = path ? { ...builds[c.paths[path].build], ...(path === 'b1' ? {} : { gpu: cardId, name: c.paths[path].title }) } : null;

  const reset = () => {
    setResult(null);
    setSaved(false);
  };
  const choosePlatform = (p: Platform) => {
    setPlatform(p);
    setOverride(null);
    reset();
  };

  const onCheck = (e: FormEvent) => {
    e.preventDefault();
    if (!platform || !path) return;
    const res = path === 'b1' ? checkCpu(bios, cooler) : checkGpu(cardId, psuW, spaceMm);
    setResult(res);
    setSaved(false);
    track('compat_check', {
      section: 'persona_upgrade',
      platform,
      path,
      product: catalog[product].name,
      result: res.verdict,
      ...(path === 'b1' ? { bios, cooler } : { psu_w: psuW, space_mm: spaceMm }),
    });
  };

  const saveFit = () => {
    if (!result || !path) return;
    writeStore('amdhub.fit', { platform, path, product, verdict: result.verdict });
    track('build_save', { section: 'persona_upgrade', product: catalog[product].name, type: 'fit_result', platform: platform ?? '', path, result: result.verdict });
    setSaved(true);
  };

  const num = 'h-11 w-full rounded-xl border border-line bg-raised px-3 text-fg';

  const block1 = (
    <>
      <BlockTitle n={1}>{c.blockTitles[0]}</BlockTitle>
      <fieldset>
        <legend className="mb-3 font-display text-lg font-semibold">{c.platformQ}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {c.platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={platform === p.id}
              onClick={() => choosePlatform(p.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${platform === p.id ? 'border-accent bg-raised' : 'border-line hover:border-muted'}`}
            >
              <span className="block font-semibold">{p.label}</span>
              <span className="mt-0.5 block text-sm text-muted">{p.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {path && pathInfo && pathBuild && (
        <form onSubmit={onCheck} className="mt-6 border-t border-line pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-semibold">
              {pathInfo.title}
            </h3>
            {platform === 'am4' && (
              <button
                type="button"
                className="link text-sm font-semibold"
                onClick={() => {
                  setOverride(path === 'b1' ? 'b2' : 'b1');
                  reset();
                }}
              >
                {path === 'b1' ? c.switchToGpu : c.switchToCpu}
              </button>
            )}
          </div>

          {path === 'b3' && (
            <p className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-raised p-4">
              <CheckIcon className="mt-0.5 shrink-0 text-accent" />
              <span>{c.intelReassure}</span>
            </p>
          )}

          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <BuildCard build={pathBuild} />
            <div className="space-y-5">
              {path === 'b1' ? (
                <>
                  <Choice label={c.biosQ} options={c.biosOptions as { id: BiosAnswer; label: string }[]} value={bios} onChange={(v) => (setBios(v), reset())} />
                  <Choice label={c.coolerQ} options={c.coolerOptions as { id: CoolerAnswer; label: string }[]} value={cooler} onChange={(v) => (setCooler(v), reset())} />
                </>
              ) : (
                <>
                  <Choice
                    label={c.cardQ}
                    options={c.cards.map((x) => ({ id: x.id, label: catalog[x.id].name }))}
                    value={cardId}
                    onChange={(v) => (setCardId(v), reset())}
                  />
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium">{c.psuQ}</span>
                    <input type="number" inputMode="numeric" min={200} max={2000} step={50} value={psuW} onChange={(e) => (setPsuW(Number(e.target.value)), reset())} className={num} />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium">{c.spaceQ}</span>
                    <input type="number" inputMode="numeric" min={100} max={600} step={5} value={spaceMm} onChange={(e) => (setSpaceMm(Number(e.target.value)), reset())} className={num} />
                    <span className="mt-1 block text-xs text-muted">{c.spaceHint}</span>
                  </label>
                </>
              )}
              <button type="submit" className="btn btn-primary">
                {c.checkCta}
              </button>
            </div>
          </div>

          <div aria-live="polite">
            {result && (
              <div className={`mt-6 rounded-2xl border p-5 ${result.verdict === 'fits' ? 'border-accent' : 'border-line'}`}>
                <p className="font-display text-xl font-semibold">{c.results[result.verdict]}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {result.lines.map((l) => (
                    <li key={l.text} className="flex items-start gap-2">
                      <span aria-hidden className={`mt-0.5 font-bold ${l.state === 'ok' ? 'text-accent' : 'text-fg'}`}>
                        {l.state === 'ok' ? '✓' : l.state === 'no' ? '✕' : '!'}
                      </span>
                      <span className={l.state === 'ok' ? 'text-muted' : ''}>{l.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <PlainKey className="mt-6" />
        </form>
      )}
    </>
  );

  const block2 = (
    <>
      <BlockTitle n={2}>{`${c.blockTitles[1]}: ${catalog[product].name}`}</BlockTitle>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[300px] text-left text-sm sm:text-base">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-2 font-medium">Game</th>
              <th scope="col" className="py-2 font-medium">{c.beforeLabel}</th>
              <th scope="col" className="py-2 font-medium">{c.afterLabel}</th>
            </tr>
          </thead>
          <tbody>
            {c.beforeAfter.map((r) => (
              <tr key={r.game} className="border-t border-line">
                <th scope="row" className="py-3 font-medium">{r.game}</th>
                <td className="placeholder-val py-3">{formatFps(r.before)} FPS</td>
                <td className="placeholder-val py-3 font-semibold text-accent">{formatFps(r.after)} FPS</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SourceLine source={c.beforeAfterSource.name} date={formatDate(c.beforeAfterSource.date)} />
    </>
  );

  const block3 = (
    <>
      <BlockTitle n={3}>{`${c.blockTitles[2]}: ${catalog[product].name}`}</BlockTitle>
      <ul className="divide-y divide-line">
        {c.stock.map((r) => {
          const s = sellers.find((x) => x.id === r.seller)!;
          return (
            <li key={r.seller} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
              <span className="min-w-0 font-medium">{s.name}</span>
              <span className="flex items-center gap-4 text-sm">
                <span className="placeholder-val font-semibold text-gold-soft">{formatINR(r.price)}</span>
                <span className="text-muted">Stock: {r.stock}</span>
                <SellerLink seller={r.seller} product={product} path={path ?? undefined} section="persona_upgrade_stock" className="link inline-flex items-center gap-1 font-semibold">
                  {c.stockCta} <ExternalIcon width={14} height={14} />
                </SellerLink>
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <PersonaSpine
      persona="upgrade"
      eyebrow={c.eyebrow}
      title={c.title}
      sub={c.sub}
      answer={[block1, block2, block3]}
      blockTitles={c.blockTitles}
      product={product}
      path={path ?? undefined}
      step={
        <div className="grid gap-8 lg:grid-cols-2">
          <div aria-live="polite">
            <button type="button" className="btn btn-ghost" onClick={saveFit} disabled={!result} aria-disabled={!result}>
              <BookmarkIcon width={18} height={18} /> {c.saveFitCta}
            </button>
            <p className="mt-2 text-sm text-muted">{saved ? personaPageCommon.saved : !result ? c.saveFitFirst : ''}</p>
          </div>
          <div>
            <p className="mb-3 font-medium">{c.alertCta}</p>
            <AlertForm section="persona_upgrade" product={catalog[product].name} compact />
          </div>
        </div>
      }
    />
  );
}

function Choice<T extends string>({ label, options, value, onChange }: { label: string; options: readonly { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.id} type="button" className="chip min-h-10 text-sm" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
