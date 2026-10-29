import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  EdgesGeometry,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PointLight,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  type Object3D,
} from 'three';
import type { BoardSize } from '../content';
import type { CaseDims, FitResult } from '../lib/caseFit';
import { boardSpec } from '../lib/caseFit';
import { at, box, makeFan, setWarning, std, textTexture } from './parts';

/**
 * Procedural PC build inside a tower case. Built in millimetres, scaled to scene units
 * (1 unit = 100 mm) by the root group.
 *
 * Axes: X front (−) → rear (+), Y floor → top, Z motherboard tray (−) → glass side (+).
 */
export const MM = 0.01;

export type PartId = 'board' | 'cpu' | 'cooler' | 'ram' | 'gpu' | 'psu';

export interface PcParams {
  dims: CaseDims;
  board: BoardSize;
  sizes: { gpuLengthMm: number; coolerHeightMm: number };
  fit: FitResult;
  glass: boolean;
  orange: Color;
  gpuLabel: string;
  psuLabel: string;
  unit: string;
}

export interface PcModel {
  /** Add to the scene; holds the mm-scaled model and the scene-unit lights. */
  container: Group;
  root: Group;
  parts: Record<PartId, Group>;
  glass: Object3D;
}

const T = 6; // panel thickness
const SHROUD = 100; // PSU shroud height
const TOP_GAP = 25; // board top edge to case top

