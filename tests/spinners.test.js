import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js?v=20261119-tactical-ai';
import { barContact, barPoint } from '../arena.js?v=20261119-tactical-ai';
const pole = () => ({ id: 0, x: 500, y: 400, radius: 80, height: 30, phase: 0, omega: 1.5, cooldowns: new Map() });
test('rotating poles sweep through grounded fighters but allow jumps above the bar', () => {
  const bar = pole(), p = barPoint(bar, 1, 60);
  const f = { ...p, z: 0, previous: { ...p, z: 0 } };
  assert.ok(barContact(bar, f, 1, 1 / 120));
  f.z = f.previous.z = 60; assert.equal(barContact(bar, f, 1, 1 / 120), null);
});
test('swept pole contact catches a fast body and applies one seeded knockback per cooldown', () => {
  const w = new Match(12, 8, { terrain: true }), f = w.fighters[0], bar = pole();
  w.arena.walls = []; w.arena.traps = []; w.arena.bars = [bar];
  bar.phase = -1.5; w.time = 1; w.rng = () => .5;
  f.x = 550; f.y = 400; f.z = 0; f.previous = { x: 550, y: 350, z: 0 };
  w.dt = .1; w.arena.update(w); const hp = f.hp;
  assert.equal(w.stats.barHits, 1); assert.ok(f.vz > 0); assert.ok(f.collateralActive);
  w.arena.update(w); assert.equal(f.hp, hp); assert.equal(w.stats.barHits, 1);
});
test('isolated legacy maps use rotating poles, vary their speed and direction, and keep opening spawns safe', () => {
  const speeds = new Set(), directions = new Set();
  for (let seed = 0; seed < 50; seed++) {
    const w = new Match(seed, 8, { terrain: true }); assert.equal(w.arena.walls.length, 0);
    assert.ok(w.arena.bars.length >= 2 && w.arena.bars.length <= 4);
    for (const bar of w.arena.bars) {
      speeds.add(bar.omega); directions.add(Math.sign(bar.omega));
      for (const f of w.fighters) assert.ok(Math.hypot(f.x - bar.x, (f.y - bar.y) / .55) > bar.radius + 34);
    }
  }
  assert.ok(speeds.size > 40); assert.equal(directions.size, 2);
});
