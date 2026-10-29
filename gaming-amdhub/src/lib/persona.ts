import { useSyncExternalStore } from 'react';
import { personaOrder, type PersonaId } from '../content';
import { readStore, writeStore } from './storage';

const KEY = 'amdhub.persona';
const listeners = new Set<() => void>();

function isPersona(v: unknown): v is PersonaId {
  return typeof v === 'string' && (personaOrder as string[]).includes(v);
}

let current: PersonaId | null = (() => {
  const v = typeof window === 'undefined' ? null : readStore<string>(KEY);
  return isPersona(v) ? v : null;
})();

export function getPersona(): PersonaId | null {
  return current;
}

export function savePersona(id: PersonaId) {
  current = id;
  writeStore(KEY, id);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function usePersona(): PersonaId | null {
  return useSyncExternalStore(subscribe, getPersona, () => null);
}

/** Two yes/no questions put a visitor in exactly one persona. */
export function personaFromAnswers(ownsGamingPc: boolean, forWork: boolean): PersonaId {
  if (ownsGamingPc) return 'upgrade';
  return forWork ? 'work-play' : 'new-build';
}
