// Monkey D. Luffy (early series): rubber all-rounder with the longest reach.
// Boxes are relative to the feet: x forward, y up. See src/core/moves.js.

export default {
  id: 'luffy',
  name: 'Luffy',
  walkSpeed: 3.6,
  jumpVx: 4,
  rubber: true, // lightning barely hurts him
  style: { idealDistance: 95, keepAway: false, jumpIn: 0.08 },
  moves: {
    chain1: {
      type: 'chain', startup: 5, active: 3, recovery: 10, next: 'chain2', sfx: 'swing',
      motion: [{ from: 0, to: 5, vx: 1 }],
      hits: [{ box: { x: 10, y: 50, w: 60, h: 30 }, damage: 43, hitstun: 18, push: 3 }],
    },
    chain2: {
      type: 'chain', startup: 6, active: 3, recovery: 12, next: 'chain3', sfx: 'swing',
      motion: [{ from: 0, to: 6, vx: 1.2 }],
      hits: [{ box: { x: 10, y: 50, w: 62, h: 30 }, damage: 43, hitstun: 18, push: 3 }],
    },
    chain3: {
      type: 'chain', startup: 9, active: 4, recovery: 18, sfx: 'stretch',
      motion: [{ from: 0, to: 9, vx: 1.2 }],
      hits: [{ box: { x: 10, y: 30, w: 66, h: 60 }, damage: 74, hitstun: 24, push: 6, knockdown: true }],
    },
    jumpAttack: {
      type: 'jump', startup: 4, active: 12, recovery: 0, sfx: 'swing',
      hits: [{ box: { x: -5, y: -25, w: 65, h: 65 }, damage: 50, hitstun: 16, push: 3 }],
    },
    // Gum-Gum Pistol: a stretching punch that reaches farther than any chain, with long recovery.
    special: {
      type: 'special', name: 'GUM-GUM PISTOL!', startup: 14, active: 8, recovery: 26, sfx: 'stretch',
      stretch: { reach: 300 },
      hits: [{ box: { x: 20, y: 56, w: 280, h: 24 }, damage: 70, hitstun: 22, push: 7 }],
    },
    // Gum-Gum Gatling: a forward-moving flurry of several hits.
    forwardSpecial: {
      type: 'special', name: 'GUM-GUM GATLING!', startup: 8, active: 30, recovery: 16, sfx: 'gatling',
      motion: [{ from: 0, to: 38, vx: 2.5 }],
      hits: [
        { at: 8, len: 4, box: { x: 10, y: 35, w: 85, h: 55 }, damage: 22, hitstun: 16, push: 1.5 },
        { at: 14, len: 4, box: { x: 10, y: 35, w: 85, h: 55 }, damage: 22, hitstun: 16, push: 1.5 },
        { at: 20, len: 4, box: { x: 10, y: 35, w: 85, h: 55 }, damage: 22, hitstun: 16, push: 1.5 },
        { at: 26, len: 4, box: { x: 10, y: 35, w: 85, h: 55 }, damage: 22, hitstun: 16, push: 1.5 },
        { at: 32, len: 6, box: { x: 10, y: 35, w: 90, h: 55 }, damage: 26, hitstun: 22, push: 7 },
      ],
    },
    // Gear Third: a giant inflated fist.
    super: {
      type: 'super', name: 'GUM-GUM GIANT PISTOL!', subtitle: 'GEAR THIRD', invulnerable: true,
      startup: 18, active: 8, recovery: 34, sfx: 'giant',
      stretch: { reach: 360 },
      hits: [{ box: { x: 20, y: 0, w: 340, h: 150 }, damage: 260, hitstun: 30, push: 10, knockdown: true }],
    },
  },
};
