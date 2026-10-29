import { useEffect, useRef, useState } from 'react';
import { hero } from '../content';
import { useInView } from '../hooks/useInView';
import { useReducedMotion } from '../hooks/useReducedMotion';

type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

const clamp = (v: number) => Math.max(-1, Math.min(1, v));
const MAX_TILT = 14; // degrees

/**
 * The hero "wow": a layered CSS chip in 3D space with a heat glow behind it.
 * - Slow sway (2 cycles, then rests) + glow pulse (3 cycles): neither loops forever.
 * - Parallax tilt follows the mouse (fine pointers) or the gyroscope (if permitted).
 * - Paused off-screen; static under prefers-reduced-motion.
 */
export function HeroChip() {
  const reduced = useReducedMotion();
  const [visRef, visible] = useInView<HTMLDivElement>({ threshold: 0 });
  const tiltRef = useRef<HTMLDivElement>(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [gyroOn, setGyroOn] = useState(false);

  useEffect(() => {
    if (reduced || !visible) return;
    const el = tiltRef.current;
    if (!el) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    const apply = () => {
      raf = 0;
      el.style.transform = `rotateX(${(-ty * MAX_TILT).toFixed(2)}deg) rotateY(${(tx * MAX_TILT).toFixed(2)}deg)`;
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const fine = window.matchMedia('(pointer: fine)').matches;
    const onPointer = (e: PointerEvent) => {
      tx = clamp((e.clientX / window.innerWidth) * 2 - 1);
      ty = clamp((e.clientY / window.innerHeight) * 2 - 1);
      queue();
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tx = clamp(e.gamma / 30);
      ty = clamp((e.beta - 45) / 30);
      queue();
    };

    if (fine) window.addEventListener('pointermove', onPointer, { passive: true });
    const Ctor = (typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : null) as OrientationCtor | null;
    const listenGyro = !fine && Ctor && (!Ctor.requestPermission || gyroOn);
    if (!fine && Ctor?.requestPermission && !gyroOn) setNeedsPermission(true);
    if (listenGyro) window.addEventListener('deviceorientation', onOrient, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('deviceorientation', onOrient);
    };
  }, [reduced, visible, gyroOn]);

  const askGyro = async () => {
    const Ctor = DeviceOrientationEvent as OrientationCtor;
    try {
      if ((await Ctor.requestPermission?.()) === 'granted') setGyroOn(true);
    } catch {
      /* user dismissed: chip stays static */
    }
    setNeedsPermission(false);
  };

  return (
    <div ref={visRef} className={`relative mx-auto w-[min(78vw,440px)] ${visible ? '' : 'paused-offscreen'}`}>
      <div className="relative aspect-square" style={{ perspective: '1100px' }} aria-hidden>
        {/* heat glow */}
        <div
          className="absolute inset-[6%] rounded-full"
          style={{
            background: 'radial-gradient(closest-side, color-mix(in srgb, var(--orange) 55%, transparent), color-mix(in srgb, var(--orange-deep) 18%, transparent) 55%, transparent 75%)',
            filter: 'blur(18px)',
            animation: reduced ? undefined : 'heat-pulse 4.5s var(--ease-out) 3',
            opacity: 0.7,
          }}
        />
        <div ref={tiltRef} className="absolute inset-0" style={{ transformStyle: 'preserve-3d', transition: 'transform 300ms var(--ease-out)' }}>
          <div
            className="absolute inset-0"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(18deg) rotateY(-16deg) rotateZ(-6deg)',
              animation: reduced ? undefined : 'chip-sway 14s ease-in-out 2',
            }}
          >
            {/* substrate */}
            <div
              className="absolute inset-[14%] rounded-[9%] border border-[#33333a]"
              style={{
                background:
                  'repeating-linear-gradient(90deg, transparent 0 9px, rgba(255,255,255,.05) 9px 11px), repeating-linear-gradient(0deg, transparent 0 9px, rgba(255,255,255,.05) 9px 11px), linear-gradient(145deg, #1d1d22, #101013)',
                boxShadow: '0 40px 80px -20px rgba(0,0,0,.9), inset 0 0 0 6px #141418',
              }}
            />
            {/* die heat, under the lid */}
            <div
              className="absolute inset-[34%] rounded-md"
              style={{ transform: 'translateZ(16px)', background: 'var(--orange)', filter: 'blur(22px)', opacity: 0.55 }}
            />
            {/* integrated heat spreader */}
            <div
              className="absolute inset-[22%] flex flex-col items-center justify-center rounded-[7%] border border-[#55555e]"
              style={{
                transform: 'translateZ(34px)',
                background: 'linear-gradient(135deg, #4a4a52 0%, #26262b 38%, #3a3a41 62%, #1f1f24 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18), 0 0 0 1px rgba(0,0,0,.6), 0 18px 40px -12px color-mix(in srgb, var(--orange) 45%, transparent)',
              }}
            >
              <span className="font-display text-[clamp(18px,4.6vw,30px)] font-bold tracking-[0.18em] text-fg/90">RYZEN</span>
              <span className="mt-1 font-display text-[10px] tracking-[0.3em] text-muted">[MODEL]</span>
              {/* edge light */}
              <span
                className="absolute inset-x-[12%] bottom-[10%] h-px"
                style={{ background: 'linear-gradient(90deg, transparent, var(--orange), transparent)', opacity: 0.9 }}
              />
            </div>
            {/* sheen */}
            <div
              className="absolute inset-[22%] rounded-[7%]"
              style={{ transform: 'translateZ(35px)', background: 'linear-gradient(120deg, rgba(255,255,255,.14), transparent 40%)' }}
            />
          </div>
        </div>
      </div>
      {needsPermission && !reduced && (
        <button type="button" onClick={askGyro} className="btn btn-ghost absolute bottom-0 left-1/2 min-h-10 -translate-x-1/2 text-sm">
          {hero.tiltPermission}
        </button>
      )}
    </div>
  );
}
