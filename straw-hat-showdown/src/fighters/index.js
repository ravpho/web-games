// Registers the playable fighters. ROSTER is the order shown on character select.
import { registerFighter } from '../core/registry.js';
import luffy from './luffy.js';

export const ROSTER = [luffy].map((def) => registerFighter(def).id);
