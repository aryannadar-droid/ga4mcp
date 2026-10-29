import {
  CanvasTexture,
  CircleGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  PlaneGeometry,
  SRGBColorSpace,
  Shape,
  BoxGeometry,
} from 'three';
import { box, std, textTexture } from './parts';

/** 1 unit = 10 mm. AM5-style package: 40 × 40 mm substrate, notched heat spreader. */
const SUB = 4;
const SUB_T = 0.12;
const IHS_HALF = 1.62;
const IHS_T = 0.2;

function ihsShape() {
  const h = IHS_HALF;
  const nd = 0.3; // notch depth
  const n1 = 0.38; // notch inner edge (from centre)
  const n2 = 1.12; // notch outer edge
  const s = new Shape();
  s.moveTo(-h, -h);
  s.lineTo(h, -h);
  for (const [a, b] of [[-n2, -n1], [n1, n2]]) {
    s.lineTo(h, a);
    s.lineTo(h - nd, a);
    s.lineTo(h - nd, b);
    s.lineTo(h, b);
  }
  s.lineTo(h, h);
  s.lineTo(-h, h);
  for (const [a, b] of [[n2, n1], [-n1, -n2]]) {
    s.lineTo(-h, a);
    s.lineTo(-h + nd, a);
    s.lineTo(-h + nd, b);
    s.lineTo(-h, b);
  }
  s.lineTo(-h, -h);
  return s;
}

/** Gold LGA pads on the underside, drawn once into a texture. */
function padsTexture(gold: string) {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1b3527';
  g.fillRect(0, 0, size, size);
  const n = 42;
  const step = size / (n + 2);
  g.fillStyle = gold;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const ci = Math.abs(i - n / 2 + 0.5);
      const cj = Math.abs(j - n / 2 + 0.5);
      if (ci < 7 && cj < 7) continue; // pad-free centre
      g.beginPath();
      g.arc(step * (i + 1.5), step * (j + 1.5), step * 0.3, 0, Math.PI * 2);
      g.fill();
    }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function buildChip(engraving: { brand: string; line: string; model: string }, gold: string) {
  const chip = new Group();

  // substrate
  const substrate = box(SUB, SUB_T, SUB, std('#1f3d2d', 0.1, 0.5), 0.04);
  chip.add(substrate);

  // underside contacts
  const bottom = new Mesh(new PlaneGeometry(SUB * 0.97, SUB * 0.97), std('#ffffff', 0.55, 0.38, { map: padsTexture(gold) }));
  bottom.rotation.x = Math.PI / 2;
  bottom.position.y = -SUB_T / 2 - 0.002;
  chip.add(bottom);

  // pin-1 marker
  const tri = new Mesh(new CircleGeometry(0.16, 3), std(gold, 0.9, 0.3));
  tri.rotation.x = -Math.PI / 2;
  tri.rotation.z = Math.PI / 4;
  tri.position.set(-SUB / 2 + 0.22, SUB_T / 2 + 0.002, SUB / 2 - 0.22);
  chip.add(tri);

  // capacitors in the notches
  const capGeo = new BoxGeometry(0.1, 0.06, 0.05);
  const caps = new InstancedMesh(capGeo, std('#6d5b47', 0.3, 0.5), 32);
  const m = new Matrix4();
  let k = 0;
  for (const side of [-1, 1])
    for (const zc of [-0.75, 0.75])
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 4; c++) {
          m.makeTranslation(side * (IHS_HALF - 0.1 - r * 0.13), SUB_T / 2 + 0.03, zc - 0.27 + c * 0.18);
          caps.setMatrixAt(k++, m);
        }
  chip.add(caps);

  // heat spreader
  const ihsGeo = new ExtrudeGeometry(ihsShape(), { depth: IHS_T, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 });
  ihsGeo.rotateX(-Math.PI / 2);
  const ihs = new Mesh(ihsGeo, std('#cfd0d6', 1, 0.3));
  ihs.position.y = SUB_T / 2 + 0.03;
  chip.add(ihs);

  // engraving
  const engr = textTexture(
    [
      { text: engraving.brand, size: 120, y: 0.3, spacing: 10, color: '#3a3a40' },
      { text: engraving.line, size: 170, y: 0.48, spacing: 22, color: '#3a3a40' },
      { text: engraving.model, size: 90, y: 0.64, weight: 600, spacing: 8, color: '#4a4a52' },
      { text: 'DIFFUSED IN [__] · MADE IN [__]', size: 38, y: 0.78, weight: 500, spacing: 4, color: '#55555c' },
    ],
    { w: 1024, h: 1024 },
  );
  const label = new Mesh(new PlaneGeometry(2.7, 2.7), std('#ffffff', 0.6, 0.55, { map: engr, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }));
  label.rotation.x = -Math.PI / 2;
  label.position.y = SUB_T / 2 + 0.03 + IHS_T + 0.031;
  chip.add(label);

  return chip;
}

export const chipSize = { width: SUB, height: SUB_T + IHS_T + 0.06 };
