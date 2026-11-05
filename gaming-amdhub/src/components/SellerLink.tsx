import type { ReactNode } from 'react';
import { sellers, sellersIntro, type ProductId, type SellerId } from '../content';
import { trackPartner } from '../lib/analytics';
import { usePersona } from '../lib/persona';
import { productName, sellerHref, utmCampaign } from '../lib/sellers';

interface Props {
  seller: SellerId;
  product: ProductId;
  section: string;
  /** Persona B: upgrade path (b1 | b2 | b3). */
  path?: string;
  /** Personas A / C: build id. */
  build?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Every outbound seller link: the exact product listing (never a search page), UTM-tagged,
 * new tab with rel="noopener", and partner_click with seller, product, persona, URL, campaign
 * and path/build.
 */
export function SellerLink({ seller, product, section, path, build, className, children }: Props) {
  const persona = usePersona();
  const href = sellerHref(seller, product, persona);
  const name = sellers.find((s) => s.id === seller)?.name ?? seller;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener" // keep the referrer so sellers can attribute traffic
      data-buy="seller"
      className={className}
      onClick={() =>
        trackPartner({
          seller_name: name,
          product: productName(product),
          link_url: href,
          section,
          utm_campaign: utmCampaign(persona),
          ...(path ? { path } : {}),
          ...(build ? { build } : {}),
        })
      }
    >
      {children}
      <span className="sr-only"> {sellersIntro.newTab}</span>
    </a>
  );
}
