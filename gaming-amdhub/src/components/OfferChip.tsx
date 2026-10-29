import { offer } from '../content';
import { track } from '../lib/analytics';
import { formatDate, isPast } from '../lib/format';
import { useShimmerOnce } from '../hooks/useShimmerOnce';

/** Live offer chip. Renders nothing once `offer.endsAt` has passed. */
export function OfferChip() {
  const ref = useShimmerOnce<HTMLAnchorElement>();
  if (isPast(offer.endsAt)) return null;
  return (
    <a
      ref={ref}
      id="offers"
      href={offer.href}
      target="_blank"
      rel="noopener"
      onClick={() => track('bundle_redeem_click', { section: 'hero', product: 'bundle', link_url: offer.href })}
      className="badge-gold max-w-full flex-wrap gap-x-2 gap-y-0.5 rounded-2xl py-1.5 pr-3 pl-2.5 text-[13px] sm:rounded-full"
    >
      <span className="relative flex size-2 shrink-0" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-gold-soft" />
      </span>
      <span>{offer.label}</span>
      <span className="shrink-0 opacity-80">
        · {offer.endsPrefix} {formatDate(offer.endsAt)}
      </span>
      <span className="shrink-0 underline underline-offset-2">{offer.cta}</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
