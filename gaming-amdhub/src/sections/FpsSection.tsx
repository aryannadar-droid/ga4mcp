import { fpsScene } from '../content';
import { RtCompare } from '../components/RtCompare';
import { SectionHeading } from '../components/SectionHeading';
import FpsScene from './FpsScene';

/**
 * Section 5. Intro + ray-tracing slider scroll normally; the FPS race below pins.
 * Everything renders straight away (bars at their final length); only GSAP is lazy.
 */
export function FpsSection() {
  return (
    <div id="fps">
      <section aria-labelledby="fps-title" className="container-x pt-16 sm:pt-24">
        <SectionHeading id="fps-title" eyebrow={fpsScene.eyebrow} title={fpsScene.title} sub={fpsScene.sub} />
        <RtCompare />
      </section>
      <FpsScene />
    </div>
  );
}
