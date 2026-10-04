// Sanji (early series): the fastest fighter, and every attack is a kick.

export default {
  id: 'sanji',
  name: 'Sanji',
  walkSpeed: 4.2,
  jumpVx: 4.6,
  style: { idealDistance: 100, aggression: 0.85, keepAway: false, jumpIn: 0.12 },
  moves: {
    chain1: {
      type: 'chain', startup: 4, active: 3, recovery: 9, next: 'chain2', sfx: 'kick',
      motion: [{ from: 0, to: 4, vx: 1.2 }],
      hits: [{ box: { x: 10, y: 15, w: 70, h: 40 }, damage: 35, hitstun: 17, push: 3 }],
    },
    chain2: {
      type: 'chain', startup: 5, active: 3, recovery: 11, next: 'chain3', sfx: 'kick',
      motion: [{ from: 0, to: 5, vx: 1.4 }],
      hits: [{ box: { x: 10, y: 45, w: 70, h: 40 }, damage: 35, hitstun: 17, push: 3 }],
    },
    chain3: {
      type: 'chain', startup: 8, active: 4, recovery: 16, sfx: 'kick',
      motion: [{ from: 0, to: 8, vx: 1.4 }],
      hits: [{ box: { x: 10, y: 55, w: 70, h: 55 }, damage: 65, hitstun: 24, push: 6, knockdown: true }],
    },
    jumpAttack: {
      type: 'jump', startup: 4, active: 12, recovery: 0, sfx: 'kick',
      hits: [{ box: { x: 0, y: -35, w: 80, h: 60 }, damage: 50, hitstun: 16, push: 3 }],
    },
    // Party Table Kick Course: spinning handstand kicks that hit on both sides.
    special: {
      type: 'special', name: 'PARTY TABLE KICK COURSE!', startup: 8, active: 24, recovery: 16, sfx: 'spin',
      hits: [
        { at: 8, len: 6, box: { x: -95, y: 10, w: 190, h: 60 }, damage: 30, hitstun: 18, push: 2 },
        { at: 16, len: 6, box: { x: -95, y: 10, w: 190, h: 60 }, damage: 30, hitstun: 18, push: 2 },
        { at: 24, len: 8, box: { x: -95, y: 10, w: 190, h: 60 }, damage: 40, hitstun: 22, push: 7 },
      ],
    },
    // Mouton Shot: a lunging kick that covers distance.
    forwardSpecial: {
      type: 'special', name: 'MOUTON SHOT!', startup: 9, active: 8, recovery: 18, sfx: 'kickHeavy',
      motion: [{ from: 0, to: 12, vx: 9 }],
      hits: [{ box: { x: 10, y: 30, w: 75, h: 60 }, damage: 85, hitstun: 24, push: 8, knockdown: true }],
    },
    // Diable Jambe: his leg catches fire for a flaming kick barrage.
    super: {
      type: 'super', name: 'DIABLE JAMBE!', subtitle: 'PREMIER HACHIS', invulnerable: true,
      startup: 14, active: 30, recovery: 26, sfx: 'fire',
      motion: [{ from: 14, to: 24, vx: 9 }],
      hits: [
        { at: 14, len: 5, box: { x: 5, y: 10, w: 95, h: 100 }, damage: 45, hitstun: 28, push: 1.5 },
        { at: 20, len: 5, box: { x: 5, y: 10, w: 95, h: 100 }, damage: 45, hitstun: 28, push: 1.5 },
        { at: 26, len: 5, box: { x: 5, y: 10, w: 95, h: 100 }, damage: 45, hitstun: 28, push: 1.5 },
        { at: 32, len: 5, box: { x: 5, y: 10, w: 95, h: 100 }, damage: 45, hitstun: 28, push: 1.5 },
        { at: 38, len: 6, box: { x: 5, y: 10, w: 100, h: 100 }, damage: 70, hitstun: 30, push: 10, knockdown: true },
      ],
    },
  },
};
