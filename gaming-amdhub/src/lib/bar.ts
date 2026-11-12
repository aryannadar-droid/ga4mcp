import { useEffect } from 'react';
import { createStore } from './store';

export interface BarSection {
  id: string;
  label: string;
}

/** True once the hero (or a persona page's header) has scrolled away. */
export const barActive = createStore(false);
/** Sections listed in the pinned bar's dropdown for the current page. */
export const barSections = createStore<BarSection[]>([]);

/** Pages register their sections; pass a stable (module-level or memoised) array. */
export function useBarSections(list: BarSection[]) {
  useEffect(() => {
    barSections.set(list);
    return () => barSections.set([]);
  }, [list]);
}

/** When set (the configurator), the bar's "Where to buy" runs this instead of linking to the sellers. */
export const barBuy = createStore<(() => void) | null>(null);

/** Place right after the hero / page header: the bar appears once this passes the top. */
export const BAR_SENTINEL_ID = 'bar-sentinel';
