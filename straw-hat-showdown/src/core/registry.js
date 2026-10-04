// Fighter definitions, looked up by id. Match state stores only ids so it stays plain data.
import { normalizeFighter } from './moves.js';

const registry = new Map();

export function registerFighter(def) {
  const normalized = normalizeFighter(def);
  registry.set(def.id, normalized);
  return normalized;
}

export function getFighter(id) {
  const def = registry.get(id);
  if (!def) throw new Error(`Unknown fighter: ${id}`);
  return def;
}

export function fighterIds() {
  return [...registry.keys()];
}
