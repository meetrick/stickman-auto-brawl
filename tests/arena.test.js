import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js?v=20261119-fight-camera';

test('each seed reproduces its map and different seeds vary pole counts and placement', () => {
  assert.deepEqual(new Match(72, 8, { terrain: true }).arena, new Match(72, 8, { terrain: true }).arena);
  const maps = Array.from({ length: 100 }, (_, seed) => new Match(seed, 8, { terrain: true }).arena);
  assert.ok(new Set(maps.map(a => a.bars.length)).size >= 3);
  assert.ok(maps.every(a => a.traps.length === 0));
  assert.equal(new Set(maps.map(a => JSON.stringify(a.bars))).size, 100);
});
test('generated obstacles leave spawns clear, stay inside bounds and leave walkable gaps', () => {
  for (let seed = 0; seed < 100; seed++) {
    const w = new Match(seed, 8, { terrain: true }), a = w.arena, b = w.bounds;
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
test('all participant counts and the demo have clear floors without spike traps', () => {
  for (const count of [2, 4, 8, 12]) for (const showcase of [false, true]) {
    const w = new Match(10, count, { showcase });
    assert.equal(w.arena, null); assert.ok(w.fighters.every(f => f.weapon === 'None'));  assert.ok(w.hazards.items.every(i => i.type === 'potion'));
  }
});
