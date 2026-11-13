import { useState } from 'react';
import { navigate } from '../lib/router';
import { anchors, explainers, heroV2 as H } from './content';
import { VideoModal } from './VideoModal';

/**
 * "You already play on AMD." Value first: no prices, no Buy Now, no product boxes.
 * One orange action (the game check); the story is a quiet outline button.
 */
export function HeroV2() {
  const [story, setStory] = useState(false);
  const words = H.headline.split(' ');

  return (
    <section aria-labelledby="v2-hero-title" className="relative overflow-hidden pt-28 pb-14 sm:pt-32 lg:min-h-[88svh] lg:pt-36 lg:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(55% 50% at 72% 42%, color-mix(in srgb, var(--v2-gold-soft) 10%, transparent), transparent 70%)' }}
      />
      <div className="container-x relative grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div className="min-w-0">
          <p className="mb-5 text-xs font-semibold tracking-[0.18em] text-[var(--v2-gold-soft)] uppercase">{H.eyebrow}</p>
          <h1 id="v2-hero-title" className="v2-display fade-reveal text-[clamp(2.9rem,11vw,6.2rem)]">
            {words.map((w, i) => {
              const accent = w.replace(/[^\w]/g, '') === H.accent;
              return (
                <span key={i}>
                  {accent ? (
                    <>
                      <span className="text-[var(--v2-orange)]">{w.replace(/[^\w]/g, '')}</span>
                      {w.replace(/\w/g, '')}
                    </>
                  ) : (
                    w
                  )}
                  {i < words.length - 1 && ' '}
                </span>
              );
            })}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--v2-muted)]">{H.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button id="v2-hero-cta" type="button" className="btn v2-btn-act min-h-12 px-6 text-base" onClick={() => navigate(`#${anchors.check}`)}>
              {H.primary}
            </button>
            <button type="button" aria-haspopup="dialog" className="btn v2-btn-quiet min-h-12 px-6 text-base" onClick={() => setStory(true)}>
              <span aria-hidden>▶</span> {H.secondary}
            </button>
          </div>
        </div>

        <ChipVisual />
      </div>
      {story && <VideoModal id={explainers.story.id} title={explainers.story.title} src={explainers.story.src} onClose={() => setStory(false)} />}
    </section>
  );
}

/** Glowing chip on black (CSS layers, no image request) with three floating tags. */
function ChipVisual() {
  // tags sit on the chip's corners and edges, clear of the RYZEN label
  const tagPos = ['lg:top-[0%] lg:left-[-10%]', 'lg:top-[72%] lg:right-[-14%]', 'lg:bottom-[-4%] lg:left-[-6%]'];
  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      <div className="relative mx-auto aspect-square w-[min(72vw,380px)]" aria-hidden>
        <div
          className="v2-glow absolute inset-[-8%] rounded-full"
          style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--v2-gold-soft) 38%, transparent), color-mix(in srgb, var(--v2-orange) 22%, transparent) 55%, transparent 75%)', filter: 'blur(14px)' }}
        />
        <div
          className="absolute inset-[16%] rounded-[10%] border border-[#2c2d33]"
          style={{
            background:
              'repeating-linear-gradient(90deg, transparent 0 10px, rgba(255,255,255,.04) 10px 12px), repeating-linear-gradient(0deg, transparent 0 10px, rgba(255,255,255,.04) 10px 12px), linear-gradient(145deg, #16171b, #0b0c0f)',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,.9), 0 0 0 6px #0f1013 inset',
            transform: 'rotate(-8deg)',
          }}
        >
          <div
            className="absolute inset-[13%] flex flex-col items-center justify-center rounded-[8%] border border-[#55565e]"
            style={{
              background: 'linear-gradient(135deg, #4b4c54 0%, #24252a 40%, #3b3c43 62%, #1d1e22 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18), 0 0 40px -6px color-mix(in srgb, var(--v2-gold-soft) 55%, transparent)',
            }}
          >
            <span className="font-display text-[clamp(18px,5vw,30px)] font-bold tracking-[0.2em] text-[var(--v2-text)]/90">{H.chipLabel}</span>
            <span className="absolute inset-x-[14%] bottom-[12%] h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--v2-gold-soft), transparent)' }} />
          </div>
          {/* gold pin-1 corner */}
          <span className="absolute bottom-[6%] left-[6%] size-0 border-t-[12px] border-r-[12px] border-t-transparent border-r-transparent" style={{ borderLeft: '12px solid var(--v2-gold)', borderBottom: '0' }} />
        </div>
      </div>
      {/* tags: floating around the chip on desktop, a tidy list under it on phones */}
      <ul className="mt-6 grid gap-2 lg:mt-0">
        {H.tags.map((t, i) => (
          <li
            key={t.title}
            className={`v2-float rounded-2xl border bg-[var(--v2-black-2)]/90 px-4 py-2.5 backdrop-blur lg:absolute ${tagPos[i]}`}
            style={{ animationDelay: `${i * 0.8}s`, borderColor: 'color-mix(in srgb, var(--v2-gold) 35%, transparent)' }}
          >
            <span className="text-sm font-semibold text-[var(--v2-gold-soft)]">{t.title}</span>
            <span className="text-sm text-[var(--v2-muted)]"> · {t.line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
