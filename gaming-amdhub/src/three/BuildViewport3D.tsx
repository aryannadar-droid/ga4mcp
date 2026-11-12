import { useEffect, useRef, type KeyboardEvent, type MutableRefObject } from 'react';
import { DirectionalLight, HemisphereLight, MathUtils, Vector3 } from 'three';
import { caseFit, type BoardSize } from '../content';
import type { CaseDims, FitResult } from '../lib/caseFit';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { brandColors } from './parts';
import { buildPc, MM, type PartId, type PcModel } from './pcModel';
import { createStage, disposeTree, tween, type Stage } from './stage';

export interface ViewerApi {
  zoom: (factor: number) => void;
  reset: () => void;
}

/** build: assembled, rear-left view · fit: square-on side view for sizes · run: fans spin, glow up */
export type SceneMode = 'build' | 'fit' | 'run';

export const PART_IDS: PartId[] = ['board', 'cpu', 'cooler', 'ram', 'gpu', 'psu'];

interface Props {
  dims: CaseDims;
  board: BoardSize;
  fit: FitResult;
  /** Parts in the case. Newly present parts snap in; removed parts lift out. */
  present: Record<PartId, boolean>;
  gpuLabel: string;
  psuLabel: string;
  glass: boolean;
  mode?: SceneMode;
  /** Touch screens: rotation only after the visitor opts in, so the page still scrolls. */
  interactive: boolean;
  apiRef: MutableRefObject<ViewerApi | null>;
  onReady: () => void;
  label?: string;
}

// rear-left, slightly above: front fans' glow and the card's label face the camera
const VIEW: Record<SceneMode, { dir: Vector3; dist: number }> = {
  build: { dir: new Vector3(0.42, 0.26, 1).normalize(), dist: 1 },
  fit: { dir: new Vector3(0.04, 0.1, 1).normalize(), dist: 1.02 },
  run: { dir: new Vector3(0.3, 0.12, 1).normalize(), dist: 0.86 },
};
const GLOW = { idle: 1.6, run: 4.2 };

/** Case framing: distance that fits the whole case (+ guides) in view. */
function frameDistance(d: CaseDims, fovDeg: number, aspect: number) {
  const r = 0.5 * Math.hypot(d.h, d.w, d.d) * MM * 1.0;
  const vFov = (fovDeg * Math.PI) / 180;
  const fitV = r / Math.sin(vFov / 2);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const fitH = r / Math.sin(hFov / 2);
  return Math.max(fitV, fitH);
}

