import { clamp } from './random.js?v=20261119-ground-spins';

// Swept relative AABB: check floor depth and physical height separately.
// A jump high over someone's head must never count as a body collision.
export function sweptBodies(a, b) {
  const pa = a.previous || a, pb = b.previous || b;
  let enter = 0, exit = 1;
  for (const [axis, extent] of [['x', 32], ['y', 26], ['z', 100]]) {
    const from = pa[axis] - pb[axis], to = a[axis] - b[axis];
    const delta = to - from;
    if (Math.abs(delta) < 1e-9) {
      if (Math.abs(from) > extent) return false;
    } else {
      let t0 = (-extent - from) / delta, t1 = (extent - from) / delta;
      if (t0 > t1) [t0, t1] = [t1, t0];
      enter = Math.max(enter, t0); exit = Math.min(exit, t1);
      if (enter > exit) return false;
    }
  }
  return true;
}

export function resolveDominoes(world) {
  // Newly launched victims become projectiles on the next physics tick.
  const projectiles = world.fighters.filter(f => f.collateralActive && (f.z > 0 || f.previous?.z > 0));
  for (const source of projectiles) {
    for (const target of world.fighters) {
      const speed = Math.hypot(source.vx, source.vy);
      if (speed < 90) break;
      if (target === source || !target.standing || source.flightHits.has(target.id) || !sweptBodies(source, target)) continue;
      source.flightHits.add(target.id);
      target.receiveHit(clamp(speed * .045, 8, 24), source.vx * .72, source.vy * .72, Math.max(170, Math.abs(source.vz) * .65));
      source.vx *= .8; source.vy *= .8;
      world.stats.dominoes++;
      world.emit('domino', target, { text: 'DOMINO!', source: source.id });
    }
  }
}
