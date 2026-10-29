import { lazy, Suspense } from 'react';
import { fpsScene } from '../content';
import { useInView } from '../hooks/useInView';

/** The scene (and GSAP inside it) only downloads when the visitor is ~1 screen away. */
const FpsScene = lazy(() => import('./FpsScene'));

export function FpsSection() {
  const [ref, near] = useInView<HTMLDivElement>({ once: true, rootMargin: '900px 0px', threshold: 0 });
  return (
    <div ref={ref} id="fps">
      {near ? (
        <Suspense fallback={<Shell />}>
          <FpsScene />
        </Suspense>
      ) : (
        <Shell />
      )}
    </div>
  );
}

function Shell() {
  return (
    <section aria-label={fpsScene.title} className="container-x min-h-[720px] py-16 sm:py-24">
      <p className="eyebrow mb-3">{fpsScene.eyebrow}</p>
      <h2 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">{fpsScene.title}</h2>
    </section>
  );
}
