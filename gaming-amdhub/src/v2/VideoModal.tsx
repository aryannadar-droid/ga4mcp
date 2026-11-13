import { useEffect, useRef } from 'react';
import { getLenis } from '../lib/scroll';
import { CloseIcon } from '../components/Icons';
import { explainers, type VideoSrc } from './content';
import { trackV2 } from './lib';

const MARKS = [0, 25, 50, 75, 100];

/**
 * Video in a native modal <dialog> (focus trap, Esc closes). Sends explainer_play at
 * 0 / 25 / 50 / 75 / 100 % watched, once each per opening.
 */
export function VideoModal({ id, title, src, onClose }: { id: string; title: string; src: VideoSrc; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sent = useRef(new Set<number>());

  useEffect(() => {
    dialogRef.current?.showModal();
    getLenis()?.stop();
    return () => getLenis()?.start();
  }, []);

  const progress = (v: HTMLVideoElement) => {
    if (!v.duration) return;
    const pct = v.ended ? 100 : (v.currentTime / v.duration) * 100;
    for (const m of MARKS)
      if (pct >= m && !sent.current.has(m)) {
        sent.current.add(m);
        trackV2('explainer_play', { section: 'v2_video', video_id: id, percent_watched: m });
      }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby={`v2-video-${id}`}
      data-lenis-prevent
      className="v2 m-auto w-[min(100vw-24px,960px)] max-w-none overflow-hidden rounded-3xl border border-[var(--v2-line)] p-0 backdrop:bg-black/85"
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <h2 id={`v2-video-${id}`} className="font-display text-lg font-semibold">
          {title}
        </h2>
        <button type="button" onClick={onClose} aria-label={explainers.close} className="v2-btn-quiet flex size-10 items-center justify-center rounded-full">
          <CloseIcon />
        </button>
      </div>
      <video
        className="block aspect-video w-full bg-black"
        controls
        autoPlay
        playsInline
        preload="metadata"
        onPlay={(e) => progress(e.currentTarget)}
        onTimeUpdate={(e) => progress(e.currentTarget)}
        onEnded={(e) => progress(e.currentTarget)}
      >
        <source src={src.webm} type="video/webm" />
        <source src={src.mp4} type="video/mp4" />
      </video>
      <p className="px-5 py-3 text-xs text-[var(--v2-muted)]">{explainers.placeholderNote}</p>
    </dialog>
  );
}
