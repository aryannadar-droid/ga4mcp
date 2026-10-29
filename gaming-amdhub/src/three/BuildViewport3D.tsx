import { useEffect, useRef, type KeyboardEvent, type MutableRefObject } from 'react';
import { DirectionalLight, HemisphereLight, Vector3 } from 'three';
import { buildTeaser, caseFit, type BoardSize } from '../content';
import type { CaseDims, FitResult } from '../lib/caseFit';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { brandColors } from './parts';
import { buildPc, MM, type PartId, type PcModel } from './pcModel';
import { createStage, disposeTree, tween, type Stage } from './stage';

export interface ViewerApi {
  zoom: (factor: number) => void;
  reset: () => void;
}

interface Props {
  dims: CaseDims;
  board: BoardSize;
  fit: FitResult;
  /** How many parts (in buildTeaser.parts order) are placed. */
  shown: number;
  glass: boolean;
  /** Touch screens: rotation only after the visitor opts in, so the page still scrolls. */
  interactive: boolean;
  apiRef: MutableRefObject<ViewerApi | null>;
  onReady: () => void;
}

// rear-left, slightly above: front fans' glow and the card's label face the camera
const VIEW_DIR = new Vector3(0.42, 0.26, 1).normalize();
const order = buildTeaser.parts.map((p) => p.id as PartId);

/** Case framing: distance that fits the whole case (+ guides) in view. */
function frameDistance(d: CaseDims, fovDeg: number, aspect: number) {
  const r = 0.5 * Math.hypot(d.h, d.w, d.d) * MM * 1.0;
  const vFov = (fovDeg * Math.PI) / 180;
  const fitV = r / Math.sin(vFov / 2);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const fitH = r / Math.sin(hFov / 2);
  return Math.max(fitV, fitH);
}

export default function BuildViewport3D({ dims, board, fit, shown, glass, interactive, apiRef, onReady }: Props) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const modelRef = useRef<PcModel | null>(null);
  const shownRef = useRef(0); // parts already placed in the scene
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

  /* (re)build the PC whenever the case or board changes — coalesced to one rebuild per frame */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const raf = requestAnimationFrame(() => {
      const { orange } = brandColors();
      const gpu = buildTeaser.parts.find((p) => p.id === 'gpu')?.label ?? '';
      const psu = buildTeaser.parts.find((p) => p.id === 'psu')?.label ?? '';
      const model = buildPc({ dims, board, sizes: caseFit.partSizes, fit, glass, orange, gpuLabel: gpu, psuLabel: psu, unit: caseFit.unit });
      order.forEach((id, i) => (model.parts[id].visible = i < shownRef.current));
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
      const dir = distRef.current ? camera.position.clone().sub(controls.target).normalize() : VIEW_DIR.clone();
      const ratio = distRef.current ? camera.position.distanceTo(controls.target) / distRef.current : 1;
      distRef.current = dist;
      controls.target.copy(target);
      controls.minDistance = dist * 0.4;
      controls.maxDistance = dist * 1.6;
      camera.position.copy(target).add(dir.multiplyScalar(dist * ratio));
      camera.lookAt(target);
      stage.invalidate();
    });
    return () => cancelAnimationFrame(raf);
  }, [dims, board, fit, glass, reduced]);

  /* snap newly added parts in: drop from above and out through the glass */
  useEffect(() => {
    const stage = stageRef.current;
    const model = modelRef.current;
    const from = shownRef.current;
    shownRef.current = shown;
    if (!stage || !model) return;
    for (let i = from; i < shown && i < order.length; i++) {
      const g = model.parts[order[i]];
      g.visible = true;
      tween(stage, 520, (p) => g.position.set(0, (1 - p) * 140, (1 - p) * 260), reduced);
    }
  }, [shown, reduced]);

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
      s.camera.position.copy(s.controls.target).add(VIEW_DIR.clone().multiplyScalar(distRef.current));
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
      aria-label={`${caseFit.viewerLabel}. ${dims.h} × ${dims.w} × ${dims.d} ${caseFit.unit}. Arrow keys rotate, plus and minus zoom.`}
      onKeyDown={onKey}
      className={`absolute inset-0 ${fine ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
