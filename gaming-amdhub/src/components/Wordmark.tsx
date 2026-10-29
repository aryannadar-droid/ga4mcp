import { site } from '../content';
import { Link } from '../lib/router';

/** Placeholder wordmark: swap the text for the official AMD wordmark SVG. */
export function Wordmark() {
  return (
    <Link href="/" className="group inline-flex items-baseline gap-2 rounded-md" aria-label={`${site.wordmark} ${site.wordmarkSub}, home`}>
      <span className="font-display text-xl font-bold tracking-[0.08em] text-fg">
        {site.wordmark}
        <span className="text-accent" aria-hidden>
          ◢
        </span>
      </span>
      <span className="hidden text-xs font-medium tracking-wide text-muted sm:inline">{site.wordmarkSub}</span>
    </Link>
  );
}
