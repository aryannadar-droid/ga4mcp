import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { rtCompare } from '../content';

const clamp = (v: number) => Math.max(0, Math.min(100, v));

/**
 * Ray-tracing Off / On drag-to-compare. Off sits on the left, On is revealed on the right.
 * Drag anywhere on the image, or focus the handle and use the arrow keys (Home / End / PageUp / PageDown too).
 * The divider moves with transform; the reveal is a clip-path driven by direct input, not an animation.
 */
export function RtCompare() {
  const [pos, setPos] = useState(50);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fromPointer = (e: PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    setPos(clamp(((e.clientX - r.left) / r.width) * 100));
  };

  const onKey = (e: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 };
    if (e.key in step) setPos((p) => clamp(p + step[e.key]));
    else if (e.key === 'Home') setPos(0);
    else if (e.key === 'End') setPos(100);
    else return;
    e.preventDefault();
  };

  return (
    <figure className="mt-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-xl font-semibold">{rtCompare.title}</h3>
        <p className="text-sm text-muted">{rtCompare.sub}</p>
      </div>
      <div
        ref={boxRef}
        className="relative aspect-[16/9] w-full cursor-ew-resize touch-pan-y overflow-hidden rounded-2xl border border-line bg-raised select-none"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          fromPointer(e);
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <img src={rtCompare.imgOff} alt={rtCompare.altOff} width={1600} height={900} loading="lazy" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
        <img
          src={rtCompare.imgOn}
          alt={rtCompare.altOn}
          width={1600}
          height={900}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        />
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold sm:text-sm">{rtCompare.off}</span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold sm:text-sm">{rtCompare.on}</span>
        {/* divider + handle, positioned with transform */}
        <div className="pointer-events-none absolute inset-0" style={{ transform: `translateX(${pos}%)` }}>
          <div className="absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-fg/90" />
          <div
            role="slider"
            tabIndex={0}
            aria-label={rtCompare.handleLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            aria-valuetext={`${Math.round(100 - pos)}% ${rtCompare.on}`}
            onKeyDown={onKey}
            className="pointer-events-auto absolute top-1/2 left-0 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-fg bg-ink/85 text-fg shadow-lg"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
            </svg>
          </div>
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-muted">{rtCompare.caption}</figcaption>
    </figure>
  );
}
