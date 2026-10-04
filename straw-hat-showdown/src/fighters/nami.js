// Nami (early series): keeps her distance and attacks with weather from her Clima-Tact.

export default {
  id: 'nami',
  name: 'Nami',
  walkSpeed: 3.2,
  jumpVx: 4,
  style: { idealDistance: 260, keepAway: true, jumpIn: 0.03 },
  moves: {
    chain1: {
      type: 'chain', startup: 4, active: 3, recovery: 10, next: 'chain2', sfx: 'swing',
      motion: [{ from: 0, to: 4, vx: 1 }],
      hits: [{ box: { x: 5, y: 40, w: 59, h: 40 }, damage: 35, hitstun: 18, push: 3 }],
    },
    chain2: {
      type: 'chain', startup: 6, active: 3, recovery: 12, next: 'chain3', sfx: 'swing',
      motion: [{ from: 0, to: 6, vx: 1.2 }],
      hits: [{ box: { x: 5, y: 40, w: 59, h: 40 }, damage: 35, hitstun: 18, push: 3 }],
    },
    chain3: {
      type: 'chain', startup: 9, active: 4, recovery: 18, sfx: 'swing',
      motion: [{ from: 0, to: 9, vx: 1.2 }],
      hits: [{ box: { x: 5, y: 30, w: 59, h: 60 }, damage: 65, hitstun: 24, push: 6, knockdown: true }],
    },
    jumpAttack: {
      type: 'jump', startup: 4, active: 12, recovery: 0, sfx: 'swing',
      hits: [{ box: { x: -5, y: -25, w: 60, h: 60 }, damage: 45, hitstun: 16, push: 3 }],
    },
    // Thunderbolt Tempo: a cloud marks where the opponent stood; lightning strikes there after a delay.
    special: {
      type: 'special', name: 'THUNDERBOLT TEMPO!', startup: 12, active: 4, recovery: 26, sfx: 'cloud',
      projectile: { kind: 'strike', delay: 50, len: 8, box: { w: 60, h: 220 },
        damage: 60, hitstun: 24, push: 3, lightning: true },
    },
    // Cyclone Tempo: a gust that pushes the opponent far back.
    forwardSpecial: {
      type: 'special', name: 'CYCLONE TEMPO!', startup: 9, active: 4, recovery: 20, sfx: 'wind',
      projectile: { kind: 'travel', speed: 7, offset: { x: 40, y: 30 }, box: { w: 50, h: 76 },
        damage: 40, hitstun: 20, push: 22 },
    },
    // Thunder Lance Tempo: a fast lightning spear across the stage.
    super: {
      type: 'super', name: 'THUNDER LANCE TEMPO!', invulnerable: true,
      startup: 16, active: 10, recovery: 30, sfx: 'lightning',
      hits: [{ box: { x: 30, y: 20, w: 900, h: 70 }, damage: 240, hitstun: 30, push: 10, knockdown: true, lightning: true }],
    },
  },
};
