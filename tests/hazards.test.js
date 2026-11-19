import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, STEP } from '../app.js?v=20261119-martial-motion';
import { touchesFloorItem } from '../hazards.js?v=20261119-martial-motion';
function setup() {
  const w = new Match(7, 3, { terrain: false }), f = w.fighters[0];
  f.x = 500; f.y = 400; f.previous = { x: 500, y: 400, z: 0 };
  const item = w.hazards.spawn(w, 'potion', f);
  w.time = 1; w.hazards.potionTimer = 100;
  return { w, f, item };
}
test('damaging floor items cannot be spawned, including in the staged demo', () => {
  for (const showcase of [false, true]) {
    const w = new Match(72, 8, { showcase });
    assert.equal(w.hazards.spawn(w, 'mine', w.fighters[0]), null);
    assert.equal(w.hazards.spawn(w, 'spike', w.fighters[0]), null);
    for (let i = 0; i < 500; i++) w.update();
    assert.equal(w.stats.explosions, 0); assert.equal(w.stats.spikes, 0);
    assert.ok(w.hazards.items.every(i => i.type === 'potion'));
  }
});
test('walking, landing and fast dashes touch potions; overhead flight does not', () => {
  const { f, item } = setup();
  f.x = 570; f.previous.x = 430; assert.equal(touchesFloorItem(f, item), true);
  f.x = 500; f.previous.x = 500; f.previous.z = 20; f.z = 0; assert.equal(touchesFloorItem(f, item), true);
  f.z = 100; f.previous.z = 100; assert.equal(touchesFloorItem(f, item), false);
  f.z = 0; f.previous.z = 0; f.y = 450; f.previous.y = 450; assert.equal(touchesFloorItem(f, item), false);
});
test('potions heal at most 30, cap at rolled max HP and never revive KO fighters', () => {
  const { w, f } = setup();
  w.hazards.update(STEP, w); assert.equal(w.hazards.items.length, 1);
  f.hp -= 15; w.hazards.update(STEP, w);
  assert.equal(f.hp, f.maxHp); assert.equal(w.stats.heals, 1); assert.equal(w.hazards.items.length, 0);
  w.hazards.spawn(w, 'potion', f); w.time = 2; f.hp = 0; w.hazards.update(STEP, w);
  assert.equal(f.hp, 0); assert.equal(w.hazards.items.length, 1);
  f.hp = 1; w.hazards.update(STEP, w); assert.equal(f.hp, 31);
});
test('potion caps, expiry and arena bounds keep long rounds bounded', () => {
  const w = new Match(100);
  for (let i = 0; i < 2000; i++) w.hazards.spawn(w, 'potion');
  assert.ok(w.hazards.items.length <= 3);
  assert.ok(w.hazards.items.every(i => i.x >= w.bounds.left && i.x <= w.bounds.right && i.y >= w.bounds.top && i.y <= w.bounds.bottom));
  w.time = 21; w.hazards.potionTimer = 100;
  w.hazards.update(STEP, w); assert.equal(w.hazards.items.length, 0);
});
test('chaos demo still produces real dominoes without floor traps', () => {
  const w = new Match(72, 8, { showcase: true });
  for (let i = 0; i < 240; i++) w.update();
  assert.ok(w.stats.dominoes >= 2); assert.equal(w.stats.explosions, 0);
  assert.ok(new Set(w.fighters.map(f => f.maxHp)).size > 1);
});
test('many complete random matches stay finite and produce unscripted chaos', () => {
  const totals = { dominoes: 0, heals: 0, crits: 0 };
  const moves = { Dash: 0, Uppercut: 0, Grab: 0 };
  for (let seed = 0; seed < 32; seed++) {
    const w = new Match(seed);
    for (let tick = 0; tick < 10810 && !w.finished; tick++) w.update();
    assert.equal(w.finished, true);
    assert.equal(w.stats.explosions, 0); assert.equal(w.stats.spikes, 0);
    assert.equal(w.arena, null); assert.ok(w.fighters.every(f => f.weapon === 'None')); assert.ok(w.hazards.items.every(i => i.type === 'potion'));
    for (const f of w.fighters) {
      assert.ok([f.x, f.y, f.z, f.hp, f.vx, f.vy, f.vz].every(Number.isFinite));
      assert.ok(f.hp >= 0 && f.hp <= f.maxHp); assert.ok(f.z >= 0);
    }
    for (const key of Object.keys(totals)) totals[key] += w.stats[key];
    for (const key of Object.keys(moves)) moves[key] += w.stats.moves?.[key] || 0;
    assert.equal(w.stats.moves?.WeaponStrike || 0, 0);
  }
  for (const [key, total] of Object.entries(totals)) assert.ok(total > 0, `${key} occurred naturally`);
  for (const [key, total] of Object.entries(moves)) assert.ok(total > 5, `${key} is used naturally across seeded rounds`);
});
