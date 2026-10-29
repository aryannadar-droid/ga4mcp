import {
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  TorusGeometry,
  type Material,
  type Object3D,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** Brand tokens read from CSS so the 3D scene follows tokens.css. */
export function brandColors() {
  const css = getComputedStyle(document.documentElement);
  const read = (v: string, fallback: string) => css.getPropertyValue(v).trim() || fallback;
  return {
    orange: new Color(read('--orange', '#ff6a13')),
    gold: new Color(read('--gold', '#d4a64a')),
    black: new Color(read('--black', '#0a0a0b')),
  };
}

export const std = (color: string | Color, metalness = 0, roughness = 0.6, extra: Partial<MeshStandardMaterial> = {}) =>
  new MeshStandardMaterial({ color, metalness, roughness, ...extra });

export function box(w: number, h: number, d: number, mat: Material, radius = 0) {
  const geo = radius > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2, h / 2, d / 2)) : new BoxGeometry(w, h, d);
  return new Mesh(geo, mat);
}

export function at<T extends Object3D>(o: T, x: number, y: number, z: number): T {
  o.position.set(x, y, z);
  return o;
}

interface TextLine {
  text: string;
  size: number; // px, on a 1024 canvas
  y: number; // 0..1
  weight?: number;
  spacing?: number; // px letter spacing
  color?: string;
}

/** Text drawn into a texture (engravings, labels). Transparent background unless `bg` is set. */
export function textTexture(lines: TextLine[], opts: { w?: number; h?: number; bg?: string; align?: CanvasTextAlign; x?: number } = {}) {
  const { w = 1024, h = 1024, bg, align = 'center', x = 0.5 } = opts;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  if (bg) {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
  }
  g.textAlign = align;
  g.textBaseline = 'middle';
  for (const l of lines) {
    g.font = `${l.weight ?? 700} ${l.size}px "Space Grotesk", ui-sans-serif, system-ui, sans-serif`;
    g.fillStyle = l.color ?? '#fff';
    if ('letterSpacing' in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${l.spacing ?? 0}px`;
    g.fillText(l.text, w * x, h * l.y);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** 120/140mm-style fan facing local +Z. `size` in scene units. Optional orange RGB ring. */
export function makeFan(size: number, depth: number, glow: Color | null) {
  const g = new Group();
  const frameMat = std('#17171b', 0.2, 0.55);
  const bladeMat = std('#222228', 0.1, 0.45);
  const bar = size * 0.08;
  for (const [x, y, w, h] of [
    [0, (size - bar) / 2, size, bar],
    [0, -(size - bar) / 2, size, bar],
    [(size - bar) / 2, 0, bar, size],
    [-(size - bar) / 2, 0, bar, size],
  ]) {
    g.add(at(box(w, h, depth, frameMat, bar * 0.3), x, y, 0));
  }
  const hub = new Mesh(new CylinderGeometry(size * 0.17, size * 0.17, depth * 0.7, 28), frameMat);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  const blades = 7;
  for (let i = 0; i < blades; i++) {
    const pivot = new Group();
    const blade = box(size * 0.3, size * 0.14, depth * 0.08, bladeMat);
    blade.position.x = size * 0.3;
    blade.rotation.x = 0.55; // pitch
    pivot.add(blade);
    pivot.rotation.z = (i / blades) * Math.PI * 2;
    g.add(pivot);
  }
  if (glow) {
    const ring = new Mesh(new TorusGeometry(size * 0.44, size * 0.012, 8, 64), new MeshBasicMaterial({ color: glow }));
    ring.position.z = depth * 0.52;
    g.add(ring);
  }
  return g;
}

/** Tint every mesh under `root` red (part doesn't fit) or restore it. Materials are cloned once. */
export function setWarning(root: Object3D, on: boolean) {
  root.traverse((o) => {
    const mesh = o as Mesh;
    const m = mesh.material as MeshStandardMaterial | undefined;
    if (!m || !('emissive' in m)) return;
    if (!mesh.userData.warnCloned) {
      mesh.material = m.clone();
      mesh.userData.warnCloned = true;
    }
    const mat = mesh.material as MeshStandardMaterial;
    mat.emissive.set(on ? '#ff2b2b' : '#000000');
    mat.emissiveIntensity = on ? 0.55 : 0;
  });
}
