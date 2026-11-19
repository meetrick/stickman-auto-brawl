import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js?v=20261119-headline';
import { Fighter } from '../fighter.js?v=20261119-headline';
import { seededRandom } from '../random.js?v=20261119-headline';
import { WEAPONS } from '../weapons.js?v=20261119-headline';

test('all fighters spawn unarmed across seeds', () => {
  const types = new Set();
  for (let seed = 0; seed < 200; seed++) {
    const a = new Fighter(0, 400, 400, seededRandom(seed)), b = new Fighter(0, 400, 400, seededRandom(seed));
    assert.equal(a.weapon, b.weapon); types.add(a.weapon);
  }
  assert.deepEqual([...types], ['None']);
});
test('weapon choices change combat reach, timing and launch; unarmed fighters cannot swing a weapon', () => {
  const [a, b] = new Match(2, 2, { terrain: false }).fighters; a.cooldown = 0;
  a.weapon = 'None'; assert.equal(a.startAttack('WeaponStrike', b), false);
  a.weapon = 'Staff'; const staff = a.getMove('WeaponStrike');
  a.weapon = 'Sword'; const sword = a.getMove('WeaponStrike');
  a.weapon = 'Hammer'; const hammer = a.getMove('WeaponStrike');
  assert.ok(staff.reach > sword.reach && sword.reach > hammer.reach);
  assert.ok(sword.duration < staff.duration && staff.duration < hammer.duration);
  assert.ok(hammer.damage > sword.damage && hammer.lift > sword.lift);
});
test('staff sweep hits two distinct victims once each and shares one critical roll', () => {
  const w = new Match(4, 4, { terrain: false }), [a, ...victims] = w.fighters;
  a.x = 400; a.y = 400; a.weapon = 'Staff'; a.cooldown = 0;
  victims.forEach((f, i) => { f.x = 480; f.y = 400 + i * 33; f.readyAt = 100; f.hp = f.maxHp = 500; });
  w.rng = () => .05; a.startAttack('WeaponStrike', victims[0]);
  for (let i = 0; i < 75; i++) w.update();
  const hits = w.events.filter(e => e.move === 'WeaponStrike');
  assert.equal(hits.length, 2); assert.equal(new Set(hits.map(e => e.fighter)).size, 2);
  assert.ok(hits.every(e => e.crit && e.weapon === 'Staff'));
  assert.equal(w.stats.weaponHits.Staff, 2);
});
test('hammer windup can be interrupted before contact without a delayed ghost hit', () => {
  const w = new Match(3, 2, { terrain: false }), [a, b] = w.fighters;
  a.x = 400; a.y = 400; b.x = 455; b.y = 400; b.readyAt = 100;
  a.weapon = 'Hammer'; a.cooldown = 0; a.startAttack('WeaponStrike', b);
  for (let i = 0; i < 20; i++) w.update();
  assert.equal(b.hp, b.maxHp);
  a.receiveHit(1, -150, 0, 200);
  for (let i = 0; i < 40; i++) w.update();
  assert.equal(b.hp, b.maxHp); assert.equal(w.stats.moves?.WeaponStrike || 0, 0);
});

test('connected sword strikes can chain into one short dash follow-up', () => {
  const w = new Match(6, 3, { terrain: false }), [a, b, c] = w.fighters;
  a.x = 400; a.y = 400; a.weapon = 'Sword'; a.cooldown = 0;
  a.personality = 'Aggressive'; b.x = 450; b.y = 400; b.readyAt = c.readyAt = 100;
  b.hp = b.maxHp = 500; c.x = 1000; c.y = 550; w.rng = () => .2;
  a.startAttack('WeaponStrike', b);
  for (let i = 0; i < 80; i++) w.update();
  assert.equal(a.attack?.name, 'Dash'); assert.equal(a.followUp, null);
});

test('a fleeing coward backsteps without a repetitive escape jump', () => {
  const w = new Match(8, 3, { terrain: false }), [a, b, c] = w.fighters;
  c.x = 1000; c.y = 550;
  a.x = 500; a.y = 400; b.x = 600; b.y = 400; a.personality = 'Cowardly'; w.rng = () => .1;
  a.think(1 / 120, w);
  assert.equal(a.state, 'evade'); assert.ok(a.vx < 0); assert.equal(a.vz, 0);
});
