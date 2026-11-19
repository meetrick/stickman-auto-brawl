import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, STEP } from '../app.js?v=20261119-cinema';

test('large matches spawn in two spaced rows within floor bounds', () => {
  for (const count of [13, 16, 23, 24]) {
    const w = new Match(11, count);
    for (const a of w.fighters) for (const b of w.fighters) if (a !== b) {
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 79);
      assert.ok(a.x >= w.bounds.left && a.x <= w.bounds.right && a.y >= w.bounds.top && a.y <= w.bounds.bottom);
    }
  }
});
test('approach slots spread attackers without consuming RNG or putting grabs out of reach', () => {
  const w = new Match(12), reference = new Match(12);
  w.fighters.forEach((f, i) => { f.x = 450 + i * 10; f.y = 400; f.style = 'Judo'; });
  w.navigation.plan(w);
  assert.equal(w.rng(), reference.rng());
  const goals = [...w.navigation.plans.values()].map(p => p.goal);
  assert.ok(new Set(goals.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)).size >= 6);
  for (const [id, p] of w.navigation.plans) {
    const target = w.fighters[p.targetId];
    assert.notEqual(id, target.id);
    assert.ok(Math.hypot(p.goal.x - target.x, p.goal.y - target.y) <= 55);
  }
  const duel = new Match(12, 2); duel.navigation.plan(duel); assert.equal(duel.navigation.plans.size, 0);
});
test('gentle separation resolves coincident feet and preserves held, airborne, attacking and dead bodies', () => {
  const w = new Match(4, 8);
  w.fighters.forEach(f => { f.x = 600; f.y = 400; f.readyAt = 100; });
  const [held, airborne, dead, attacking, guarding, recoil] = w.fighters;
  held.heldBy = 7; airborne.z = 30; airborne.vz = 100;
  dead.hp = 0; dead.settleDeath(w); attacking.attack = { name: 'Dash' };
  guarding.defense = { kind: 'dodge' }; recoil.collateralActive = true;
  const frozen = w.fighters.slice(0, 6).map(f => ({ x: f.x, y: f.y }));
  for (let tick = 0; tick < 120; tick++) w.navigation.separate(w, STEP);
  assert.deepEqual(w.fighters.slice(0, 6).map(f => ({ x: f.x, y: f.y })), frozen);
  assert.ok(Math.hypot(w.fighters[6].x - w.fighters[7].x, w.fighters[6].y - w.fighters[7].y) > 31);
});
test('24-fighter rounds replay identically with complete rankings and natural combat', () => {
  let grabs = 0;
  for (const seed of [1, 12, 72, 987]) {
    const a = new Match(seed, 24), b = new Match(seed, 24);
    while (!a.finished) { a.update(); b.update(); }
    assert.deepEqual(a.fighters, b.fighters); assert.deepEqual(a.standings, b.standings);
    assert.equal(a.standings.length, 24); assert.equal(new Set(a.standings.map(e => e.fighterId)).size, 24);
    assert.ok(a.stats.hits > 50); grabs += a.stats.moves.Grab;
    for (const f of a.fighters) assert.ok(Number.isFinite(f.x) && Number.isFinite(f.y) && f.hp >= 0);
  }
  assert.ok(grabs > 0, 'spacing must retain natural close-range throws across rounds');
});
test('crowd navigation reduces sustained foot overlap while retaining attack activity', () => {
  const sample = enabled => {
    let overlaps = 0, pairs = 0, hits = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const w = new Match(seed, 24);
      if (!enabled) w.navigation = { plan() {}, separate() {}, steer() {}, targetFor() {}, goalFor: (_, target) => target };
      let tick = 0;
      while (!w.finished) {
        w.update(); if (++tick % 24) continue;
        const a = w.fighters.filter(f => f.alive && f.z === 0 && f.heldBy == null);
        for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) {
          pairs++; if (Math.hypot(a[i].x - a[j].x, a[i].y - a[j].y) < 24) overlaps++;
        }
      }
      hits += w.stats.hits;
    }
    return { ratio: overlaps / pairs, hits };
  };
  const before = sample(false), after = sample(true);
  assert.ok(after.ratio < before.ratio * .8, `${before.ratio} -> ${after.ratio}`);
  assert.ok(after.hits > before.hits * .8);
});
