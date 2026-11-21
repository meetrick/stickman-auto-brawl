import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, STEP } from '../app.js?v=20261121-name-teams';
import { MOVES } from '../fighter.js?v=20261121-name-teams';
import { chooseOpponent } from '../brain.js?v=20261121-name-teams';
import { areEnemies } from '../teams.js?v=20261121-name-teams';
import { resolveDominoes } from '../collisions.js?v=20261121-name-teams';

function quiet(names = ['민수', '민수', 'Alex', 'alex']) {
  const w = new Match(12, names.length, { names });
  w.fighters.forEach(f => { f.readyAt = 100; f.cooldown = 0; }); return w;
}
test('normalized Korean and English names group teams, sharing colors but retaining IDs', () => {
  const w = quiet([' 민수 ', '민수'.normalize('NFD'), 'Alex', 'alex']);
  assert.equal(w.teams.length, 2);
  assert.deepEqual(w.fighters.map(f => f.teamId), [0, 0, 1, 1]);
  assert.equal(w.fighters[0].color, w.fighters[1].color);
  assert.notEqual(w.fighters[0].color, w.fighters[2].color);
  assert.equal(w.fighters[1].name, '민수'); assert.equal(w.fighters[3].name, 'alex');
  assert.equal(new Match(12, 24).teams.length, 24);
});
test('all direct moves and defenses reject allies before consuming combat RNG', () => {
  const w = quiet(), [a, ally] = w.fighters; a.weapon = 'Sword';
  w.rng = () => { throw new Error('friendly contact consumed RNG'); };
  for (const move of Object.keys(MOVES)) {
    assert.equal(a.startAttack(move, ally), false); assert.equal(a.hit(ally, w, move), false);
  }
  assert.equal(a.startDefense('guard', ally, w), false);
  assert.equal(a.startDefense('dodge', ally, w), false);
  assert.equal(ally.hp, ally.maxHp); assert.equal(w.stats.hits, 0);
});
test('an active attack skips a closer ally; a stale friendly grab cannot capture', () => {
  const w = quiet(), [a, ally, enemy] = w.fighters;
  Object.assign(a, { x: 500, y: 400 }); Object.assign(ally, { x: 520, y: 400 }); Object.assign(enemy, { x: 540, y: 400 });
  w.fighters[3].x = 1000; w.rng = () => .5;
  assert.ok(a.startAttack('Punch', enemy));
  a.updateAttack(a.getMove('Punch').windup + .001, w);
  assert.equal(ally.hp, ally.maxHp); assert.ok(enemy.hp < enemy.maxHp);
  a.attack = null; a.cooldown = 0; assert.ok(a.startAttack('Grab', enemy));
  a.attack.targetId = ally.id; a.updateAttack(.3, w); assert.equal(ally.heldBy, null);
});
test('launched bodies can damage allies, including bodies thrown by an ally', () => {
  const w = quiet(['A', 'A', 'B', 'B']), [thrower, ally, body, next] = w.fighters;
  Object.assign(thrower, { x: 400, y: 400 }); Object.assign(body, { x: 430, y: 400 });
  Object.assign(ally, { x: 500, y: 400 }); Object.assign(next, { x: 900, y: 550 });
  w.rng = () => .5; assert.ok(thrower.hit(body, w, 'Grab'));
  body.previous = { x: 430, y: 400, z: 25 }; body.x = ally.x; body.z = 30;
  resolveDominoes(w); assert.ok(ally.hp < ally.maxHp); assert.ok(ally.vz > 0);
  // The launched ally can also collide with their own teammate.
  ally.previous = { x: 500, y: 400, z: 25 }; ally.x = thrower.x; ally.z = 30;
  resolveDominoes(w); assert.ok(thrower.hp < thrower.maxHp); assert.equal(w.stats.dominoes, 2);
});
test('nearby fighters help threatened allies while preserving real counter commitments', () => {
  const w = quiet(['A', 'A', 'B', 'C']), [f, ally, nearest, threat] = w.fighters;
  Object.assign(f, { x: 500, y: 400, personality: 'Aggressive' });
  Object.assign(ally, { x: 670, y: 400 }); Object.assign(nearest, { x: 550, y: 400 });
  Object.assign(threat, { x: 700, y: 400, attack: { targetId: ally.id } });
  assert.equal(chooseOpponent(f, [nearest, threat], w, nearest), threat);
  f.counterTargetId = nearest.id; f.counterUntil = 1;
  assert.equal(chooseOpponent(f, [nearest, threat], w, threat), nearest);
  f.counterUntil = 0; f.personality = 'Cowardly'; f.hp = 10;
  assert.equal(chooseOpponent(f, [nearest, threat], w, nearest), nearest);
});
test('team elimination waits for the last member; defeated winners retain their individual KO', () => {
  const w = quiet(), [a, ally, b, other] = w.fighters;
  a.receiveHit(999, 0, 0, 0); w.update(); assert.equal(w.teamEliminations.length, 0);
  b.receiveHit(999, 0, 0, 0); other.receiveHit(999, 0, 0, 0); w.update();
  assert.equal(w.winnerTeam.id, ally.teamId); assert.equal(w.winner, ally);
  assert.deepEqual(w.teamStandings.map(e => [e.teamId, e.rank]), [[0, 1], [1, 2]]);
  assert.equal(w.eliminations[0].fighterId, a.id); assert.equal(w.eliminations[0].rank, 4);
});
test('a surviving team wins with multiple fighters; all same names finish without fighting', () => {
  const w = quiet(); w.fighters.slice(2).forEach(f => f.receiveHit(999, 0, 0, 0)); w.update();
  assert.equal(w.winner, null); assert.equal(w.winnerTeam.id, 0); assert.equal(w.timedOut, false);
  const one = quiet(['ONE', 'one', ' ONE ', 'one']); one.update();
  assert.ok(one.finished && one.noOpponents); assert.equal(one.stats.hits, 0); assert.equal(one.eliminations.length, 0);
});
test('simultaneous team defeats tie; a timeout does not fabricate a team winner', () => {
  const w = quiet(['A', 'A', 'B', 'C']); w.fighters.slice(2).forEach(f => f.receiveHit(999, 0, 0, 0)); w.update();
  assert.deepEqual(w.teamEliminations.map(e => [e.rank, e.tied]), [[2, true], [2, true]]);
  const timed = quiet(); timed.time = 90 - STEP; timed.update();
  assert.ok(timed.timedOut); assert.equal(timed.winnerTeam, null); assert.ok(timed.teamStandings.every(e => e.tied && e.rank === 1));
});
test('seeded team matches finish deterministically and every direct hit targets an enemy', () => {
  for (const count of [4, 12, 24]) {
    const names = Array.from({ length: count }, (_, i) => `TEAM ${i % 3}`);
    const a = new Match(72, count, { names }), b = new Match(72, count, { names });
    for (let tick = 0; tick < 10801 && !a.finished; tick++) {
      a.update(); b.update();
      for (const event of a.events.filter(e => e.type === 'hit')) assert.ok(areEnemies(a.fighters[event.source], a.fighters[event.fighter]));
    }
    assert.ok(a.finished); assert.deepEqual(a.teamStandings, b.teamStandings); assert.deepEqual(a.fighters, b.fighters);
  }
});
