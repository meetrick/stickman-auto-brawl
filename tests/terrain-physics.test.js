import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, STEP } from '../app.js';
import { Arena } from '../arena.js';
function scene(type = 'stone') {
  const w = new Match(8, 2, { terrain: false });
  w.arena = new Arena(8, w.bounds, []); w.arena.traps = [];
  const wall = { id: 0, x: 500, y: 400, w: 35, d: 90, height: 65, type, destroyed: false };
  w.arena.walls = [wall];
  const [f, b] = w.fighters; f.x = 540; f.y = 400; b.x = 800; b.y = 500;
  w.rng = () => .5;
  return { w, f, b, wall };
}
function flying(f) { f.receiveHit(0, 450, 0, 200); f.previous = { x: 400, y: 400, z: 20 }; f.z = 25; }
test('swept wall impacts stop fast bodies, damage and bounce them; airborne clearance is respected', () => {
  const { w, f } = scene(); flying(f); const hp = f.hp;
  w.arena.resolveFighter(f, w);
  assert.ok(f.x < 500); assert.ok(f.vx < 0); assert.ok(f.hp < hp); assert.equal(w.stats.wallHits, 1);
  const hp2 = f.hp; f.previous.x = 400; f.x = 540; f.z = f.previous.z = 150;
  w.arena.resolveFighter(f, w); assert.equal(f.hp, hp2); assert.equal(f.x, 540);
});
test('spring and lucky impacts preserve HP; violent hits break crates', () => {
  for (const type of ['spring', 'stone', 'crate']) {
    const { w, f, wall } = scene(type); flying(f); const hp = f.hp;
    if (type === 'stone') w.rng = () => .17999;
    w.arena.resolveFighter(f, w); assert.equal(f.hp, hp);
    if (type === 'crate') { assert.equal(wall.destroyed, true); assert.equal(w.stats.wallBreaks, 1); }
    else { assert.ok(f.vx < 0); assert.equal(f.vz, type === 'spring' ? 390 : 430); }
  }
});
test('wall walking slides without damage and attacks cannot pass through a wall', () => {
  const { w, f, b } = scene(); f.previous = { x: 400, y: 400, z: 0 }; f.vx = 150;
  const hp = f.hp; w.arena.resolveFighter(f, w);
  assert.equal(f.hp, hp); assert.equal(w.stats.wallHits, 0); assert.equal(f.vx, 0);
  f.x = 460; b.x = 540; b.y = 400; const bhp = b.hp;
  f.hit(b, w, 'Dash'); assert.equal(b.hp, bhp);
  f.z = b.z = 100; f.hit(b, w, 'JumpKick'); assert.ok(b.hp < bhp);
});
test('navigation leads a fighter around a wall instead of pinning it against the face', () => {
  const { w, f, b } = scene(); f.x = 400; b.x = 600; b.y = 400;
  f.personality = 'Aggressive'; f.cooldown = 100; b.readyAt = 100;
  for (let i = 0; i < 600; i++) { w.time += STEP; f.update(STEP, w); w.arena.resolveFighter(f, w); }
  assert.ok(f.x > 550, `fighter reached ${f.x}`);
  assert.equal(w.arena.isBlocked(f.x, f.y, 15), false);
});
test('spikes hurt on the active floor contact, not during safe phases or overhead flight', () => {
  const { w, f } = scene(); w.arena.walls = [];
  const trap = { id: 0, x: f.x, y: f.y, radius: 21, period: 4, phase: 0, cooldowns: new Map() };
  w.arena.traps = [trap]; f.previous = { x: f.x, y: f.y, z: 0 }; const hp = f.hp;
  w.time = 2; w.arena.update(w); assert.equal(f.hp, hp);
  w.time = 4; f.previous.z = f.z = 100; w.arena.update(w); assert.equal(f.hp, hp);
  f.previous.z = 10; f.z = 0; w.arena.update(w);
  assert.equal(f.hp, hp - 14); assert.equal(f.vz, 300); assert.equal(w.stats.spikes, 1);
});
