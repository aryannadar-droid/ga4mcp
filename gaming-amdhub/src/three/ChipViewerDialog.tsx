import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AmbientLight, DirectionalLight, Group, HemisphereLight, MathUtils } from 'three';
import { chip3d } from '../content';
import { getLenis } from '../lib/scroll';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { CloseIcon } from '../components/Icons';
import { buildChip } from './chipModel';
import { brandColors } from './parts';
import { createStage, tween, webglAvailable, type Stage } from './stage';

const HOME = { x: 0, y: 5.2, z: 6.4 };

/** Modal 3D chip viewer: drag/pinch/scroll, keyboard, flip to the contacts, optional auto-rotate. */
export default function ChipViewerDialog({ onClose }: { onClose: () => void }) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const chipRef = useRef<Group | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [spin, setSpin] = useState(!reduced);
  const [ok] = useState(webglAvailable);
  const flipMounted = useRef(false);

  // open as a true modal (focus trap, Esc, inert page) and pause smooth scroll behind it
  useEffect(() => {
    const d = dialogRef.current!;
    d.showModal();
    getLenis()?.stop();
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      getLenis()?.start();
      document.documentElement.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (!ok || !canvasRef.current) return;
    const stage = createStage(canvasRef.current, { reduced, fov: 32 });
    stageRef.current = stage;
    const { orange } = brandColors();
    const gold = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || '#d4a64a';

    stage.scene.add(new HemisphereLight('#ffffff', '#1a1a1f', 0.6), new AmbientLight('#ffffff', 0.15));
    const key = new DirectionalLight('#ffffff', 2.4);
    key.position.set(3, 6, 4);
    const rim = new DirectionalLight(orange, 3.2); // silicon-heat edge light
    rim.position.set(-5, 1.5, -4);
    const under = new DirectionalLight(orange, 1.2);
    under.position.set(2, -4, 2);
    stage.scene.add(key, rim, under);

    const pivot = new Group();
    const chip = buildChip(chip3d.engraving, gold);
    pivot.add(chip);
    pivot.rotation.y = -0.35;
    stage.scene.add(pivot);
    chipRef.current = chip;

    const { camera, controls } = stage;
    camera.position.set(HOME.x, HOME.y, HOME.z);
    controls.target.set(0, 0, 0);
    controls.minDistance = 3;
    controls.maxDistance = 11;
    controls.autoRotateSpeed = 1.4;
    controls.update();
    const stopSpin = () => setSpin(false);
    controls.addEventListener('start', stopSpin);

    // gentle entrance: chip rises and settles
    tween(stage, 600, (p) => {
      chip.position.y = MathUtils.lerp(-0.8, 0, p);
      chip.rotation.z = MathUtils.lerp(0.25, 0, p);
    }, reduced);

    return () => {
      controls.removeEventListener('start', stopSpin);
      stage.dispose();
      stageRef.current = null;
    };
  }, [ok, reduced]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.controls.autoRotate = spin && !reduced;
    stage.invalidate();
  }, [spin, reduced]);

  useEffect(() => {
    const stage = stageRef.current;
    const chip = chipRef.current;
    if (!stage || !chip) return;
    if (!flipMounted.current) {
      flipMounted.current = true; // nothing to flip on first render
      return;
    }
    const from = chip.rotation.x;
    const to = flipped ? Math.PI : 0;
    tween(stage, 600, (p) => {
      chip.rotation.x = MathUtils.lerp(from, to, p);
      chip.position.y = Math.sin(p * Math.PI) * 0.9; // lift while turning over
    }, reduced);
  }, [flipped, reduced]);

  const reset = () => {
    const stage = stageRef.current;
    if (!stage) return;
    setFlipped(false);
    stage.camera.position.set(HOME.x, HOME.y, HOME.z);
    stage.controls.target.set(0, 0, 0);
    stage.invalidate();
  };

  const onKey = (e: KeyboardEvent) => {
    const s = stageRef.current;
    if (!s) return;
    const step = 0.12;
    const map: Record<string, () => void> = {
      ArrowLeft: () => s.orbitBy(-step, 0),
      ArrowRight: () => s.orbitBy(step, 0),
      ArrowUp: () => s.orbitBy(0, -step),
      ArrowDown: () => s.orbitBy(0, step),
      '+': () => s.zoomBy(0.88),
      '=': () => s.zoomBy(0.88),
      '-': () => s.zoomBy(1.14),
    };
    if (map[e.key]) {
      e.preventDefault();
      setSpin(false);
      map[e.key]();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="chip3d-title"
      data-lenis-prevent
      className="m-auto w-[min(100vw-24px,960px)] max-w-none overflow-hidden rounded-3xl border border-line bg-surface p-0 text-fg backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id="chip3d-title" className="text-lg font-semibold sm:text-xl">
          {chip3d.title}
        </h2>
        <button type="button" onClick={onClose} className="btn btn-ghost min-h-10 px-3" aria-label={chip3d.close}>
          <CloseIcon />
        </button>
      </div>
      <div
        className="relative aspect-square max-h-[62vh] w-full sm:aspect-[16/10]"
        style={{ background: 'radial-gradient(50% 50% at 50% 55%, color-mix(in srgb, var(--orange) 16%, transparent), transparent 70%)' }}
      >
        {ok ? (
          <div
            tabIndex={0}
            role="img"
            aria-label={`${chip3d.title}. ${chip3d.hintKeys}`}
            onKeyDown={onKey}
            className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
          >
            <canvas ref={canvasRef} className="block h-full w-full" />
          </div>
        ) : (
          <p className="absolute inset-0 flex items-center justify-center p-8 text-center text-muted">{chip3d.noWebgl}</p>
        )}
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-muted">{chip3d.hint}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4">
        <button type="button" className="chip" aria-pressed={flipped} onClick={() => setFlipped((f) => !f)} disabled={!ok}>
          {flipped ? chip3d.flipBack : chip3d.flip}
        </button>
        {!reduced && (
          <button type="button" className="chip" aria-pressed={spin} onClick={() => setSpin((v) => !v)} disabled={!ok}>
            {chip3d.autoRotate}
          </button>
        )}
        <button type="button" className="chip" onClick={reset} disabled={!ok}>
          {chip3d.reset}
        </button>
        <span className="ml-auto text-xs text-muted">{chip3d.note}</span>
      </div>
    </dialog>
  );
}
