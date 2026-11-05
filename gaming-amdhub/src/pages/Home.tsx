import { sectionBar } from '../content';
import { BAR_SENTINEL_ID, useBarSections } from '../lib/bar';
import { Hero } from '../sections/Hero';
import { PersonaDoors } from '../sections/PersonaDoors';
import { ProductStrip } from '../sections/ProductStrip';
import { FpsSection } from '../sections/FpsSection';
import { BuildTeaser } from '../sections/BuildTeaser';
import { Sellers } from '../sections/Sellers';
import { Guides } from '../sections/Guides';

export default function Home() {
  useBarSections(sectionBar.home);
  return (
    <main id="main">
      <Hero />
      {/* the pinned buy bar appears once this passes the top of the screen */}
      <div id={BAR_SENTINEL_ID} aria-hidden />
      <PersonaDoors />
      <ProductStrip />
      <FpsSection />
      <BuildTeaser />
      <Sellers />
      <Guides />
    </main>
  );
}
