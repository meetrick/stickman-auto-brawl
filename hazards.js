import { clamp, range } from './random.js?v=20261119-crowd24';

// Segment/circle intersection clipped to the part of a step near the floor.
// Walking, fast dashes, and landings trigger items; flying over them does not.
export function touchesFloorItem(fighter, item) {
  const a = fighter.previous || fighter;
  let lo = 0, hi = 1;
  const dz = fighter.z - a.z;
  if (Math.abs(dz) < 1e-9) { if (a.z > 9) return false; }
  else if (dz > 0) hi = Math.min(hi, (9 - a.z) / dz);
  else lo = Math.max(lo, (9 - a.z) / dz);
  if (lo > hi || hi < 0 || lo > 1) return false;
  const dx = fighter.x - a.x, dy = fighter.y - a.y;
  const length2 = dx * dx + dy * dy;
  const t = clamp(length2 ? ((item.x - a.x) * dx + (item.y - a.y) * dy) / length2 : 0, Math.max(0, lo), Math.min(1, hi));
  return Math.hypot(a.x + dx * t - item.x, a.y + dy * t - item.y) <= item.radius + 12;
}

export class HazardManager {
  constructor() { this.items = []; this.nextId = 0; this.potionTimer = 1.4; }
  spawn(world, type, position) {
    if (type !== 'potion') return null;
    const cap = 3;
    if (this.items.filter(i => i.type === type).length >= cap) return null;
    let x, y;
    const b = world.bounds, alive = world.fighters.filter(f => f.alive);
    if (position) ({ x, y } = position);
    else {
      // Bias some placements towards the action, keeping an arming warning.
      const nearby = alive.length && world.rng() < .7 ? alive[Math.floor(world.rng() * alive.length)] : null;
      x = nearby ? nearby.x + range(world.rng, -75, 75) : range(world.rng, b.left + 20, b.right - 20);
      y = nearby ? nearby.y + range(world.rng, -55, 55) : range(world.rng, b.top + 20, b.bottom - 20);
    }
    x = clamp(x, b.left + 18, b.right - 18); y = clamp(y, b.top + 18, b.bottom - 18);
    if (world.arena?.isBlocked(x, y, 28)
      || this.items.some(i => Math.hypot(i.x - x, i.y - y) < 35)) return null;
    const item = { id: this.nextId++, type, x, y, radius: 12,
      born: world.time, armAt: world.time + .25, expiresAt: world.time + 20 };
    this.items.push(item); return item;
  }
  update(dt, world) {
    this.potionTimer -= dt;
    if (this.potionTimer <= 0) { this.spawn(world, 'potion'); this.potionTimer = range(world.rng, 4, 7); }
    const consumed = new Set();
    for (const item of this.items) {
      if (item.expiresAt <= world.time) { consumed.add(item.id); continue; }
      if (world.time < item.armAt) continue;
      for (const f of world.fighters) {
        if (!f.alive || !touchesFloorItem(f, item)) continue;
        if (f.hp >= f.maxHp) continue;
        const heal = Math.min(30, f.maxHp - f.hp); f.hp += heal;
        world.stats.heals++;
        world.emit('heal', f, { text: `+${Math.ceil(heal)} HP` });
        consumed.add(item.id); break;
      }
    }
    this.items = this.items.filter(item => !consumed.has(item.id));
  }
}
