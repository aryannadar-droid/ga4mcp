import { alertCapture, footer, sources } from '../content';
import { formatDate } from '../lib/format';
import { AlertForm } from './AlertForm';
import { Wordmark } from './Wordmark';

/** `showAlert` is off on persona pages whose step 6 already offers the sale alert. */
export function Footer({ showAlert = true }: { showAlert?: boolean }) {
  return (
    <footer className="relative mt-24 border-t border-line bg-surface/60 pb-28 md:pb-12">
      <div className="container-x grid gap-12 pt-14 lg:grid-cols-[1.1fr_1fr]">
        {showAlert ? (
        <section aria-labelledby="alert-title" id="alert" className="card p-6 sm:p-8">
          <h2 id="alert-title" className="text-2xl font-semibold sm:text-3xl">
            {alertCapture.title}
          </h2>
          <p className="mt-2 mb-6 text-muted">{alertCapture.sub}</p>
          <AlertForm section="footer" />
        </section>
        ) : (
          <div />
        )}
        <section aria-labelledby="sources-title" id="sources">
          <h2 id="sources-title" className="eyebrow mb-4">
            {footer.sourcesTitle}
          </h2>
          <ol className="space-y-2 text-sm text-muted">
            {sources.map((s, i) => (
              <li key={s.id} id={`src-${s.id}`} className="flex gap-2">
                <span className="text-fg">{i + 1}.</span>
                <span>
                  {s.text}, {formatDate(s.date)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <div className="container-x mt-12 flex flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <Wordmark />
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {footer.links.map((l) => (
            <li key={l.label}>
              <a className="text-muted hover:text-fg" href={l.href}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className="container-x mt-6 text-xs leading-relaxed text-muted">{footer.legal}</p>
    </footer>
  );
}
