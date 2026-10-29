import { m } from 'framer-motion';
import { fadeUp, stagger } from '../lib/motion';

interface Props {
  eyebrow?: string;
  title: string;
  sub?: string;
  id?: string;
  align?: 'left' | 'center';
}

export function SectionHeading({ eyebrow, title, sub, id, align = 'left' }: Props) {
  return (
    <m.div
      className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}
      variants={stagger(0.06)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
    >
      {eyebrow && (
        <m.p variants={fadeUp} className="eyebrow mb-3">
          {eyebrow}
        </m.p>
      )}
      <m.h2 variants={fadeUp} id={id} className="text-3xl leading-[1.08] font-semibold sm:text-4xl lg:text-5xl">
        {title}
      </m.h2>
      {sub && (
        <m.p variants={fadeUp} className="mt-4 text-base text-muted sm:text-lg">
          {sub}
        </m.p>
      )}
    </m.div>
  );
}
