import { clamp } from './random.js?v=20261119-headline';
import { styleProfile } from './styles.js?v=20261119-headline';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// Only free footwork participates. Throws, recoil, dodges and settled bodies
// belong to combat physics, never to crowd correction.
const movable = f => f.standing && !f.attack && !f.defense && !f.collateralActive
  && f.holdingId == null && f.vz === 0 && !f.landing;

export class CrowdNavigation {
  constructor() { this.nextPlan = 0; this.plans = new Map(); }
  plan(world) {
    if (world.time < this.nextPlan) return;
    this.nextPlan = world.time + .2;
    const alive = world.fighters.filter(f => f.alive && f.heldBy == null);
    const previous = this.plans; this.plans = new Map();
    if (alive.length <= 2) return;
    const load = new Map(), reserved = [], b = world.bounds;
    // Rotate priority deterministically, without consuming combat RNG.
    const offset = (world.seed + Math.floor(world.time * 5)) % alive.length;
    for (let n = 0; n < alive.length; n++) {
      const f = alive[(n + offset) % alive.length];
      const enemies = alive.filter(g => g !== f);
      const nearest = enemies.reduce((a, g) => distance(f, g) < distance(f, a) ? g : a);
      const old = previous.get(f.id);
      const committed = enemies.find(g => g.id === f.attack?.targetId
        || g.id === f.counterTargetId && world.time < f.counterUntil
        || g.id === old?.targetId && (f.followUp && world.time < f.followUpUntil));
      let target = committed || nearest;
      if (!committed && distance(f, nearest) > 75 && !['Aggressive', 'Cowardly'].includes(f.personality)) {
        const score = g => distance(f, g) + (load.get(g.id) || 0) * 65 - (g.id === old?.targetId ? 35 : 0);
        target = enemies.reduce((a, g) => score(g) < score(a) ? g : a);
      }
      load.set(target.id, (load.get(target.id) || 0) + 1);
      const preferred = styleProfile(f.style).preferred;
      const radius = preferred === 'Grab' ? 42 : preferred === 'Punch' ? 52 : 70;
      const angle = Math.atan2(f.y - target.y, f.x - target.x);
      let best = null, bestScore = Infinity;
      for (let slot = 0; slot < 8; slot++) {
        const a = angle + slot * Math.PI / 4;
        const goal = { x: clamp(target.x + Math.cos(a) * radius, b.left + 18, b.right - 18),
          y: clamp(target.y + Math.sin(a) * radius, b.top + 18, b.bottom - 18) };
        let score = distance(f, goal);
        for (const g of alive) if (g !== f && g !== target && g.z < 20) score += Math.max(0, 65 - distance(goal, g)) * 2;
        for (const g of reserved) score += Math.max(0, 55 - distance(goal, g)) * 3;
        if (score < bestScore) { bestScore = score; best = goal; }
      }
      this.plans.set(f.id, { targetId: target.id, goal: best }); reserved.push(best);
    }
  }
  targetFor(f, enemies) {
    return enemies.find(g => g.id === this.plans.get(f.id)?.targetId);
  }
  goalFor(f, target) {
    const plan = this.plans.get(f.id);
    return plan?.targetId === target.id ? plan.goal : target;
  }
  steer(f, world) {
    if (!movable(f)) return;
    const speed = Math.hypot(f.vx, f.vy);
    if (!speed) return;
    let x = 0, y = 0;
    for (const other of world.fighters) {
      if (other === f || !movable(other)) continue;
      const d = distance(f, other);
      if (d >= 46) continue;
      const angle = d > .01 ? Math.atan2(f.y - other.y, f.x - other.x) : this.pairAngle(f, other);
      const force = (46 - d) / 46;
      x += Math.cos(angle) * force; y += Math.sin(angle) * force;
    }
    const cap = Math.max(1, Math.hypot(x, y) / .65);
    f.vx += x / cap * speed; f.vy += y / cap * speed;
    const limit = Math.max(1, Math.hypot(f.vx, f.vy) / speed);
    f.vx /= limit; f.vy /= limit;
  }
  pairAngle(a, b) {
    const lo = Math.min(a.id, b.id), hi = Math.max(a.id, b.id);
    return ((lo * 73 + hi * 151) % 360) * Math.PI / 180 + (a.id > b.id ? Math.PI : 0);
  }
  separate(world, dt) {
    const free = world.fighters.filter(movable), b = world.bounds;
    for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) {
      const a = free[i], c = free[j], d = distance(a, c);
      if (d >= 32) continue;
      const angle = d > .01 ? Math.atan2(a.y - c.y, a.x - c.x) : this.pairAngle(a, c);
      const shift = Math.min((32 - d) / 2, 90 * dt);
      const dx = Math.cos(angle) * shift, dy = Math.sin(angle) * shift;
      a.x = clamp(a.x + dx, b.left, b.right); a.y = clamp(a.y + dy, b.top, b.bottom);
      c.x = clamp(c.x - dx, b.left, b.right); c.y = clamp(c.y - dy, b.top, b.bottom);
    }
  }
}
