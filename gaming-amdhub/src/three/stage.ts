import {
  ACESFilmicToneMapping,
  Clock,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Spherical,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export { webglAvailable } from '../lib/webgl';

/** Per-frame tween. Return true while it still needs frames. */
export type Tick = (dt: number) => boolean;

export interface Stage {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  controls: OrbitControls;
  /** Request a frame (render-on-demand). */
  invalidate: () => void;
  addTick: (t: Tick) => void;
  /** Rotate around the target by angles in radians (keyboard + buttons). */
  orbitBy: (dTheta: number, dPhi: number) => void;
  /** Multiply camera distance (0.85 = zoom in), clamped to the controls' limits. */
  zoomBy: (factor: number) => void;
  dispose: () => void;
}

/**
 * Renderer + camera + orbit controls + studio environment.
 * Renders only when something changed (controls, ticks, resize, invalidate) and stops
 * entirely while the canvas is off-screen or the tab is hidden.
 */
export function createStage(canvas: HTMLCanvasElement, opts: { reduced: boolean; fov?: number }): Stage {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  const camera = new PerspectiveCamera(opts.fov ?? 35, 1, 0.05, 200);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = !opts.reduced;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.8;

  const ticks = new Set<Tick>();
  const clock = new Clock();
  let raf = 0;
  let dirty = true;
  let visible = true;
  let disposed = false;

  const frame = () => {
    raf = 0;
    if (disposed || !visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    let more = controls.update(); // true while damping is settling
    for (const t of ticks) if (!t(dt)) ticks.delete(t);
    if (ticks.size) more = true;
    renderer.render(scene, camera);
    dirty = false;
    if (more) schedule();
  };
  const schedule = () => {
    if (!raf && !disposed && visible) {
      clock.getDelta();
      raf = requestAnimationFrame(frame);
    }
  };
  const invalidate = () => {
    dirty = true;
    schedule();
  };
  controls.addEventListener('change', invalidate);
  controls.addEventListener('start', invalidate);

  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;
    const { clientWidth: w, clientHeight: h } = parent;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    invalidate();
  };
  const ro = new ResizeObserver(resize);
  if (canvas.parentElement) ro.observe(canvas.parentElement);
  resize();

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting && document.visibilityState === 'visible';
    if (visible && (dirty || ticks.size)) schedule();
  });
  io.observe(canvas);
  const onVis = () => {
    visible = document.visibilityState === 'visible';
    if (visible) invalidate();
  };
  document.addEventListener('visibilitychange', onVis);

  const sph = new Spherical();
  const offset = new Vector3();
  const orbitBy = (dTheta: number, dPhi: number) => {
    offset.copy(camera.position).sub(controls.target);
    sph.setFromVector3(offset);
    sph.theta += dTheta;
    sph.phi = Math.min(controls.maxPolarAngle, Math.max(controls.minPolarAngle, sph.phi + dPhi));
    sph.makeSafe();
    camera.position.copy(controls.target).add(offset.setFromSpherical(sph));
    camera.lookAt(controls.target);
    invalidate();
  };
  const zoomBy = (factor: number) => {
    offset.copy(camera.position).sub(controls.target);
    const len = Math.min(controls.maxDistance, Math.max(controls.minDistance, offset.length() * factor));
    camera.position.copy(controls.target).add(offset.setLength(len));
    invalidate();
  };

  return {
    renderer,
    scene,
    camera,
    controls,
    invalidate,
    addTick: (t) => {
      ticks.add(t);
      schedule();
    },
    orbitBy,
    zoomBy,
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      controls.dispose();
      envTarget.dispose();
      disposeTree(scene);
      renderer.dispose();
    },
  };
}

/** Free GPU memory for everything under `root`. */
export function disposeTree(root: { traverse: (fn: (o: any) => void) => void }) {
  root.traverse((o) => {
    o.geometry?.dispose?.();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      for (const v of Object.values(m)) (v as { isTexture?: boolean; dispose?: () => void })?.isTexture && (v as { dispose: () => void }).dispose();
      m.dispose();
    }
  });
}

/** Ease-out matching the site curve closely enough for 3D tweens. */
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Tween a 0→1 progress over `ms`, calling `apply`. Resolves instantly when reduced. */
export function tween(stage: Stage, ms: number, apply: (p: number) => void, reduced: boolean) {
  if (reduced || ms <= 0) {
    apply(1);
    stage.invalidate();
    return;
  }
  let t = 0;
  stage.addTick((dt) => {
    t += (dt * 1000) / ms;
    apply(easeOutExpo(Math.min(1, t)));
    return t < 1;
  });
}
