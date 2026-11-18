import test from 'node:test';
import assert from 'node:assert/strict';
import { Fighter, MOVES } from '../fighter.js';
import { Match, STEP } from '../app.js';
import { seededRandom } from '../random.js';

test('seeded matches reproduce a complete physics trajectory', () => {
  const a = new Match(72), b = new Match(72);
  for (let i = 0; i < 1200; i++) { a.update(); b.update(); }
  assert.deepEqual(a.fighters, b.fighters);
  assert.ok(a.stats.hits > 0);
});
for (const name of Object.keys(MOVES)) {
  test(`${name} damages and launches a target once`, () => {
    const w = new Match(5, 2), [a, b] = w.fighters;
    a.x = 500; a.y = 400; b.x = 530; b.y = 400;
    a.cooldown = 0; b.cooldown = 10;
    assert.ok(a.startAttack(name, b));
    for (let i = 0; i < 85; i++) w.update(STEP);
    assert.ok(b.hp < b.maxHp);
    assert.equal(w.stats.hits, 1);
    assert.ok(w.events.some(e => e.source === a.id));
  });
}
test('knocked fighters land and dead fighters cannot act', () => {
  const w = new Match(3), f = w.fighters[0];
  f.receiveHit(999, 400, 50, 460);
  for (let i = 0; i < 250; i++) f.update(STEP, w);
  assert.equal(f.z, 0); assert.equal(f.hp, 0); assert.equal(f.attack, null);
  assert.ok(f.x >= w.bounds.left && f.x <= w.bounds.right);
});
test('PRNG stays in [0,1) for a long run', () => {
  const rng = seededRandom(0);
  for (let i = 0; i < 10000; i++) { const n = rng(); assert.ok(n >= 0 && n < 1); }
});
