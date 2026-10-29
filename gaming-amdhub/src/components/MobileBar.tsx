import { mobileBar, personas } from '../content';
import { usePersona } from '../lib/persona';
import { Link } from '../lib/router';
import { ArrowRight } from './Icons';
import { WhereToBuy } from './WhereToBuy';

/** Bottom sticky bar on small screens: Where to buy + saved-persona shortcut. */
export function MobileBar() {
  const persona = usePersona();
  const p = persona ? personas[persona] : null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <Link
          href={p ? p.route : '/#doors'}
          className="btn btn-ghost min-w-0 flex-1 justify-between px-4 text-sm"
        >
          {p ? (
            <span className="flex min-w-0 flex-col text-left leading-tight">
              <span className="text-[11px] font-medium text-muted">{mobileBar.yours}</span>
              <span className="truncate">{p.short}</span>
            </span>
          ) : (
            <span className="truncate">{mobileBar.pick}</span>
          )}
          <ArrowRight width={16} height={16} className="shrink-0" />
        </Link>
        <WhereToBuy section="mobile_bar" className="btn btn-primary shrink-0 px-4 text-sm" label={mobileBar.whereToBuy} />
      </div>
    </div>
  );
}