function guideLabel(text: string) {
  const tex = textTexture([{ text, size: 120, y: 0.5, weight: 600, color: '#f5f3ef' }], { w: 512, h: 160, bg: 'rgba(20,20,22,0.85)' });
  const s = new Sprite(new SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set(96, 30, 1);
  s.renderOrder = 10;
  return s;
}

/** A measuring line from a to b with end ticks (pairs of points for LineSegments). */
function guideLine(a: Vector3, b: Vector3, tick: Vector3) {
  const pts = [a, b, a.clone().sub(tick), a.clone().add(tick), b.clone().sub(tick), b.clone().add(tick)];
  return new BufferGeometry().setFromPoints(pts);
}

/** Motherboard PCB: dark board with faint copper-trace lines and mounting holes. */
function pcbTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1e1f25';
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(160,170,190,0.13)';
  g.lineWidth = 2;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) {
    let x = rnd() * 512;
    let y = rnd() * 512;
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 0; s < 3; s++) {
      if (rnd() > 0.5) x += (rnd() - 0.5) * 220;
      else y += (rnd() - 0.5) * 220;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.fillStyle = '#8d8f96';
  for (const [x, y] of [[20, 20], [492, 20], [20, 492], [492, 492], [256, 20], [256, 492]]) {
    g.beginPath();
    g.arc(x, y, 7, 0, Math.PI * 2);
    g.fill();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function floorTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  grad.addColorStop(0, 'rgba(0,0,0,0.85)');
  grad.addColorStop(0.45, 'rgba(0,0,0,0.45)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 512);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function buildPc(p: PcParams): PcModel {
  const { h: H, w: W, d: D } = p.dims;
  const root = new Group();
  root.scale.setScalar(MM);

  const shell = new Group();
  root.add(shell);
  const panel = std('#141417', 0.35, 0.55);
  const panelDark = std('#0e0e10', 0.2, 0.7);
  const metal = std('#8d8f96', 1, 0.35);
  const darkMetal = std('#2b2c31', 0.8, 0.4);

  /* ---------------- case shell ---------------- */
  shell.add(at(box(D, T, W, panel, 2), 0, T / 2, 0)); // floor
  shell.add(at(box(D, T, W, panel, 2), 0, H - T / 2, 0)); // roof
  shell.add(at(box(D, H, T, panelDark), 0, H / 2, -W / 2 + T / 2)); // tray side
  shell.add(at(box(T, H, W, panel, 2), D / 2 - T / 2, H / 2, 0)); // rear
  shell.add(at(box(T, H, W, std('#18181c', 0.1, 0.85), 2), -D / 2 + T / 2, H / 2, 0)); // front (mesh)
  // front edge light — the "silicon heat" accent
  shell.add(at(box(3, H - 40, 3, new MeshBasicMaterial({ color: p.orange })), -D / 2 + T + 1, H / 2, W / 2 - T - 2));
  for (const [x, z] of [[-D / 2 + 40, -W / 2 + 30], [-D / 2 + 40, W / 2 - 30], [D / 2 - 40, -W / 2 + 30], [D / 2 - 40, W / 2 - 30]]) {
    const foot = new Mesh(new CylinderGeometry(14, 16, 12, 20), panelDark);
    foot.position.set(x, -6, z);
    shell.add(foot);
  }
  const edges = new LineSegments(new EdgesGeometry(new BoxGeometry(D, H, W)), new LineBasicMaterial({ color: '#3c3c44' }));
  edges.position.y = H / 2;
  shell.add(edges);

  // glass side panel + frame
  const glass = new Group();
  glass.add(
    at(
      box(D - 2 * T, H - 2 * T, 4, std('#a9bfd6', 0, 0.04, { transparent: true, opacity: 0.1, depthWrite: false, envMapIntensity: 2 })),
      0,
      H / 2,
      W / 2 - 2,
    ),
  );
  const fb = 10;
  for (const [x, y, w, h] of [
    [0, H - T - fb / 2, D - 2 * T, fb],
    [0, T + fb / 2, D - 2 * T, fb],
    [-D / 2 + T + fb / 2, H / 2, fb, H - 2 * T],
    [D / 2 - T - fb / 2, H / 2, fb, H - 2 * T],
  ]) {
    glass.add(at(box(w, h, 5, panelDark), x, y, W / 2 - 2.5));
  }
  glass.visible = p.glass;
  shell.add(glass);

  // PSU shroud: solid top, smoked glass-side face so the PSU drop-in stays visible
  shell.add(at(box(D - 2 * T, 4, W - 2 * T, panel), 0, SHROUD, 0));
  shell.add(
    at(box(D - 2 * T - 2, SHROUD - T - 2, 3, std('#1a1a1e', 0.3, 0.4, { transparent: true, opacity: 0.45, depthWrite: false })), 0, T + (SHROUD - T) / 2, W / 2 - T - 10),
  );

  /* ---------------- fans ---------------- */
  const nFront = Math.max(1, Math.min(3, Math.floor((H - SHROUD - 40) / 125)));
  for (let i = 0; i < nFront; i++) {
    const fan = makeFan(120, 25, p.orange);
    fan.rotation.y = Math.PI / 2; // glow ring faces into the case
    fan.position.set(-D / 2 + T + 14, H - TOP_GAP - 66 - i * 125, Math.min(0, W / 2 - T - 64));
    shell.add(fan);
  }

  /* ---------------- motherboard ---------------- */
  const spec = boardSpec(p.board);
  const bw = spec.w;
  const bh = spec.h;
  const rearIn = D / 2 - T;
  const bRear = rearIn - 14;
  const bTop = H - TOP_GAP;
  const bz = -W / 2 + T + 16 + 1.6; // board front surface (tray + standoffs + PCB)
  const sx = bRear - Math.min(112, bw * 0.55); // socket centre
  const sy = bTop - 82;
  const slotY = bTop - (p.board === 'itx' ? 140 : 168);

  const board = new Group();
  board.add(at(box(bw, bh, 1.6, std('#ffffff', 0.25, 0.6, { map: pcbTexture() })), bRear - bw / 2, bTop - bh / 2, bz - 0.8));
  board.add(at(box(62, 62, 5, metal), sx, sy, bz + 2.5)); // socket frame
  board.add(at(box(Math.min(84, bw - 40), 22, 22, darkMetal, 4), sx + 6, sy + 52, bz + 11)); // VRM top
  board.add(at(box(22, 76, 22, darkMetal, 4), Math.min(sx + 56, bRear - 40), sy + 4, bz + 11)); // VRM side
  board.add(at(box(30, 118, 40, std('#1b1b20', 0.5, 0.45), 6), bRear - 15, bTop - 70, bz + 20)); // I/O cover
  board.add(at(box(2, 104, 3, new MeshBasicMaterial({ color: p.orange })), bRear - 15, bTop - 70, bz + 40.5)); // accent
  board.add(at(box(89, 8, 10, std('#26262b', 0.3, 0.5)), bRear - 60, slotY, bz + 5)); // PCIe x16
  if (p.board !== 'itx') board.add(at(box(89, 8, 10, std('#26262b', 0.3, 0.5)), bRear - 60, slotY - 80, bz + 5));
  board.add(at(box(Math.min(80, bw - 60), 24, 6, darkMetal, 2), sx - 4, slotY + 36, bz + 3)); // M.2 heatsink
  if (p.board !== 'itx') board.add(at(box(46, 46, 10, darkMetal, 4), bRear - bw + 50, bTop - bh + 64, bz + 5)); // chipset
  for (let i = 0; i < (p.board === 'itx' ? 2 : 4); i++) board.add(at(box(6, 133, 8, std('#2a2a30', 0.2, 0.5)), sx - 60 - i * 9, sy - 10, bz + 4));
  board.add(at(box(12, 52, 16, std('#3a3b41', 0.2, 0.6)), bRear - bw + 9, sy - 30, bz + 8)); // 24-pin

  /* ---------------- CPU ---------------- */
  const cpu = new Group();
  cpu.add(at(box(40, 40, 1.6, std('#1f3d2d', 0.1, 0.5)), sx, sy, bz + 5.8));
  cpu.add(at(box(34, 34, 3.4, std('#cfd0d6', 1, 0.3), 1), sx, sy, bz + 8.3));

  /* ---------------- tower cooler ---------------- */
  const hc = p.sizes.coolerHeightMm;
  const cooler = new Group();
  cooler.add(at(box(40, 40, 10, std('#b87333', 1, 0.35), 2), sx, sy, bz + 15)); // copper base
  const finStart = bz + 42;
  const finEnd = bz + hc - 5;
  const finCount = Math.max(6, Math.floor((finEnd - finStart) / 2.6));
  const fins = new InstancedMesh(new BoxGeometry(52, 125, 0.6), std('#c4c7cc', 1, 0.32), finCount);
  const m4 = new Matrix4();
  for (let i = 0; i < finCount; i++) fins.setMatrixAt(i, m4.makeTranslation(sx, sy, finStart + (i * (finEnd - finStart)) / (finCount - 1)));
  cooler.add(fins);
  cooler.add(at(box(54, 127, 4, std('#18181c', 0.6, 0.4), 1.5), sx, sy, bz + hc - 2)); // top cap
  for (const dx of [-18, -6, 6, 18]) {
    const pipe = new Mesh(new CylinderGeometry(3, 3, hc - 18, 12), std('#b87333', 1, 0.3));
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(sx + dx, sy, bz + 9 + (hc - 18) / 2);
    cooler.add(pipe);
  }
  const cFan = makeFan(120, 25, null);
  cFan.rotation.y = -Math.PI / 2;
  cFan.position.set(sx - 39, sy, Math.max(bz + 66, (finStart + finEnd) / 2));
  cooler.add(cFan);

  /* ---------------- RAM ---------------- */
  const ram = new Group();
  // two sticks: slots A2/B2 on 4-slot boards, both slots on Mini-ITX
  for (const slot of p.board === 'itx' ? [0, 1] : [1, 3]) {
    const x = sx - 60 - slot * 9;
    ram.add(at(box(7, 133, 34, std('#1d1d22', 0.6, 0.4), 1), x, sy - 10, bz + 8 + 17));
    ram.add(at(box(7.4, 126, 4, new MeshBasicMaterial({ color: p.orange })), x, sy - 10, bz + 8 + 35));
  }

  /* ---------------- graphics card ---------------- */
  const L = p.sizes.gpuLengthMm;
  const gpu = new Group();
  const gx = rearIn - L / 2 - 2;
  const gTop = slotY - 4;
  const gz = bz + 6 + 60;
  gpu.add(at(box(L - 4, 3, 114, std('#3a3b41', 0.9, 0.35)), gx, gTop - 1.5, gz)); // backplate
  gpu.add(at(box(L - 6, 44, 118, std('#1a1a1f', 0.4, 0.45), 6), gx, gTop - 26, gz)); // shroud
  const nFans = L >= 250 ? 3 : 2;
  for (let i = 0; i < nFans; i++) {
    const fan = makeFan(86, 12, null);
    fan.rotation.x = Math.PI / 2; // face down
    fan.position.set(gx - L / 2 + (L / nFans) * (i + 0.5), gTop - 48, gz);
    gpu.add(fan);
  }
  const gLabel = textTexture(
    [
      { text: 'RADEON', size: 120, y: 0.4, spacing: 18 },
      { text: p.gpuLabel.replace(/^Radeon\s+/i, ''), size: 72, y: 0.72, weight: 500, spacing: 6, color: '#a3a099' },
    ],
    { w: 1024, h: 256 },
  );
  gpu.add(at(new Mesh(new PlaneGeometry(Math.min(150, L * 0.55), 37.5), new MeshBasicMaterial({ map: gLabel, transparent: true })), gx, gTop - 26, gz + 59.2));
  gpu.add(at(box(L * 0.7, 2.5, 1.2, new MeshBasicMaterial({ color: p.orange })), gx, gTop - 6, gz + 59.6)); // edge light
  gpu.add(at(box(2, 46, 112, metal), rearIn - 1, gTop - 24, gz)); // slot bracket

  /* ---------------- PSU ---------------- */
  const psu = new Group();
  psu.add(at(box(160, 86, 150, std('#151518', 0.5, 0.5), 3), rearIn - 82, T + 45, 0));
  const pLabel = textTexture([{ text: p.psuLabel, size: 110, y: 0.5, weight: 600, color: '#a3a099' }], { w: 1024, h: 256 });
  psu.add(at(new Mesh(new PlaneGeometry(120, 30), new MeshBasicMaterial({ map: pLabel, transparent: true })), rearIn - 82, T + 45, 75.4));

  /* ---------------- rear fan ---------------- */
  const rfs = W < 200 ? 92 : 120;
  const rf = makeFan(rfs, 25, p.orange);
  rf.rotation.y = -Math.PI / 2;
  rf.position.set(rearIn - 14, bTop - 70, Math.min(bz + 46 + rfs / 2, W / 2 - T - rfs / 2 - 4));
  shell.add(rf);

  /* ---------------- interior glow + floor ---------------- */
  // Lights live in scene units (outside the mm-scaled root) so intensity/decay behave.
  const glow = new PointLight(p.orange, 1.6, 0, 2);
  glow.position.set((-D / 2 + 70) * MM, H * 0.55 * MM, 0);
  const lights = new Group();
  lights.add(glow);
  const floor = new Mesh(new CircleGeometry(Math.max(D, W) * 0.95, 48), new MeshBasicMaterial({ map: floorTexture(), transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -11;
  root.add(floor);

  /* ---------------- dimension guides ---------------- */
  const guides = new Group();
  const off = 34;
  const lines: [Vector3, Vector3, Vector3, string][] = [
    // on the rear/glass corner, nearest the default camera
    [new Vector3(D / 2 + off, 0, W / 2 + off), new Vector3(D / 2 + off, H, W / 2 + off), new Vector3(8, 0, 0), `${H} ${p.unit}`],
    [new Vector3(-D / 2, -12, W / 2 + off), new Vector3(D / 2, -12, W / 2 + off), new Vector3(0, 8, 0), `${D} ${p.unit}`],
    [new Vector3(D / 2 + off, -12, -W / 2), new Vector3(D / 2 + off, -12, W / 2), new Vector3(0, 8, 0), `${W} ${p.unit}`],
  ];
  const guideMat = new LineBasicMaterial({ color: '#a3a099', transparent: true, opacity: 0.8 });
  for (const [a, b, tick, text] of lines) {
    guides.add(new LineSegments(guideLine(a, b, tick), guideMat));
    const label = guideLabel(text);
    label.position.copy(a).add(b).multiplyScalar(0.5);
    guides.add(label);
  }
  root.add(guides);

  const parts: Record<PartId, Group> = { board, cpu, cooler, ram, gpu, psu };
  for (const g of Object.values(parts)) root.add(g);

  for (const line of p.fit.lines) setWarning(parts[line.part], !line.ok);

  const container = new Group();
  container.add(root, lights);
  return { container, root, parts, glass };
}
