import { PH, PH_DATE, type Fps, type Rupees } from '../content';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹18,999 — or "₹[__]" while the price is still a placeholder. */
export function formatINR(value: Rupees): string {
  return value == null ? `₹${PH}` : `₹${inr.format(value)}`;
}

export function formatRange(min: Rupees, max: Rupees): string {
  if (min == null || max == null) return `₹${PH}–${PH}`;
  return `₹${inr.format(min)}–${inr.format(max)}`;
}

export function formatFps(value: Fps): string {
  return value == null ? PH : String(Math.round(value));
}

export function formatDate(iso: string | null): string {
  if (!iso) return PH_DATE;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return PH_DATE;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** True once the end of the given ISO day has passed (IST is fine at day precision for an offer chip). */
export function isPast(iso: string | null, now = new Date()): boolean {
  if (!iso) return false;
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return false;
  end.setHours(23, 59, 59, 999);
  return now > end;
}
