import test from 'node:test';
import assert from 'node:assert/strict';
import { Fighter, MOVES } from '../fighter.js?v=20261119-headline';
import { Match, STEP } from '../app.js?v=20261119-headline';
import { seededRandom } from '../random.js?v=20261119-headline';

test('seeded matches reproduce a complete physics trajectory', () => {
  const a = new Match(72), b = new Match(72);
  for (let i = 0; i < 1200; i++) { a.update(); b.update(); }
  assert.deepEqual(a.fighters, b.fighters);
  assert.ok(a.stats.hits > 0);
});
for (const name of Object.keys(MOVES)) {
  test(`${name} damages a target once per attack`, () => {
    const w = new Match(5, 2, { terrain: false }), [a, b] = w.fighters;
    a.x = 500; a.y = 400; b.x = 530; b.y = 400;
    a.weapon = 'Sword'; a.cooldown = 0; b.cooldown = 10; b.readyAt = 10;
    assert.ok(a.startAttack(name, b));
    a.readyAt = 10;
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

test('spawn rolls HP, speed, attack power and varied personality traits', () => {
  const fighters = Array.from({ length: 1000 }, (_, i) => new Fighter(i, 400, 400, seededRandom(i)));
  assert.ok(fighters.every(f => f.hp === f.maxHp && f.maxHp >= 80 && f.maxHp <= 130));
  assert.ok(fighters.every(f => f.speed >= 90 && f.speed < 155 && f.power >= .8 && f.power < 1.25));
  assert.equal(new Set(fighters.map(f => f.personality)).size, 6);
  assert.ok(new Set(fighters.map(f => f.maxHp)).size > 40);
});
for (const name of Object.keys(MOVES)) {
  test(`${name}: 10% crit threshold triples damage and doubles all knockback`, () => {
    const w = new Match(8, 2, { terrain: false }), [a, b] = w.fighters;
    a.weapon = 'Sword'; a.x = 500; a.y = 400; b.x = 530; b.y = 400; b.hp = b.maxHp = 500;
    w.rng = () => .099999; a.hit(b, w, name);
    assert.ok(Math.abs(500 - b.hp - MOVES[name].damage * a.power * 3) < 1e-9);
    assert.equal(b.vx, MOVES[name].knockback * 2);
    assert.equal(b.vz, MOVES[name].lift * 2);
    assert.equal(w.stats.crits, 1); assert.equal(w.events[0].text, 'CRIT!');
    b.hp = 500; w.rng = () => .1; a.hit(b, w, name);
    assert.ok(Math.abs(500 - b.hp - MOVES[name].damage * a.power) < 1e-9);
    assert.equal(w.stats.crits, 1);
  });
}
test('coward flees in open space and fights when cornered; aggressive closes in', () => {
  const w = new Match(5, 3, { terrain: false }), [a, b, c] = w.fighters;
  c.x = 1000; c.y = 550;
  a.x = 500; a.y = 400; b.x = 600; b.y = 400;
  a.personality = 'Cowardly'; a.think(STEP, w); assert.ok(a.vx < 0);
  a.personality = 'Aggressive'; a.think(STEP, w); assert.ok(a.vx > 0);
  a.personality = 'Cowardly'; a.x = w.bounds.left + 5; b.x = a.x + 30;
  a.cooldown = 0; a.think(STEP, w); assert.ok(a.attack);
  a.attack = null; a.cooldown = 1; a.x = 350; b.x = 450; w.time = 1;
  a.think(STEP, w); assert.ok(a.vx > 0, 'cornered coward commits to a counterattack after leaving the edge');
});
