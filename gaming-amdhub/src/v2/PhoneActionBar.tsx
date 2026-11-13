import { useEffect, useState } from 'react';
import { navigate } from '../lib/router';
import { anchors, phoneBar } from './content';

/**
 * Phones only: pinned bottom bar with the one orange action plus a quiet "Find a seller".
 * One orange per screen: the bar hides while the hero's own "Will my game run?" is on screen
 * and while the game check itself is in view.
 */
export function PhoneActionBar() {
  const [show, setShow] = useState(false);
  // fully removed (hidden) once it has slid away, so it never sits on the page invisible
  const [present, setPresent] = useState(false);
  useEffect(() => {
    if (show) {
      setPresent(true);
      return;
    }
    const id = window.setTimeout(() => setPresent(false), 320);
    return () => window.clearTimeout(id);
  }, [show]);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!present || !show) return setEntered(false);
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [present, show]);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const cta = document.getElementById('v2-hero-cta');
      const game = document.getElementById(anchors.check);
      const vh = window.innerHeight;
      const heroGone = !cta || cta.getBoundingClientRect().bottom < 0;
      const g = game?.getBoundingClientRect();
      const inCheck = !!g && g.top < vh * 0.75 && g.bottom > vh * 0.25;
      setShow(heroGone && !inCheck);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // room for the bar below the (locked) footer
    document.body.classList.add('v2-has-bar');
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.body.classList.remove('v2-has-bar');
    };
  }, []);

  return (
    <div
      className="v2 fixed inset-x-0 bottom-0 z-40 border-t border-[var(--v2-line)] pb-[env(safe-area-inset-bottom)] transition-[transform,opacity] duration-300 ease-[var(--ease-out)] md:hidden"
      style={{ background: 'color-mix(in srgb, var(--v2-black) 92%, transparent)', backdropFilter: 'blur(16px)', transform: entered ? 'none' : 'translateY(110%)', opacity: entered ? 1 : 0 }}
      hidden={!present}
      inert={!show}
      data-v2-bar=""
    >
      <div className="flex gap-2 px-4 py-2.5">
        <button type="button" className="btn v2-btn-act min-h-12 flex-1 px-3 text-[15px]" onClick={() => navigate(`#${anchors.check}`)}>
          {phoneBar.check}
        </button>
        <button type="button" className="btn v2-btn-quiet min-h-12 flex-1 px-3 text-[15px]" onClick={() => navigate(`#${anchors.seller}`)}>
          {phoneBar.seller}
        </button>
      </div>
    </div>
  );
}
