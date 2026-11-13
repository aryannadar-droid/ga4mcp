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
import { HomeV2Hero, HomeV2Lead, HomeV2Tail } from '../v2/HomeV2';

export default function Home() {
  useBarSections(sectionBar.home);

  // NEW_HOME_V2: the three sections that repeated (hero, doors, sellers) are merged into the
  // new design; everything else from the original page keeps its place. See CHANGES.md.
  if (NEW_HOME_V2)
    return (
      <main id="main">
        <HomeV2Hero />
        {/* the pinned buy bar appears once this passes the top of the screen */}
        <div id={BAR_SENTINEL_ID} aria-hidden />
        <HomeV2Lead />
        <ProductStrip />
        <FpsSection />
        <BuildTeaser />
        <Guides />
        <HomeV2Tail />
      </main>
    );

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
