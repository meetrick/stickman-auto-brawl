import { seededRandom, range, clamp } from './random.js';
import { touchesFloorItem } from './hazards.js';

export const WALL_TYPES = ['stone', 'spring', 'crate'];
export function barPoint(bar, time, offset) {
  const angle = bar.phase + bar.omega * time;
  return { x: bar.x + Math.cos(angle) * offset, y: bar.y + Math.sin(angle) * offset * .55 };
}
export function barContact(bar, fighter, time, dt) {
  const from = fighter.previous || fighter;
  const travel = Math.hypot(fighter.x - from.x, fighter.y - from.y) + Math.abs(bar.omega) * bar.radius * dt;
  const steps = Math.max(1, Math.ceil(travel / 8));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, z = from.z + (fighter.z - from.z) * t;
    if (z > bar.height + 9 || z + 104 < bar.height - 9) continue;
    const when = time - dt + dt * t, a = barPoint(bar, when, -bar.radius), b = barPoint(bar, when, bar.radius);
    const x = from.x + (fighter.x - from.x) * t, y = from.y + (fighter.y - from.y) * t;
    const dx = b.x - a.x, dy = b.y - a.y;
    const u = clamp(((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
    const px = a.x + dx * u, py = a.y + dy * u;
    if (Math.hypot(x - px, y - py) <= 21) return { x: px, y: py, side: u >= .5 ? 1 : -1, angle: bar.phase + bar.omega * when };
  }
  return null;
}
const overlaps = (a, b, gap = 0) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap && Math.abs(a.y - b.y) < (a.d + b.d) / 2 + gap;

export function sweepWall(from, to, wall, radius = 16, vertical = false) {
  let enter = 0, exit = 1, normal = { x: 0, y: 0, z: 0 };
  const axes = [['x', wall.x - wall.w / 2 - radius, wall.x + wall.w / 2 + radius],
    ['y', wall.y - wall.d / 2 - radius, wall.y + wall.d / 2 + radius]];
  if (vertical) axes.push(['z', -110, wall.height]);
  for (const [axis, lo, hi] of axes) {
    const delta = to[axis] - from[axis];
    if (Math.abs(delta) < 1e-9) { if (from[axis] < lo || from[axis] > hi) return null; continue; }
    let t0 = (lo - from[axis]) / delta, t1 = (hi - from[axis]) / delta;
    const direction = delta > 0 ? -1 : 1;
    if (t0 > t1) [t0, t1] = [t1, t0];
    if (t0 > enter) { enter = t0; normal = { x: 0, y: 0, z: 0, [axis]: direction }; }
    exit = Math.min(exit, t1);
    if (enter > exit) return null;
  }
  return { t: enter, ...normal };
}

export class Arena {
  constructor(seed, bounds, fighters, { legacyWalls = false } = {}) {
    // Map rolls have their own RNG stream, independent of fighter/combat rolls.
    const rng = seededRandom(seed ^ 0xA7E4C921);
    this.walls = []; this.traps = []; this.bars = [];
    const wallCount = legacyWalls ? 3 + Math.floor(rng() * 4) : 0, trapCount = 2 + Math.floor(rng() * 4);
    const barCount = 2 + Math.floor(rng() * 3);
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
    for (let attempt = 0; this.bars.length < barCount && attempt < 400; attempt++) {
      const radius = range(rng, 60, 90);
      const bar = { id: this.bars.length, x: range(rng, bounds.left + radius + 25, bounds.right - radius - 25),
        y: range(rng, bounds.top + radius * .55 + 25, bounds.bottom - radius * .55 - 25), radius,
        height: range(rng, 25, 48), phase: range(rng, 0, Math.PI * 2), omega: range(rng, .8, 1.8) * (rng() < .5 ? -1 : 1), cooldowns: new Map() };
      if (fighters.some(f => Math.hypot(f.x - bar.x, (f.y - bar.y) / .55) < radius + 35)
        || this.bars.some(b => Math.hypot(b.x - bar.x, (b.y - bar.y) / .55) < b.radius + radius + 30)) continue;
      this.bars.push(bar);
    }
    for (let attempt = 0; this.traps.length < trapCount && attempt < 250; attempt++) {
      const trap = { id: this.traps.length, x: range(rng, bounds.left + 35, bounds.right - 35), y: range(rng, bounds.top + 30, bounds.bottom - 30),
        radius: 21, phase: range(rng, 0, 5), period: range(rng, 3.2, 5.2), cooldowns: new Map() };
      if (this.isBlocked(trap.x, trap.y, 35) || this.bars.some(b => Math.hypot(b.x - trap.x, b.y - trap.y) < 35) || this.traps.some(t => Math.hypot(t.x - trap.x, t.y - trap.y) < 70)
        || fighters.some(f => Math.hypot(f.x - trap.x, f.y - trap.y) < 50)) continue;
      this.traps.push(trap);
    }
  }
  isBlocked(x, y, radius = 16) {
    return this.walls.some(w => !w.destroyed && Math.abs(x - w.x) < w.w / 2 + radius && Math.abs(y - w.y) < w.d / 2 + radius);
  }
  lineClear(a, b, radius = 16) {
    return !this.walls.some(w => !w.destroyed && sweepWall(a, b, w, radius));
  }
  attackClear(a, b) {
    return !this.walls.some(w => !w.destroyed && sweepWall({ ...a, z: a.z + 45 }, { ...b, z: b.z + 45 }, w, 4, true));
  }
  waypoint(f, goal, world) {
    if (this.lineClear(f, goal)) { f.route = null; return goal; }
    if (!f.route || world.time >= f.route.until || Math.hypot(goal.x - f.route.goal.x, goal.y - f.route.goal.y) > 80) {
      const b = world.bounds, nodes = [{ x: f.x, y: f.y }, { x: goal.x, y: goal.y }];
      for (const w of this.walls.filter(w => !w.destroyed)) for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const p = { x: w.x + sx * (w.w / 2 + 26), y: w.y + sy * (w.d / 2 + 26) };
        if (p.x > b.left + 16 && p.x < b.right - 16 && p.y > b.top + 16 && p.y < b.bottom - 16 && !this.isBlocked(p.x, p.y, 18)) nodes.push(p);
      }
      const costs = nodes.map(() => Infinity), previous = [], visited = new Set(); costs[0] = 0;
      for (let step = 0; step < nodes.length; step++) {
        let current = -1;
        for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (current < 0 || costs[i] < costs[current])) current = i;
        if (current < 0 || !Number.isFinite(costs[current]) || current === 1) break;
        visited.add(current);
        for (let i = 1; i < nodes.length; i++) if (!visited.has(i) && this.lineClear(nodes[current], nodes[i])) {
          const cost = costs[current] + Math.hypot(nodes[current].x - nodes[i].x, nodes[current].y - nodes[i].y);
          if (cost < costs[i]) { costs[i] = cost; previous[i] = current; }
        }
      }
      const points = [];
      if (Number.isFinite(costs[1])) for (let i = 1; i !== 0 && i !== undefined; i = previous[i]) points.unshift(nodes[i]);
      f.route = { points, goal: { x: goal.x, y: goal.y }, until: world.time + .55 + f.id * .015 };
    }
    while (f.route.points.length > 1 && Math.hypot(f.route.points[0].x - f.x, f.route.points[0].y - f.y) < 12 && this.lineClear(f, f.route.points[1])) f.route.points.shift();
    return f.route.points[0] || goal;
  }
  resolveFighter(f, world) {
    if (f.heldBy != null) return;
    const from = f.previous || f;
    const contacts = this.walls.filter(w => !w.destroyed).map(w => ({ wall: w, hit: sweepWall(from, f, w, 16, true) }))
      .filter(c => c.hit).sort((a, b) => a.hit.t - b.hit.t);
    const contact = contacts[0];
    if (!contact) return;
    const { wall: w, hit } = contact;
    let nx = hit.x, ny = hit.y;
    const hx = from.x + (f.x - from.x) * hit.t, hy = from.y + (f.y - from.y) * hit.t;
    if (!nx && !ny) {
      const px = w.w / 2 + 16 - Math.abs(hx - w.x), py = w.d / 2 + 16 - Math.abs(hy - w.y);
      if (px < py) nx = hx < w.x ? -1 : 1; else ny = hy < w.y ? -1 : 1;
    }
    const speed = Math.hypot(f.vx, f.vy), violent = (f.collateralActive && (speed > 90 || f.vz < -200)) || f.attack?.name === 'Dash';
    if (violent && w.type === 'crate') {
      w.destroyed = true; f.vx *= .75; f.vy *= .75; f.route = null;
      world.stats.wallBreaks++; world.emit('wall', f, { text: 'CRASH!', x: w.x, y: w.y, z: 0 }); return;
    }
    f.x = nx ? w.x + nx * (w.w / 2 + 16.1) : hx;
    f.y = ny ? w.y + ny * (w.d / 2 + 16.1) : hy;
    f.route = null;
    f.wallCooldowns ||= new Map();
    if (violent && world.time >= (f.wallCooldowns.get(w.id) || 0)) {
      f.wallCooldowns.set(w.id, world.time + .5);
      const lucky = world.rng() < .18, spring = w.type === 'spring';
      const impulse = Math.max(180, speed) * (spring ? 1.1 : lucky ? .85 : .55);
      const lift = lucky ? 430 : spring ? 390 : Math.max(160, Math.abs(f.vz) * .45);
      const damage = lucky || spring ? 0 : clamp(speed * .035, 6, 18);
      if (f.alive) f.receiveHit(damage, nx * impulse, ny * impulse, lift);
      else { f.vx = nx * impulse; f.vy = ny * impulse; f.vz = lift; }
      world.stats.wallHits++;
      if (lucky) world.stats.luckyBounces++;
      world.emit('wall', f, { text: lucky ? 'LUCKY BOUNCE!' : spring ? 'SPRING!' : 'WALL SLAM!', lucky });
    } else {
      const inward = f.vx * nx + f.vy * ny;
      if (inward < 0) { f.vx -= inward * nx; f.vy -= inward * ny; }
    }
  }
  update(world) {
    for (const f of world.fighters) this.resolveFighter(f, world);
    for (const bar of this.bars) for (const f of world.fighters) {
      if (!f.alive || f.heldBy != null || world.time < .9 || world.time < (bar.cooldowns.get(f.id) || 0)) continue;
      const contact = barContact(bar, f, world.time, world.dt || 1 / 120);
      if (!contact) continue;
      bar.cooldowns.set(f.id, world.time + .95);
      const direction = Math.sign(bar.omega) * contact.side, lucky = world.rng() < .12;
      const speed = 300 + Math.abs(bar.omega) * 80;
      f.receiveHit(lucky ? 0 : 13, -Math.sin(contact.angle) * direction * speed,
        Math.cos(contact.angle) * direction * speed * .65, lucky ? 460 : 270);
      world.stats.barHits++; if (lucky) world.stats.luckyBounces++;
      world.emit('bar', f, { text: lucky ? 'LUCKY RICOCHET!' : 'POLE HIT!', lucky });
    }
    for (const trap of this.traps) {
      if (this.trapPhase(trap, world.time) !== 'active') continue;
      for (const f of world.fighters) {
        if (!f.alive || world.time < (trap.cooldowns.get(f.id) || 0) || !touchesFloorItem(f, trap)) continue;
        trap.cooldowns.set(f.id, world.time + 1.2);
        const angle = Math.atan2(f.y - trap.y, f.x - trap.x);
        f.receiveHit(14, Math.cos(angle) * 170, Math.sin(angle) * 170, 300);
        world.stats.spikes++; world.emit('spike', f, { text: 'SPIKED!' });
      }
    }
  }
  trapPhase(trap, time) {
    const phase = (time + trap.phase) % trap.period;
    return phase < 1.1 ? 'active' : phase > trap.period - .65 ? 'warning' : 'safe';
  }
}