export default function BuildViewport3D({ dims, board, fit, present, gpuLabel, psuLabel, glass, mode = 'build', interactive, apiRef, onReady, label }: Props) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const modelRef = useRef<PcModel | null>(null);
  const presentRef = useRef<Record<PartId, boolean> | null>(null); // what the scene currently shows
  const modeRef = useRef<SceneMode>(mode);
  const distRef = useRef(0);
  const fine = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

  /* stage: once */
  useEffect(() => {
    const stage = createStage(canvasRef.current!, { reduced, fov: 30 });
    stageRef.current = stage;
    stage.scene.add(new HemisphereLight('#ffffff', '#141418', 0.9));
    const key = new DirectionalLight('#ffffff', 2.2);
    key.position.set(-3, 8, 6);
    const rim = new DirectionalLight(brandColors().orange, 1.4);
    rim.position.set(6, 3, -5);
    stage.scene.add(key, rim);
    stage.controls.maxPolarAngle = 1.58;
    stage.controls.minPolarAngle = 0.15;
    stage.controls.enableZoom = false; // wheel keeps scrolling the page; zoom via buttons / pinch
    onReady();
    return () => {
      stage.dispose();
      stageRef.current = null;
      modelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  /* (re)build the PC whenever the case, board or chosen parts' labels change — one rebuild per frame */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const raf = requestAnimationFrame(() => {
      const { orange } = brandColors();
      const model = buildPc({ dims, board, sizes: caseFit.partSizes, fit, glass, orange, gpuLabel, psuLabel, unit: caseFit.unit });
      const shown = presentRef.current;
      PART_IDS.forEach((id) => (model.parts[id].visible = !!shown?.[id]));
      model.glow.intensity = modeRef.current === 'run' ? GLOW.run : GLOW.idle;
      if (modelRef.current) {
        stage.scene.remove(modelRef.current.container);
        disposeTree(modelRef.current.container);
      }
      stage.scene.add(model.container);
      modelRef.current = model;

      // keep the visitor's angle and zoom ratio; re-centre on the new case
      const { camera, controls } = stage;
      const dist = frameDistance(dims, camera.fov, camera.aspect || 1);
      const target = new Vector3(0, (dims.h * MM) / 2, 0);
      const v = VIEW[modeRef.current];
      const dir = distRef.current ? camera.position.clone().sub(controls.target).normalize() : v.dir.clone();
      const ratio = distRef.current ? camera.position.distanceTo(controls.target) / distRef.current : v.dist;
      distRef.current = dist;
      controls.target.copy(target);
      controls.minDistance = dist * 0.4;
      controls.maxDistance = dist * 1.6;
      camera.position.copy(target).add(dir.multiplyScalar(dist * ratio));
      camera.lookAt(target);
      stage.invalidate();
      // a fresh model starts still: restart the spin if the build is running
      if (modeRef.current === 'run') spin(stage);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims, board, fit, glass, gpuLabel, psuLabel, reduced]);

  /* parts in / out: snap in from above and out through the glass; lift out the same way */
  useEffect(() => {
    const stage = stageRef.current;
    const model = modelRef.current;
    const prev = presentRef.current;
    presentRef.current = { ...present };
    if (!stage || !model) return;
    let delay = 0;
    for (const id of PART_IDS) {
      const was = !!prev?.[id];
      const now = present[id];
      if (was === now) continue;
      const g = model.parts[id];
      const start = delay;
      delay += 140; // stagger when several parts change at once
      const run = () => {
        if (now) {
          g.visible = true;
          tween(stage, 520, (p) => g.position.set(0, (1 - p) * 140, (1 - p) * 260), reduced);
        } else {
          tween(stage, 360, (p) => {
            g.position.set(0, p * 140, p * 260);
            if (p >= 1) {
              g.visible = false;
              g.position.set(0, 0, 0);
            }
          }, reduced);
        }
      };
      if (start && !reduced) window.setTimeout(run, start);
      else run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PART_IDS.map((id) => (present[id] ? 1 : 0)).join(''), reduced]);

  /* scene mode: fly the camera, brighten the glow and spin the fans while running */
  useEffect(() => {
    modeRef.current = mode;
    const stage = stageRef.current;
    const model = modelRef.current;
    if (!stage || !model) return;
    const { camera, controls } = stage;
    const v = VIEW[mode];
    const from = camera.position.clone().sub(controls.target);
    const to = v.dir.clone().multiplyScalar(distRef.current * v.dist);
    const g0 = model.glow.intensity;
    const g1 = mode === 'run' ? GLOW.run : GLOW.idle;
    tween(stage, 700, (p) => {
      const off = from.clone().lerp(to, p).setLength(MathUtils.lerp(from.length(), to.length(), p));
      camera.position.copy(controls.target).add(off);
      camera.lookAt(controls.target);
      if (modelRef.current) modelRef.current.glow.intensity = MathUtils.lerp(g0, g1, p);
    }, reduced);
    if (mode === 'run') spin(stage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, reduced]);

  /** Turn fan rotors while mode is "run". Under reduced motion fans stay still (glow only). */
  function spin(stage: Stage) {
    if (reduced) return;
    const model = modelRef.current;
    if (!model) return;
    stage.addTick((dt) => {
      if (modeRef.current !== 'run' || modelRef.current !== model) return false;
      for (const r of model.rotors) r.rotation.z += dt * 9;
      return true;
    });
  }

  /* glass toggle without a rebuild */
  useEffect(() => {
    if (modelRef.current) modelRef.current.glass.visible = glass;
    stageRef.current?.invalidate();
  }, [glass]);

  /* input mode */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const on = fine || interactive;
    stage.controls.enabled = on;
    stage.controls.enableZoom = !fine && interactive; // pinch on touch once opted in
    stage.renderer.domElement.style.touchAction = on && !fine ? 'none' : 'pan-y';
  }, [interactive, fine]);

  apiRef.current = {
    zoom: (f) => stageRef.current?.zoomBy(f),
    reset: () => {
      const s = stageRef.current;
      if (!s) return;
      const v = VIEW[modeRef.current];
      s.camera.position.copy(s.controls.target).add(v.dir.clone().multiplyScalar(distRef.current * v.dist));
      s.invalidate();
    },
  };

  const onKey = (e: KeyboardEvent) => {
    const s = stageRef.current;
    if (!s) return;
    const k: Record<string, () => void> = {
      ArrowLeft: () => s.orbitBy(-0.12, 0),
      ArrowRight: () => s.orbitBy(0.12, 0),
      ArrowUp: () => s.orbitBy(0, -0.1),
      ArrowDown: () => s.orbitBy(0, 0.1),
      '+': () => s.zoomBy(0.88),
      '=': () => s.zoomBy(0.88),
      '-': () => s.zoomBy(1.14),
    };
    if (k[e.key]) {
      e.preventDefault();
      k[e.key]();
    }
  };

  return (
    <div
      tabIndex={0}
      role="img"
      aria-label={`${label ?? caseFit.viewerLabel}. ${dims.h} × ${dims.w} × ${dims.d} ${caseFit.unit}. Arrow keys rotate, plus and minus zoom.`}
      onKeyDown={onKey}
      className={`absolute inset-0 ${fine ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
