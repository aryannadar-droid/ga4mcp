import { builds, caseFit, catalog, configurator as C, type BoardSize, type BuildId, type Rupees } from '../content';
import type { PartId } from '../three/pcModel';
import type { CaseDims } from './caseFit';
import { navigate } from './router';
import { createStore } from './store';

export type ExtraId = 'board' | 'ram' | 'cooler' | 'psu';

export interface BuildConfig {
  /** A preset id from caseFit.presets, or "custom" for the visitor's own case. */
  caseId: string;
  dims: CaseDims;
  board: BoardSize;
  cpu: string;
  gpu: string;
  extras: Record<ExtraId, boolean>;
}

const recommended = caseFit.presets.find((p) => p.id === caseFit.recommendedId)!;

export function configFromBuild(id: BuildId | null): BuildConfig {
  const b = id ? builds[id] : builds.a2;
  return {
    caseId: recommended.id,
    dims: { h: recommended.h, w: recommended.w, d: recommended.d },
    board: caseFit.defaultBoard,
    cpu: b.cpu ?? 'r5-7500f',
    gpu: b.gpu ?? 'none',
    extras: { board: true, ram: true, cooler: true, psu: true },
  };
}

/** Built-in graphics only count for gaming on the chips listed in configurator.gamingIgpu. */
export function gpuAllowed(cpu: string, gpu: string) {
  return gpu !== 'none' || C.gamingIgpu.includes(cpu);
}

/** Which 3D parts sit in the case. */
export function presentParts(c: BuildConfig): Record<PartId, boolean> {
  return { board: c.extras.board, cpu: !!c.cpu, cooler: c.extras.cooler, ram: c.extras.ram, gpu: c.gpu !== 'none', psu: c.extras.psu };
}

export function selectedOptions(c: BuildConfig) {
  const cpu = C.cpus.find((o) => o.id === c.cpu)!;
  const gpu = C.gpus.find((o) => o.id === c.gpu)!;
  const extras = C.extras.filter((e) => c.extras[e.id as ExtraId]);
  return { cpu, gpu: c.gpu === 'none' ? null : gpu, extras };
}

/** Live total; `null` (→ "₹[__]") until every chosen part has a real price. */
export function buildTotal(c: BuildConfig): Rupees {
  const { cpu, gpu, extras } = selectedOptions(c);
  const prices = [cpu.price, gpu?.price, ...extras.map((e) => e.price)].filter((p) => p !== undefined) as Rupees[];
  return prices.some((p) => p == null) ? null : (prices as number[]).reduce((a, b) => a + b, 0);
}

export function partCount(c: BuildConfig) {
  const { gpu, extras } = selectedOptions(c);
  return 1 + (gpu ? 1 : 0) + extras.length;
}

export const gpuLabel = (c: BuildConfig) => (c.gpu === 'none' ? 'Built-in graphics' : catalog[c.gpu as keyof typeof catalog]?.name ?? '');
export const psuLabel = () => C.extras.find((e) => e.id === 'psu')!.label;

/* ---------- share links: ?cpu=…&gpu=…&case=…&b=…&x=… ---------- */

export function encodeConfig(c: BuildConfig) {
  const q = new URLSearchParams({ cpu: c.cpu, gpu: c.gpu, case: c.caseId, b: c.board });
  if (c.caseId === 'custom') q.set('dims', `${c.dims.h}x${c.dims.w}x${c.dims.d}`);
  q.set('x', (['board', 'ram', 'cooler', 'psu'] as ExtraId[]).map((k) => (c.extras[k] ? 1 : 0)).join(''));
  return q.toString();
}

export function decodeConfig(search: string): BuildConfig | null {
  const q = new URLSearchParams(search);
  if (!q.get('cpu')) return null;
  const base = configFromBuild(null);
  const cpu = C.cpus.some((o) => o.id === q.get('cpu')) ? q.get('cpu')! : base.cpu;
  const gpuRaw = C.gpus.some((o) => o.id === q.get('gpu')) ? q.get('gpu')! : base.gpu;
  const preset = caseFit.presets.find((p) => p.id === q.get('case'));
  const dims = q.get('dims')?.split('x').map(Number);
  const x = (q.get('x') ?? '1111').padEnd(4, '1');
  return {
    caseId: preset ? preset.id : dims?.length === 3 ? 'custom' : base.caseId,
    dims: preset ? { h: preset.h, w: preset.w, d: preset.d } : dims?.length === 3 && dims.every(Number.isFinite) ? { h: dims[0], w: dims[1], d: dims[2] } : base.dims,
    board: caseFit.boards.some((b) => b.id === q.get('b')) ? (q.get('b') as BoardSize) : base.board,
    cpu,
    gpu: gpuAllowed(cpu, gpuRaw) ? gpuRaw : 'rx-9060xt-8',
    extras: { board: true, ram: true, cooler: x[2] === '1', psu: true },
  };
}

/** Build a persona page or homepage row wants the configurator to open with. */
export const builderPreset = createStore<{ build?: BuildId; step?: string } | null>(null);

export function openBuilder(opts: { build?: BuildId; step?: string } = {}) {
  builderPreset.set(opts);
  navigate(C.route + (opts.step ? `#${opts.step}` : ''));
}
