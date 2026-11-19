import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js?v=20261119-fight-camera';
import { resolveDominoes, sweptBodies } from '../collisions.js?v=20261119-fight-camera';

function scene() {
  const w = new Match(1, 3);
  for (const [i, f] of w.fighters.entries()) { f.x = 400 + i * 70; f.y = 400; f.z = 0; }
  return w;
}
test('a launched body damages a standing victim and chains into another', () => {
  const w = scene(), [a, b, c] = w.fighters;
  a.receiveHit(1, 450, 0, 220); a.previous = { x: 400, y: 400, z: 20 }; a.x = 470; a.z = 25;
  const hp = b.hp; resolveDominoes(w);
  assert.ok(b.hp < hp); assert.ok(b.stun > 0); assert.ok(b.vz > 0);
  b.previous = { x: 470, y: 400, z: 25 }; b.x = 540;
  resolveDominoes(w);
  assert.ok(c.hp < c.maxHp); assert.equal(w.stats.dominoes, 2);
});
test('fast bodies cannot tunnel; different depth and overhead misses are excluded', () => {
  const w = scene(), [a, b] = w.fighters;
  a.receiveHit(1, 900, 0, 200); a.previous = { x: 350, y: 400, z: 30 }; a.x = 600; a.z = 40;
  assert.equal(sweptBodies(a, b), true);
  b.y = 500; assert.equal(sweptBodies(a, b), false);
  b.y = 400; a.z = 200; a.previous.z = 200; assert.equal(sweptBodies(a, b), false);
});
test('one projectile cannot repeatedly hit a recovered victim in the same flight', () => {
  const w = scene(), [a, b] = w.fighters;
  a.receiveHit(1, 450, 0, 200); a.x = b.x; a.z = 30;
  resolveDominoes(w); const hp = b.hp;
  b.stun = 0; b.z = 0; resolveDominoes(w);
  assert.equal(b.hp, hp); assert.equal(w.stats.dominoes, 1);
});
test('ordinary JumpKick flight and stationary corpses cause no collateral damage', () => {
  const w = scene(), [a, b] = w.fighters;
  a.x = b.x; a.z = 30; a.vx = 400;
  resolveDominoes(w); assert.equal(w.stats.dominoes, 0);
  a.receiveHit(999, 0, 0, 0); resolveDominoes(w);
  assert.equal(w.stats.dominoes, 0);
});
test('a flying KO body can still bowl over a living fighter', () => {
  const w = scene(), [a, b] = w.fighters;
  a.receiveHit(999, 450, 0, 200); a.x = b.x; a.z = 30;
  resolveDominoes(w); assert.equal(w.stats.dominoes, 1);
});
