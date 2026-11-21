import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, STEP } from '../app.js?v=20261121-name-teams';
import { computePose } from '../pose.js?v=20261121-name-teams';

test('a defeated fighter lands once and then freezes all motion and animation state', () => {
  const w = new Match(8, 3, { terrain: true }), f = w.fighters[0];
  f.receiveHit(999, 450, 50, 300);
  assert.equal(f.settled, undefined);
  for (let i = 0; i < 300 && !f.settled; i++) f.update(STEP, w);
  assert.equal(f.settled, true); assert.equal(f.z, 0);
  assert.equal(f.vx, 0); assert.equal(f.vy, 0); assert.equal(f.vz, 0); assert.equal(f.collateralActive, false);
  const before = structuredClone(f), pose = computePose(f);
  for (let i = 0; i < 1000; i++) { w.time += STEP; f.update(STEP, w); w.arena.update(w); }
  assert.deepEqual(structuredClone(f), before); assert.deepEqual(computePose(f), pose);
  f.age += 20; assert.deepEqual(computePose(f), pose, 'dead limbs and breathing never advance');
});
test('surviving a hit still permits recovery while a KO can never get up or receive another hit', () => {
  const w = new Match(3, 3, { terrain: false }), [alive, dead] = w.fighters;
  alive.readyAt = 100; alive.receiveHit(1, 150, 0, 170); dead.receiveHit(999, 150, 0, 170);
  for (let i = 0; i < 300; i++) { alive.update(STEP, w); dead.update(STEP, w); }
  assert.ok(alive.alive && alive.standing); assert.equal(alive.settled, undefined);
  assert.equal(dead.alive, false); assert.equal(dead.settled, true);
  assert.equal(dead.receiveHit(1, 900, 0, 900), false); assert.equal(dead.vz, 0); assert.equal(dead.hp, 0);
});
test('round end settles defeated bodies instead of freezing them visibly in midair', () => {
  const w = new Match(7, 2, { terrain: false }), [victim, winner] = w.fighters;
  winner.readyAt = 100; victim.receiveHit(999, 450, 0, 670);
  w.update();
  assert.equal(w.finished, true); assert.equal(w.winner, winner);
  assert.equal(victim.z, 0); assert.equal(victim.settled, true); assert.equal(victim.state, 'ko');
});
