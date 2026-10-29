import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { fpsScene, games, type GameId, type Resolution } from '../content';
import { track } from '../lib/analytics';
import { formatDate, formatFps } from '../lib/format';
import { onLenis } from '../lib/scroll';
import { useInView } from '../hooks/useInView';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * Section 5 — pinned scroll scene. Scroll progress is written to a CSS variable (--p) by
 * GSAP ScrollTrigger; each bar derives its scaleX from --p in CSS, so scrolling never
 * re-renders React. Short screens and reduced motion skip the pin.
 */
export default function FpsScene() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [visRef, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.35 });
  const [pinned, setPinned] = useState(false);
  const [partId, setPartId] = useState(fpsScene.parts[0].id);
  const [res, setRes] = useState<Resolution>('1080p');
  const [game, setGame] = useState<GameId | null>(null);

  const part = fpsScene.parts.find((p) => p.id === partId) ?? fpsScene.parts[0];
  const bars = useMemo(() => {
    const vals = games.map((g) => part.fps[g.id][res]);
    const max = Math.max(1, ...vals.map((v) => v ?? 0));
    return games.map((g, i) => ({ ...g, value: vals[i], target: vals[i] == null ? 1 : (vals[i] as number) / max }));
  }, [part, res]);

  // Pinned scrub (lazy GSAP). Only on screens tall enough to hold the whole scene.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduced || !window.matchMedia('(min-height: 560px)').matches) return;
    let cancelled = false;
    let cleanup = () => {};
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'bottom bottom',
        end: '+=110%',
        pin: true,
        scrub: 0.4,
        onUpdate: (self) => el.style.setProperty('--p', self.progress.toFixed(3)),
      });
      el.style.setProperty('--p', st.progress.toFixed(3));
      const offLenis = onLenis((l) => l?.on('scroll', ScrollTrigger.update));
      setPinned(true);
      requestAnimationFrame(() => ScrollTrigger.refresh());
      cleanup = () => {
        offLenis();
        st.kill();
      };
    })();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [reduced]);

  // Fallback (no pin): play to the end once the bars are on screen.
  const progress = reduced ? 1 : pinned ? undefined : inView ? 1 : 0;

  const pick = (g: GameId) => {
    setGame(g);
    track('game_check', { section: 'fps_scene', product: part.name, game: g, resolution: res });
  };
  const pickRes = (r: Resolution) => {
    setRes(r);
    track('game_check', { section: 'fps_scene', product: part.name, game: game ?? 'all', resolution: r });
  };

  // Non-pinned modes drive --p from React; when pinned, only ScrollTrigger writes it.
  useEffect(() => {
    if (progress != null) sectionRef.current?.style.setProperty('--p', String(progress));
  }, [progress]);

  return (
    <section ref={sectionRef} aria-labelledby="fps-title" className="relative flex min-h-[100svh] items-center py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(50% 40% at 20% 70%, color-mix(in srgb, var(--orange) 9%, transparent), transparent 70%)' }}
      />
      <div ref={visRef} className="container-x relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <p className="eyebrow mb-3">{fpsScene.eyebrow}</p>
          <h2 id="fps-title" className="text-3xl leading-[1.08] font-semibold sm:text-4xl lg:text-5xl">
            {fpsScene.title}
          </h2>
          <p className="mt-3 text-muted sm:text-lg">{fpsScene.sub}</p>

          <fieldset className="mt-6">
            <legend className="mb-2 text-sm font-medium text-muted">{fpsScene.partLabel}</legend>
            <div className="flex flex-wrap gap-2">
              {fpsScene.parts.map((p) => (
                <button key={p.id} type="button" className="chip min-h-10 text-[13px] sm:text-sm" aria-pressed={p.id === partId} onClick={() => setPartId(p.id)}>
                  {p.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium text-muted">{fpsScene.resolutionLabel}</legend>
            <div className="inline-flex rounded-full border border-line p-1">
              {fpsScene.resolutions.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={r === res}
                  onClick={() => pickRes(r)}
                  className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors ${r === res ? 'bg-accent text-ink' : 'text-fg'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="card p-5 sm:p-7">
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-muted">{fpsScene.gameLabel}</legend>
            <div className="flex flex-wrap gap-2">
              {games.map((g) => (
                <button key={g.id} type="button" className="chip min-h-10 text-[13px] sm:text-sm" aria-pressed={g.id === game} onClick={() => pick(g.id)}>
                  {g.name}
                </button>
              ))}
            </div>
          </fieldset>

          <ul className="mt-6 space-y-4" aria-label={`${part.name}, ${res}`}>
            {bars.map((b, i) => {
              const dim = game != null && game !== b.id;
              const style = {
                '--t': b.target,
                '--d': i * 0.12,
                transform: 'scaleX(calc(var(--t) * clamp(0, (var(--p, 0) - var(--d)) * 1.9, 1)))',
                transitionDelay: pinned ? '0ms' : `${i * 90}ms`,
              } as CSSProperties;
              return (
                <li key={b.id} className="transition-opacity duration-300" style={{ opacity: dim ? 0.45 : 1 }}>
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="font-medium">{b.name}</span>
                    <span className="placeholder-val font-display text-lg font-semibold">
                      {formatFps(b.value)} <span className="text-xs text-muted">{fpsScene.fpsUnit}</span>
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-raised" aria-hidden>
                    <div
                      className={`h-full origin-left rounded-full transition-transform duration-[600ms] ease-[var(--ease-out)] ${b.value == null ? 'hatch' : 'bg-accent'}`}
                      style={style}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 space-y-1 border-t border-line pt-4 text-xs text-muted">
            <p className="text-fg">
              {fpsScene.sourcePrefix} {fpsScene.source.name}, {formatDate(fpsScene.source.date)}
            </p>
            <p>{fpsScene.settingsNote}</p>
            {bars.some((b) => b.value == null) && <p>{fpsScene.illustrativeNote}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
