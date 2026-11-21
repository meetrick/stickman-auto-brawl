import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, STEP } from '../app.js?v=20261121-name-teams';
import { chooseOpponent, retreatGoal, planBehavior, PERSONALITIES } from '../brain.js?v=20261121-name-teams';

function setup(role = 'Aggressive') {
  const w = new Match(12, 3, { styles: Array(3).fill('Taekwondo') }), [f, a, b] = w.fighters;
  Object.assign(f, { x: 500, y: 400, personality: role, cooldown: 0 });
  Object.assign(a, { x: 600, y: 400, readyAt: 100 });
  Object.assign(b, { x: 1000, y: 550, readyAt: 100 });
  return { w, f, a, b };
}
test('the same martial art visibly presses, flees or waits according to personality', () => {
  const intents = {};
  for (const role of ['Aggressive', 'Cowardly', 'Counterfighter']) {
    const { w, f } = setup(role); f.think(STEP, w); intents[role] = f.intent;
    assert.equal(f.style, 'Taekwondo'); assert.equal(f.z, 0);
    if (role === 'Aggressive') assert.ok(f.vx > 0);
    if (role === 'Cowardly') assert.ok(f.vx < 0);
  }
  assert.deepEqual(intents, { Aggressive: 'chase', Cowardly: 'flee', Counterfighter: 'watch' });
});
test('opportunists prefer a visible vulnerable occupied opponent and invalidate dead targets', () => {
  const { w, f, a, b } = setup('Opportunist');
  Object.assign(a, { x: 580, hp: 130, maxHp: 130 });
  Object.assign(b, { x: 650, y: 400, hp: 15, maxHp: 130, attack: { name: 'Kick', targetId: a.id } });
  assert.equal(chooseOpponent(f, [a, b], w, a), b);
  assert.equal(chooseOpponent(f, [a], w, a), a);
  f.personality = 'Aggressive'; assert.equal(chooseOpponent(f, [a, b], w, b), a);
});
test('pressure fighters briefly retaliate against the opponent who actually hit them', () => {
  const { w, f, a, b } = setup('Brawler'); b.x = 650; b.y = 400; w.rng = () => .5;
  b.hit(f, w, 'Punch');
  assert.equal(chooseOpponent(f, [a, b], w, a), b);
  w.time = 2.1; assert.equal(chooseOpponent(f, [a, b], w, a), a);
});
test('patient fighters commit after a bounded wait, and immediately use visible recovery openings', () => {
  for (const role of ['Opportunist', 'Counterfighter']) {
    const { w, f, a, b } = setup(role);
    assert.equal(planBehavior(f, a, [a, b], w).mode, 'watch');
    w.time = .7; assert.equal(planBehavior(f, a, [a, b], w), null);
    assert.ok(f.tacticalCommitUntil > w.time);
    w.time = 3; a.attack = { name: 'Kick', elapsed: .4, resolved: true };
    assert.equal(planBehavior(f, a, [a, b], w), null);
    assert.ok(f.tacticalCommitUntil > 3);
  }
});
test('retreat routes avoid other opponents and stay on the arena floor', () => {
  const { w, f, a, b } = setup('Cowardly'); b.x = 350; b.y = 400;
  const goal = retreatGoal(f, a, [a, b], w.bounds);
  assert.ok(Math.hypot(goal.x - b.x, goal.y - b.y) > 90);
  assert.ok(goal.x >= w.bounds.left + 22 && goal.x <= w.bounds.right - 22);
  assert.ok(goal.y >= w.bounds.top + 22 && goal.y <= w.bounds.bottom - 22);
});
test('injured survival personalities seek safe armed potions and cancel consumed goals', () => {
  const { w, f, a, b } = setup('Cowardly'); f.hp = 30; f.maxHp = 100; w.time = 1;
  const item = w.hazards.spawn(w, 'potion', { x: 420, y: 350 }); item.armAt = 0;
  const plan = planBehavior(f, a, [a, b], w); assert.equal(plan.mode, 'heal'); assert.equal(plan.itemId, item.id);
  w.hazards.items = []; assert.equal(planBehavior(f, a, [a, b], w), null);
});
test('real counters, combos and final duels override patient and retreat behavior', () => {
  for (const role of PERSONALITIES) {
    const { w, f, a, b } = setup(role);
    f.counterTargetId = a.id; f.counterUntil = 1;
    assert.equal(planBehavior(f, a, [a, b], w), null);
    f.counterTargetId = null; f.followUp = 'Kick'; f.followUpUntil = 1;
    assert.equal(planBehavior(f, a, [a, b], w), null);
    f.followUp = null; assert.equal(planBehavior(f, a, [a], w), null);
  }
});
test('crowded emergency withdrawals are short and followed by a commitment to re-engage', () => {
  for (const role of ['Trickster', 'Cowardly']) {
  const { w, f, a, b } = setup(role); f.hp = 15; b.x = 520; b.y = 480;
  assert.equal(planBehavior(f, a, [a, b], w).mode, 'withdraw');
  w.time = .8; assert.equal(planBehavior(f, a, [a, b], w), null);
  assert.ok(f.tacticalCommitUntil > w.time);
  assert.ok(f.courageUntil > w.time, 'legacy cowardly retreat cannot bypass the engagement window');
  }
});
test('brain decisions use no random rolls and seeded matches retain complete deterministic rankings', () => {
  const { w, f, a, b } = setup('Counterfighter'), reference = new Match(12, 3, { styles: Array(3).fill('Taekwondo') });
  chooseOpponent(f, [a, b], w, a); planBehavior(f, a, [a, b], w);
  assert.equal(w.rng(), reference.rng());
  for (const count of [8, 24]) {
    const x = new Match(72, count), y = new Match(72, count);
    while (!x.finished) { x.update(); y.update(); }
    assert.deepEqual(x.fighters, y.fighters); assert.deepEqual(x.standings, y.standings);
    assert.equal(x.standings.length, count);
  }
});
