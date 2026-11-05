import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { fpsScene, games, type GameId, type Resolution } from '../content';
import { track } from '../lib/analytics';
import { formatDate, formatFps } from '../lib/format';
import { onLenis } from '../lib/scroll';
import { useInView } from '../hooks/useInView';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * Pinned FPS race: one tab per product card. Scroll progress goes to a CSS variable (--p)
 * via GSAP ScrollTrigger and each bar derives its scaleX from it, so scrolling never
 * re-renders React. Without the pin (reduced motion, short screens, GSAP not loaded yet)
 * bars simply show their final length.
 */
export default function FpsScene() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [nearRef, near] = useInView<HTMLDivElement>({ once: true, rootMargin: '900px 0px', threshold: 0 });
  const [tab, setTab] = useState(0);
  const [res, setRes] = useState<Resolution>('1080p');
  const [game, setGame] = useState<GameId | null>(null);

  const part = fpsScene.parts[tab];
  const bars = useMemo(() => {
    const vals = games.map((g) => part.fps[g.id][res]);
    const max = Math.max(1, ...vals.map((v) => v ?? 0));
    return games.map((g, i) => ({ ...g, value: vals[i], target: vals[i] == null ? 1 : (vals[i] as number) / max }));
  }, [part, res]);

  // Pinned scrub: GSAP downloads only when the section is about a screen away.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !near || reduced || !window.matchMedia('(min-height: 560px)').matches) return;
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
      requestAnimationFrame(() => ScrollTrigger.refresh());
      cleanup = () => {
        offLenis();
        st.kill();
        el.style.removeProperty('--p');
      };
    })();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [near, reduced]);

  const pickTab = (i: number) => {
    setTab(i);
    track('game_check', { section: 'fps_scene', product: fpsScene.parts[i].name, game: game ?? 'all', resolution: res });
  };
  const onTabKey = (e: KeyboardEvent) => {
    const n = fpsScene.parts.length;
    const next = { ArrowRight: (tab + 1) % n, ArrowLeft: (tab - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    pickTab(next);
    tabRefs.current[next]?.focus();
  };
  const pickGame = (g: GameId) => {
    setGame(g);
    track('game_check', { section: 'fps_scene', product: part.name, game: g, resolution: res });
  };
  const pickRes = (r: Resolution) => {
    setRes(r);
    track('game_check', { section: 'fps_scene', product: part.name, game: game ?? 'all', resolution: r });
  };

  return (
    <section ref={sectionRef} aria-label={`${fpsScene.eyebrow}: ${part.name}`} className="relative flex min-h-[100svh] items-center py-10 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(50% 40% at 20% 70%, color-mix(in srgb, var(--orange) 9%, transparent), transparent 70%)' }}
      />
      <div ref={nearRef} className="container-x relative">
        <div className="card p-4 sm:p-7">
          {/* one tab per product card */}
          <div role="tablist" aria-label={fpsScene.tabsLabel} className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {fpsScene.parts.map((p, i) => (
              <button
                key={p.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`fps-tab-${p.id}`}
                aria-selected={i === tab}
                aria-controls="fps-panel"
                tabIndex={i === tab ? 0 : -1}
                onClick={() => pickTab(i)}
                onKeyDown={onTabKey}
                className={`min-h-11 shrink-0 snap-start rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors sm:text-[15px] ${
                  i === tab ? 'border-accent bg-accent text-ink' : 'border-line text-fg hover:border-muted'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div id="fps-panel" role="tabpanel" aria-labelledby={`fps-tab-${part.id}`} className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-full border border-line p-1" role="group" aria-label={fpsScene.resolutionLabel}>
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
              <div className="flex flex-wrap gap-2" role="group" aria-label={fpsScene.gameLabel}>
                {games.map((g) => (
                  <button key={g.id} type="button" className="chip min-h-9 text-sm" aria-pressed={g.id === game} onClick={() => pickGame(g.id)}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <ul className="mt-6 space-y-5" aria-label={`${part.name}, ${res}`}>
              {bars.map((b, i) => {
                const dim = game != null && game !== b.id;
                const style = {
                  '--t': b.target,
                  '--d': i * 0.12,
                  transform: 'scaleX(calc(var(--t) * clamp(0, (var(--p, 1) - var(--d)) * 1.9, 1)))',
                } as CSSProperties;
                return (
                  <li key={b.id} className="transition-opacity duration-300" style={{ opacity: dim ? 0.5 : 1 }}>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      {/* game name ≥ 16 px on phones: no tiny axis labels */}
                      <span className="text-base font-semibold sm:text-lg">{b.name}</span>
                      <span className="placeholder-val font-display text-2xl font-bold">
                        {formatFps(b.value)} <span className="text-sm font-medium text-muted">{fpsScene.fpsUnit}</span>
                      </span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-raised sm:h-5" aria-hidden>
                      <div
                        className={`h-full origin-left rounded-full transition-transform duration-[600ms] ease-[var(--ease-out)] ${b.value == null ? 'hatch' : 'bg-accent'}`}
                        style={style}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 space-y-1 border-t border-line pt-4 text-xs text-muted sm:text-sm">
              <p className="text-fg">
                {fpsScene.sourcePrefix} {fpsScene.source.name}, {formatDate(fpsScene.source.date)}
              </p>
              <p>{fpsScene.settingsNote}</p>
              {bars.some((b) => b.value == null) && <p>{fpsScene.illustrativeNote}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
