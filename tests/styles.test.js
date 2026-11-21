import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, STEP } from '../app.js?v=20261121-name-teams';
import { Fighter } from '../fighter.js?v=20261121-name-teams';
import { STYLE_NAMES } from '../styles.js?v=20261121-name-teams';
import { seededRandom } from '../random.js?v=20261121-name-teams';

test('all five disciplines roll deterministically; explicit selections do not change other spawn stats', () => {
  const seen = new Set();
  for (let seed = 0; seed < 100; seed++) {
    const a = new Fighter(0, 0, 0, seededRandom(seed)), b = new Fighter(0, 0, 0, seededRandom(seed));
    assert.equal(a.style, b.style); seen.add(a.style);
  }
  assert.deepEqual([...seen].sort(), [...STYLE_NAMES].sort());
  const random = new Match(12, STYLE_NAMES.length), fixed = new Match(12, STYLE_NAMES.length, { styles: STYLE_NAMES });
  assert.deepEqual(fixed.fighters.map(f => f.style), STYLE_NAMES);
  assert.deepEqual(fixed.fighters.map(({style, ...rest}) => rest), random.fighters.map(({style, ...rest}) => rest));
});
test('boxing AI never selects kicks or grabs while judo favors throws and kickboxing favors kicks', () => {
  const counts = {};
  for (const style of STYLE_NAMES) {
    counts[style] = {};
    for (let seed = 0; seed < 300; seed++) {
      const w = new Match(seed, 2, { styles: [style, style] }), [a, b] = w.fighters;
      Object.assign(a, { x: 500, y: 400, cooldown: 0, personality: 'Aggressive' });
      Object.assign(b, { x: 540, y: 400, readyAt: 100 });
      a.think(STEP, w); assert.ok(a.attack);
      counts[style][a.attack.name] = (counts[style][a.attack.name] || 0) + 1;
    }
  }
  for (const name of ['Kick', 'JumpKick', 'Grab']) assert.equal(counts.Boxing[name] || 0, 0);
  assert.ok(counts.Boxing.Punch > 150); assert.ok(counts.Judo.Grab > 150);
  assert.ok(counts.Kickboxing.Kick > 100); assert.ok(counts.Ninja.Kick > 100);
});
test('connected punch combinations end with the discipline signature, and interruption cancels them', () => {
  for (const [style, expected] of Object.entries({ Ninja: ['Punch', 'Kick', 'Dash'], Boxing: ['Punch', 'Punch', 'Uppercut'], Judo: ['Punch', 'Grab'], Kickboxing: ['Punch', 'Punch', 'Kick'] })) {
    const w = new Match(5, 2, { styles: [style, style] }), [a, b] = w.fighters;
    Object.assign(a, { x: 500, y: 400, cooldown: 0, personality: 'Aggressive' });
    Object.assign(b, { x: 540, y: 400, readyAt: 100, hp: 500, maxHp: 500 });
    w.rng = () => .5; a.startAttack('Punch', b);
    for (let i = 0; i < 140; i++) w.update();
    assert.deepEqual(w.events.filter(e => e.type === 'hit').map(e => e.move).reverse(), expected, style);
    a.followUp = 'Punch'; a.footworkUntil = 10; a.receiveHit(1, -80, 0, 0);
    assert.equal(a.followUp, null); assert.equal(a.footworkUntil, 0);
  }
});
test('ninja side-steps farther than boxing while maintaining grounded footwork and facing', () => {
  const steps = {};
  for (const style of ['Ninja', 'Boxing']) {
    const w = new Match(4, 2, { styles: [style, style] }), [a, b] = w.fighters;
    Object.assign(a, { x: 500, y: 400, cooldown: 1, footworkUntil: 2, flankSide: 1, decisionAt: 2 });
    Object.assign(b, { x: 600, y: 400 }); w.time = 1;
    a.think(STEP, w); assert.equal(a.intent, 'footwork'); assert.equal(a.facing, 1); assert.equal(a.vz, 0);
    steps[style] = Math.abs(a.vy / a.vx);
  }
  assert.ok(steps.Ninja > steps.Boxing);
});
test('every discipline finishes complete rounds with valid rankings and no weapons or poles', () => {
  for (const style of STYLE_NAMES) {
    const a = new Match(9, 8, { styles: Array(8).fill(style) }), b = new Match(9, 8, { styles: Array(8).fill(style) });
    for (let i = 0; i < 10810 && !a.finished; i++) { a.update(); b.update(); }
    assert.equal(a.finished, true); assert.equal(a.standings.length, 8);
    assert.deepEqual(a.eliminations, b.eliminations); assert.equal(a.arena, null);
    assert.ok(a.fighters.every(f => f.weapon === 'None' && Number.isFinite(f.x)));
  }
});

test('style preferences validate, migrate older settings and preserve hidden participant choices', async () => {
  const {normalizePreferences, savePreferences, loadPreferences} = await import('../settings.js?v=20261121-name-teams');
  const old = normalizePreferences({names:['봄']}); assert.ok(old.styles.every(s => s === 'Random'));
  const p = normalizePreferences({count:2, styles:['Boxing','<bad>','Judo',...Array(9).fill('Ninja')]});
  assert.deepEqual(p.styles.slice(0,3), ['Boxing','Random','Judo']); assert.equal(p.styles.length, 24);
  let saved; const storage = {setItem:(_,value)=>{saved=value;}, getItem:()=>saved};
  assert.equal(savePreferences(storage,p),true); assert.equal(loadPreferences(storage).styles[2],'Judo');
});
test('replay with resolved style choices reproduces random and configured style rounds', () => {
  for (const styles of [[], ['Boxing','Ninja','Random','Judo']]) {
    const a = new Match(12,4,{styles});
    const b = new Match(a.seed,4,{styles:a.fighters.map(f=>f.style)});
    for(let i=0;i<1600;i++){a.update();b.update();}
    assert.deepEqual(a.fighters,b.fighters); assert.deepEqual(a.eliminations,b.eliminations);
  }
});
