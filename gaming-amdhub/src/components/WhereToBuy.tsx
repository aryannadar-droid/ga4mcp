import { site } from '../content';
import { track } from '../lib/analytics';
import { Link } from '../lib/router';
import { StoreIcon } from './Icons';

export function WhereToBuy({ section, className = 'btn btn-primary', label = site.whereToBuy }: { section: string; className?: string; label?: string }) {
  return (
    <Link href={site.whereToBuyHref} className={className} onClick={() => track('store_search', { section })}>
      <StoreIcon width={18} height={18} />
      {label}
    </Link>
  );
}
