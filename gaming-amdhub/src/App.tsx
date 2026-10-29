import { lazy, Suspense, useEffect } from 'react';
import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion';
import { personas, site } from './content';
import { useHashScroll, usePath } from './lib/router';
import { setLenis } from './lib/scroll';
import { useReducedMotion } from './hooks/useReducedMotion';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileBar } from './components/MobileBar';
import Home from './pages/Home';

// Persona pages are small (~5 KB gzip together) and are landing pages in their own right:
// bundling them avoids a second round trip before their LCP. Only the guide stub is lazy.
import NewGamingPc from './pages/NewGamingPc';
import Upgrade from './pages/Upgrade';
import WorkAndPlay from './pages/WorkAndPlay';
const NotFound = lazy(() => import('./pages/NotFound'));

const routes: Record<string, React.ComponentType> = {
  '/': Home,
  [personas['new-build'].route]: NewGamingPc,
  [personas.upgrade.route]: Upgrade,
  [personas['work-play'].route]: WorkAndPlay,
};

/** Lenis smooth scroll — loaded after first paint, never under prefers-reduced-motion. */
function useSmoothScroll(reduced: boolean) {
  useEffect(() => {
    if (reduced) return;
    let destroyed = false;
    let instance: { destroy: () => void } | null = null;
    const start = () =>
      import('lenis').then(({ default: Lenis }) => {
        if (destroyed) return;
        const lenis = new Lenis({ autoRaf: true, duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 4) });
        instance = lenis;
        setLenis(lenis);
      });
    const id = window.setTimeout(start, 300);
    return () => {
      destroyed = true;
      window.clearTimeout(id);
      instance?.destroy();
      setLenis(null);
    };
  }, [reduced]);
}

export default function App() {
  const path = usePath();
  const reduced = useReducedMotion();
  useSmoothScroll(reduced);
  useHashScroll(path);
  const Page = routes[path.replace(/\/+$/, '') || '/'] ?? NotFound;

  return (
    <LazyMotion features={domAnimation} strict>
      {/* reducedMotion="user": Framer drops transforms and keeps opacity fades. */}
      <MotionConfig reducedMotion="user" transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.4 }}>
        <a href="#main" className="btn btn-primary fixed top-3 left-3 z-[60] -translate-y-24 focus:translate-y-0">
          {site.skipLink}
        </a>
        <Header />
        <Suspense fallback={<main id="main" className="min-h-screen" />}>
          <Page />
        </Suspense>
        <Footer showAlert={path !== personas.upgrade.route && path !== personas['work-play'].route} />
        <MobileBar />
      </MotionConfig>
    </LazyMotion>
  );
}
