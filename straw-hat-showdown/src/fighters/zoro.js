// Roronoa Zoro (early series): slow, heavy three-sword-style slashes.

export default {
  id: 'zoro',
  name: 'Zoro',
  walkSpeed: 3.0,
  jumpVx: 3.6,
  style: { idealDistance: 110, keepAway: false, jumpIn: 0.05 },
  moves: {
    chain1: {
      type: 'chain', startup: 8, active: 3, recovery: 11, next: 'chain2', sfx: 'slash',
      motion: [{ from: 0, to: 8, vx: 1 }],
      hits: [{ box: { x: 10, y: 40, w: 75, h: 50 }, damage: 52, hitstun: 19, push: 3 }],
    },
    chain2: {
      type: 'chain', startup: 9, active: 3, recovery: 13, next: 'chain3', sfx: 'slash',
      motion: [{ from: 0, to: 9, vx: 1.2 }],
      hits: [{ box: { x: 10, y: 30, w: 75, h: 60 }, damage: 58, hitstun: 20, push: 3 }],
    },
    chain3: {
      type: 'chain', startup: 12, active: 4, recovery: 20, sfx: 'slash',
      motion: [{ from: 0, to: 12, vx: 1.2 }],
      hits: [{ box: { x: 5, y: 20, w: 80, h: 80 }, damage: 92, hitstun: 26, push: 6, knockdown: true }],
    },
    jumpAttack: {
      type: 'jump', startup: 5, active: 12, recovery: 0, sfx: 'slash',
      hits: [{ box: { x: -5, y: -30, w: 75, h: 70 }, damage: 55, hitstun: 17, push: 3 }],
    },
    // 36 Pound Phoenix: a flying slash.
    special: {
      type: 'special', name: '36 POUND PHOENIX!', startup: 14, active: 4, recovery: 24, sfx: 'slashWave',
      projectile: { kind: 'travel', speed: 9, offset: { x: 50, y: 40 }, box: { w: 40, h: 64 },
        damage: 70, hitstun: 22, push: 6 },
    },
    // Oni Giri: a fast dash that slashes through to the opponent's far side.
    forwardSpecial: {
      type: 'special', name: 'ONI GIRI!', startup: 6, active: 12, recovery: 26, sfx: 'dash',
      motion: [{ from: 4, to: 18, vx: 14 }],
      passThrough: true,
      crossUp: true,
      hits: [{ box: { x: -10, y: 20, w: 70, h: 80 }, damage: 82, hitstun: 24, push: 6, knockdown: true }],
    },
    // Asura: a nine-sword illusion with several heavy slashes.
    super: {
      type: 'super', name: 'ASURA!', subtitle: 'NINE SWORD STYLE', invulnerable: true,
      startup: 16, active: 30, recovery: 30, sfx: 'asura',
      motion: [{ from: 16, to: 30, vx: 8 }],
      hits: [
        { at: 16, len: 5, box: { x: 0, y: 10, w: 110, h: 100 }, damage: 60, hitstun: 30, push: 1.5 },
        { at: 22, len: 5, box: { x: 0, y: 10, w: 110, h: 100 }, damage: 60, hitstun: 30, push: 1.5 },
        { at: 28, len: 5, box: { x: 0, y: 10, w: 110, h: 100 }, damage: 60, hitstun: 30, push: 1.5 },
        { at: 34, len: 8, box: { x: 0, y: 10, w: 120, h: 100 }, damage: 100, hitstun: 30, push: 10, knockdown: true },
      ],
    },
  },
};
