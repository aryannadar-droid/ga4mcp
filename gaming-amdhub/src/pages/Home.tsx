import { Hero } from '../sections/Hero';
import { PersonaDoors } from '../sections/PersonaDoors';
import { ProductStrip } from '../sections/ProductStrip';
import { FpsSection } from '../sections/FpsSection';
import { BuildTeaser } from '../sections/BuildTeaser';
import { Sellers } from '../sections/Sellers';
import { Guides } from '../sections/Guides';

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <PersonaDoors />
      <ProductStrip />
      <FpsSection />
      <BuildTeaser />
      <Sellers />
      <Guides />
    </main>
  );
}
