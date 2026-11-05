import { plainKey } from '../content';

/** "cores = jobs at once · GHz = speed of each job · …" — shown wherever specs or builds appear. */
export function PlainKey({ className = '' }: { className?: string }) {
  return (
    <aside aria-label={plainKey.title} className={`rounded-2xl border border-dashed border-line px-4 py-3 text-sm ${className}`}>
      <span className="mr-2 font-semibold">{plainKey.title}:</span>
      {plainKey.items.map((it, i) => (
        <span key={it.term} className="text-muted">
          <span className="font-medium text-fg">{it.term}</span> = {it.meaning}
          {i < plainKey.items.length - 1 && <span aria-hidden> · </span>}
        </span>
      ))}
    </aside>
  );
}
