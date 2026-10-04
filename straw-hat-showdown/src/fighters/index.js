// Registers the playable fighters. ROSTER is the order shown on character select.
import { registerFighter } from '../core/registry.js';
import luffy from './luffy.js';
import zoro from './zoro.js';
import sanji from './sanji.js';
import nami from './nami.js';

export const ROSTER = [luffy, zoro, sanji, nami].map((def) => registerFighter(def).id);
