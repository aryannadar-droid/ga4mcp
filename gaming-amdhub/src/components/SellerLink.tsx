import type { ReactNode } from 'react';
import { sellersIntro } from '../content';
import { trackPartner } from '../lib/analytics';

interface Props {
  href: string;
  sellerName: string;
  product: string;
  section: string;
  className?: string;
  children: ReactNode;
}

/** Every outbound seller link: new tab, rel="noopener", partner_click with full parameters. */
export function SellerLink({ href, sellerName, product, section, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener" // keep the referrer so sellers can attribute traffic
      className={className}
      onClick={() => trackPartner({ seller_name: sellerName, product, link_url: href, section })}
    >
      {children}
      <span className="sr-only"> {sellersIntro.newTab}</span>
    </a>
  );
}
