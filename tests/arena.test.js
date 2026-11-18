import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js';

test('each seed reproduces its map and different seeds vary pole/trap counts and placement', () => {
  assert.deepEqual(new Match(72).arena, new Match(72).arena);
  const maps = Array.from({ length: 100 }, (_, seed) => new Match(seed).arena);
  assert.ok(new Set(maps.map(a => a.bars.length)).size >= 3);
  assert.ok(new Set(maps.map(a => a.traps.length)).size >= 3);
  assert.equal(new Set(maps.map(a => JSON.stringify(a.bars))).size, 100);
});
test('generated obstacles leave spawns clear, stay inside bounds and leave walkable gaps', () => {
  for (let seed = 0; seed < 100; seed++) {
    const w = new Match(seed), a = w.arena, b = w.bounds;
    for (const wall of a.walls) {
      assert.ok(wall.x - wall.w / 2 > b.left && wall.x + wall.w / 2 < b.right);
      assert.ok(wall.y - wall.d / 2 > b.top && wall.y + wall.d / 2 < b.bottom);
      for (const other of a.walls) if (other !== wall) {
        assert.ok(Math.abs(wall.x - other.x) >= (wall.w + other.w) / 2 + 55 || Math.abs(wall.y - other.y) >= (wall.d + other.d) / 2 + 55);
      }
    }
    for (const f of w.fighters) assert.equal(a.isBlocked(f.x, f.y, 28), false);
    for (const trap of a.traps) assert.equal(a.isBlocked(trap.x, trap.y, 35), false);
    for (const item of w.hazards.items) assert.equal(a.isBlocked(item.x, item.y, 28), false);
  }
});
test('spike traps alternate warning, active and safe phases without per-frame RNG', () => {
  const a = new Match(10).arena, t = a.traps[0];
  t.phase = 0;
  assert.equal(a.trapPhase(t, 0), 'active');
  assert.equal(a.trapPhase(t, t.period - .3), 'warning');
  assert.equal(a.trapPhase(t, 1.5), 'safe');
});
