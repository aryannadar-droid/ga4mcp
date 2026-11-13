import { sectionBar } from '../content';
import { BAR_SENTINEL_ID, useBarSections } from '../lib/bar';
import { Hero } from '../sections/Hero';
import { PersonaDoors } from '../sections/PersonaDoors';
import { ProductStrip } from '../sections/ProductStrip';
import { FpsSection } from '../sections/FpsSection';
import { BuildTeaser } from '../sections/BuildTeaser';
import { Sellers } from '../sections/Sellers';
import { Guides } from '../sections/Guides';
import { NEW_HOME_V2 } from '../flags';
import { HomeV2Lead, HomeV2Tail } from '../v2/HomeV2';

export default function Home() {
  useBarSections(sectionBar.home);
  return (
    <main id="main">
      {NEW_HOME_V2 && <HomeV2Lead />}
      <Hero />
      {/* the pinned buy bar appears once this passes the top of the screen */}
      <div id={BAR_SENTINEL_ID} aria-hidden />
      <PersonaDoors />
      <ProductStrip />
      <FpsSection />
      <BuildTeaser />
      <Sellers />
      <Guides />
      {NEW_HOME_V2 && <HomeV2Tail />}
    </main>
  );
}
