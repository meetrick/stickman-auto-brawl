import { seededRandom, range } from './random.js';

export const WALL_TYPES = ['stone', 'spring', 'crate'];
const overlaps = (a, b, gap = 0) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap && Math.abs(a.y - b.y) < (a.d + b.d) / 2 + gap;

export class Arena {
  constructor(seed, bounds, fighters) {
    // Map rolls have their own RNG stream, independent of fighter/combat rolls.
    const rng = seededRandom(seed ^ 0xA7E4C921);
    this.walls = []; this.traps = [];
    const wallCount = 3 + Math.floor(rng() * 4), trapCount = 2 + Math.floor(rng() * 4);
    this.mineCount = 1 + Math.floor(rng() * 3);
    this.name = ['BROKEN COURT', 'SPRING YARD', 'SPLIT RING', 'RUIN GARDEN'][Math.floor(rng() * 4)];
    for (let attempt = 0; this.walls.length < wallCount && attempt < 250; attempt++) {
      const vertical = rng() < .4;
      const wall = { id: this.walls.length, x: range(rng, bounds.left + 100, bounds.right - 100), y: range(rng, bounds.top + 65, bounds.bottom - 65),
        w: vertical ? range(rng, 26, 38) : range(rng, 65, 115), d: vertical ? range(rng, 52, 80) : range(rng, 22, 34),
        height: range(rng, 42, 78), type: WALL_TYPES[Math.floor(rng() * WALL_TYPES.length)], destroyed: false };
      if (this.walls.some(w => overlaps(w, wall, 55))) continue;
      if (fighters.some(f => overlaps(wall, { ...f, w: 30, d: 28 }, 40))) continue;
      this.walls.push(wall);
    }
    for (let attempt = 0; this.traps.length < trapCount && attempt < 250; attempt++) {
      const trap = { id: this.traps.length, x: range(rng, bounds.left + 35, bounds.right - 35), y: range(rng, bounds.top + 30, bounds.bottom - 30),
        radius: 21, phase: range(rng, 0, 5), period: range(rng, 3.2, 5.2), cooldowns: new Map() };
      if (this.isBlocked(trap.x, trap.y, 35) || this.traps.some(t => Math.hypot(t.x - trap.x, t.y - trap.y) < 70)
        || fighters.some(f => Math.hypot(f.x - trap.x, f.y - trap.y) < 50)) continue;
      this.traps.push(trap);
    }
  }
  isBlocked(x, y, radius = 16) {
    return this.walls.some(w => !w.destroyed && Math.abs(x - w.x) < w.w / 2 + radius && Math.abs(y - w.y) < w.d / 2 + radius);
  }
  trapPhase(trap, time) {
    const phase = (time + trap.phase) % trap.period;
    return phase < 1.1 ? 'active' : phase > trap.period - .65 ? 'warning' : 'safe';
  }
}
