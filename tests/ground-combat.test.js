import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, STEP } from '../app.js?v=20261119-fight-camera';

function pair() {
  const w = new Match(5, 2, { terrain: false }), [a, b] = w.fighters;
  Object.assign(a, { x: 500, y: 400, cooldown: 0, weapon: 'None', style: 'Kickboxing', personality: 'Aggressive' });
  Object.assign(b, { x: 540, y: 400, readyAt: 100, hp: 500, maxHp: 500 });
  w.rng = () => .5;
  return { w, a, b };
}
test('ordinary punches, kicks, dashes and light weapons recoil on the floor', () => {
  for (const name of ['Punch', 'Kick', 'Dash', 'JumpKick', 'WeaponStrike']) {
    const { w, a, b } = pair(); a.weapon = 'Sword';
    a.hit(b, w, name);
    assert.equal(b.z, 0); assert.equal(b.vz, 0); assert.equal(b.state, 'hit');
    assert.equal(b.collateralActive, false); assert.ok(b.vx > 0);
  }
});
test('connected punches chain twice into a kick; interruptions cancel pending combos', () => {
  const { w, a, b } = pair(); a.startAttack('Punch', b);
  for (let i = 0; i < 135; i++) w.update();
  assert.deepEqual(w.events.filter(e => e.type === 'hit').map(e => e.move).reverse(), ['Punch', 'Punch', 'Kick']);
  a.followUp = 'Punch'; a.comboStep = 1; a.receiveHit(1, -50, 0, 0);
  assert.equal(a.followUp, null); assert.equal(a.comboStep, 0);
});
test('jump kick is a short hop with landing recovery and cannot immediately repeat', () => {
  const { w, a, b } = pair(); a.startAttack('JumpKick', b); a.readyAt = 100;
  let peak = 0, landed = false;
  for (let i = 0; i < 65; i++) {
    w.update(); peak = Math.max(peak, a.z);
    if (i > 5 && a.z === 0 && a.landing > 0) landed = true;
  }
  assert.ok(peak > 5 && peak < 20); assert.ok(landed); assert.equal(a.z, 0);
  a.cooldown = 0; assert.equal(a.startAttack('JumpKick', b), false);
  for (let i = 0; i < 420; i++) a.update(STEP, w);
  a.cooldown = 0; assert.equal(a.startAttack('JumpKick', b), true);
});
test('seeded rounds favor grounded exchanges while keeping every special move', () => {
  let airborne = 0, samples = 0; const moves = {};
  for (let seed = 1; seed <= 32; seed++) {
    const w = new Match(seed);
    for (let tick = 0; tick < 10810 && !w.finished; tick++) {
      w.update();
      for (const f of w.fighters) if (f.alive) { samples++; if (f.z > 12) airborne++; }
    }
    assert.equal(w.finished, true);
    for (const [name, n] of Object.entries(w.stats.moves || {})) moves[name] = (moves[name] || 0) + n;
  }
  assert.ok(airborne / samples < .15);
  assert.ok(moves.Punch + moves.Kick > moves.JumpKick * 4);
  for (const name of ['Dash', 'JumpKick', 'Uppercut', 'Grab']) assert.ok(moves[name] > 5, name);
});

test('the final two commit to fighting instead of fleeing around an empty arena', () => {
  const w = new Match(8, 3), [a, b, c] = w.fighters;
  Object.assign(a, { x: 500, y: 400, personality: 'Cowardly', cooldown: 1 });
  Object.assign(b, { x: 600, y: 400 }); Object.assign(c, { x: 1000, y: 550 });
  a.think(STEP, w); assert.equal(a.intent, 'flee'); assert.ok(a.vx < 0);
  c.receiveHit(999, 0, 0, 0);
  a.think(STEP, w); assert.equal(a.intent, 'chase'); assert.ok(a.vx > 0);
});
