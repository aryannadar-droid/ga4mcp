import { useState, type FormEvent } from 'react';
import { personaPageCommon, upgradePage as c } from '../content';
import { track } from '../lib/analytics';
import { formatDate, formatFps, formatINR } from '../lib/format';
import { writeStore } from '../lib/storage';
import { AlertForm } from '../components/AlertForm';
import { BookmarkIcon, ExternalIcon } from '../components/Icons';
import { SellerLink } from '../components/SellerLink';
import { BlockTitle, PersonaSpine, SourceLine } from './PersonaSpine';

type Verdict = 'fits' | 'check' | 'no';
interface FitResult {
  verdict: Verdict;
  lines: string[];
}

function checkFit(partId: string, boardId: string, psuId: string): FitResult {
  const part = c.parts.find((p) => p.id === partId)!;
  const board = c.boards.find((b) => b.id === boardId)!;
  const psu = c.psus.find((p) => p.id === psuId)!;
  const r = c.results;
  const lines: string[] = [];
  let verdict: Verdict = 'fits';

  if (part.kind === 'cpu') {
    if (board.socket !== part.socket) return { verdict: 'no', lines: [r.cpuSocketNo] };
    lines.push(r.cpuSocketOk, r.biosNote);
    verdict = 'check';
  } else {
    lines.push(r.gpuSlotOk, r.gpuBiosNote);
  }

  if (part.recommendedPsuW == null) {
    lines.push(r.psuUnknown);
    verdict = 'check';
  } else if (psu.watts >= part.recommendedPsuW) {
    lines.push(r.psuOk);
  } else {
    lines.push(r.psuLow);
    verdict = 'check';
  }
  return { verdict, lines };
}

export default function Upgrade() {
  const [partId, setPartId] = useState(c.parts[0].id);
  const [boardId, setBoardId] = useState(c.boards[2].id);
  const [psuId, setPsuId] = useState(c.psus[2].id);
  const [result, setResult] = useState<FitResult | null>(null);
  const [saved, setSaved] = useState(false);
  const part = c.parts.find((p) => p.id === partId)!;

  const onCheck = (e: FormEvent) => {
    e.preventDefault();
    const res = checkFit(partId, boardId, psuId);
    setResult(res);
    setSaved(false);
    track('compat_check', { section: 'persona_upgrade', product: part.name, board: boardId, psu: psuId, result: res.verdict });
  };

  const saveFit = () => {
    if (!result) return;
    writeStore('amdhub.fit', { part: partId, board: boardId, psu: psuId, verdict: result.verdict });
    track('build_save', { section: 'persona_upgrade', product: part.name, type: 'fit_result', result: result.verdict });
    setSaved(true);
  };

  const select = 'min-h-11 w-full rounded-xl border border-line bg-raised px-3 text-fg';

  const block1 = (
    <>
      <BlockTitle n={1}>Fit checker</BlockTitle>
      <form onSubmit={onCheck} className="grid gap-4 sm:grid-cols-3 sm:items-end">
        <label className="min-w-0 text-sm">
          <span className="mb-1.5 block text-muted">{c.partLabel}</span>
          <select className={select} value={partId} onChange={(e) => (setPartId(e.target.value), setResult(null))}>
            {c.parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-sm">
          <span className="mb-1.5 block text-muted">{c.boardLabel}</span>
          <select className={select} value={boardId} onChange={(e) => (setBoardId(e.target.value), setResult(null))}>
            {c.boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-sm">
          <span className="mb-1.5 block text-muted">{c.psuLabel}</span>
          <select className={select} value={psuId} onChange={(e) => (setPsuId(e.target.value), setResult(null))}>
            {c.psus.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary sm:col-span-3 sm:justify-self-start">
          {c.checkCta}
        </button>
      </form>
      <div aria-live="polite">
        {result && (
          <div className={`mt-6 rounded-2xl border p-5 ${result.verdict === 'no' ? 'border-line' : 'border-accent'}`}>
            <p className="font-display text-xl font-semibold">{c.results[result.verdict]}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {result.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );

  const block2 = (
    <>
      <BlockTitle n={2}>{c.beforeAfterTitle}</BlockTitle>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
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
      <BlockTitle n={3}>{c.stockTitle}</BlockTitle>
      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              {c.stockCols.map((h, i) => (
                <th key={i} scope="col" className="py-2 font-medium">
                  {h || <span className="sr-only">Link</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.stock.map((r, i) => (
              <tr key={i} className="border-t border-line">
                <th scope="row" className="py-3 font-medium">{r.seller}</th>
                <td className="placeholder-val py-3 text-gold-soft">{formatINR(r.price)}</td>
                <td className="py-3 text-muted">{r.stock}</td>
                <td className="py-3 text-right">
                  <SellerLink href={r.href} sellerName={r.seller} product={part.name} section="persona_upgrade_stock" className="link inline-flex items-center gap-1 font-semibold">
                    {c.stockCta} <ExternalIcon width={14} height={14} />
                  </SellerLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <PersonaSpine
      persona="upgrade"
      eyebrow={c.eyebrow}
      title={c.title}
      sub={c.sub}
      answer={[block1, block2, block3]}
      product={part.name}
      step={
        <div className="grid gap-8 lg:grid-cols-2">
          <div aria-live="polite">
            <button type="button" className="btn btn-ghost" onClick={saveFit} disabled={!result} aria-disabled={!result}>
              <BookmarkIcon width={18} height={18} /> {c.saveFitCta}
            </button>
            <p className="mt-2 text-sm text-muted">{saved ? personaPageCommon.saved : !result ? 'Run the fit check first.' : ''}</p>
          </div>
          <div>
            <p className="mb-3 font-medium">{c.alertCta}</p>
            <AlertForm section="persona_upgrade" product={part.name} compact />
          </div>
        </div>
      }
    />
  );
}
