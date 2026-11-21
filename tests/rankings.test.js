import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, STEP } from '../app.js?v=20261121-name-teams';

function quiet(count = 4) {
  const w = new Match(12, count);
  for (const f of w.fighters) f.readyAt = 100;
  return w;
}
test('every normal and demo match is unarmed with no poles or walls', () => {
  for (const count of [2, 8, 12]) for (const showcase of [false, true]) {
    const w = new Match(12, count, { showcase });
    assert.equal(w.arena, null);
    for (let tick = 0; tick < 1200 && !w.finished; tick++) w.update();
    assert.ok(w.fighters.every(f => f.weapon === 'None'));
    assert.equal(w.stats.moves?.WeaponStrike || 0, 0); assert.equal(w.stats.barHits, 0);
  }
});
test('KO order is recorded at defeat, before the body lands, once per fighter', () => {
  const w = quiet(), [a, b, c, d] = w.fighters;
  a.receiveHit(999, 400, 0, 400); w.update();
  assert.ok(a.z > 0); assert.equal(w.eliminations.length, 1);
  assert.deepEqual(w.eliminations[0], { fighterId: a.id, time: STEP, order: 1, rank: 4, tied: false });
  for (let i = 0; i < 100; i++) w.update();
  assert.equal(w.eliminations.length, 1);
  b.receiveHit(999, 0, 0, 0); w.update(); c.receiveHit(999, 0, 0, 0); w.update();
  assert.equal(w.winner, d);
  assert.deepEqual(w.standings.map(r => [r.fighterId, r.rank]), [[d.id, 1], [c.id, 2], [b.id, 3], [a.id, 4]]);
  assert.ok(w.eliminations[0].time < w.eliminations[1].time);
  const result = structuredClone(w.eliminations);
  for (let i = 0; i < 20; i++) w.update();
  assert.deepEqual(w.eliminations, result);
});
test('simultaneous knockouts share a place and elimination order regardless of participant ID', () => {
  const w = quiet(5), [a, b, c, d, e] = w.fighters;
  c.receiveHit(999, 0, 0, 0); a.receiveHit(999, 0, 0, 0); w.update();
  assert.deepEqual(w.eliminations.map(r => [r.rank, r.order, r.tied]), [[4, 1, true], [4, 1, true]]);
  b.receiveHit(999, 0, 0, 0); w.update();
  assert.equal(w.eliminations[2].rank, 3); assert.equal(w.eliminations[2].order, 3);
  d.receiveHit(999, 0, 0, 0); e.receiveHit(999, 0, 0, 0); w.update();
  assert.equal(w.finished, true); assert.equal(w.winner, null); assert.equal(w.timedOut, false);
  assert.deepEqual(w.standings.map(r => r.rank), [1, 1, 3, 4, 4]);
});
test('timeout never fabricates a KO or breaks a surviving tie using HP', () => {
  const w = quiet(); w.fighters[0].hp = 1; w.time = 90 - STEP / 2; w.update();
  assert.equal(w.timedOut, true); assert.equal(w.winner, null); assert.equal(w.eliminations.length, 0);
  assert.ok(w.standings.every(r => r.rank === 1 && r.tied && r.time === null));
  const next = new Match(w.seed, 4); assert.deepEqual(next.eliminations, []);
  assert.ok(next.standings.every(r => r.rank === null));
});
test('rankings reproduce across seeded full rounds and never lose entries to the combat event cap', () => {
  for (const count of [2, 8, 12]) {
    const a = new Match(9, count), b = new Match(9, count);
    for (let tick = 0; tick < 10810 && !a.finished; tick++) { a.update(); b.update(); }
    assert.equal(a.finished, true); assert.deepEqual(a.eliminations, b.eliminations);
    assert.deepEqual(a.standings, b.standings); assert.equal(a.standings.length, count);
    assert.equal(new Set(a.standings.map(r => r.fighterId)).size, count);
    for (let i = 0; i < 80; i++) a.emit('hit', a.fighters[0], { text: 'PUNCH!' });
    assert.equal(a.events.length, 60); assert.deepEqual(a.eliminations, b.eliminations);
  }
});
