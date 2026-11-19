import test from 'node:test';
import assert from 'node:assert/strict';
import { Fighter, MOVES } from '../fighter.js?v=20261119-martial-motion';
import { computePose, projectPose } from '../pose.js?v=20261119-martial-motion';
import { STYLE_NAMES, STYLES } from '../styles.js?v=20261119-martial-motion';
import { seededRandom } from '../random.js?v=20261119-martial-motion';

function pose(style, name = STYLES[style].preferred, variant = 0) {
  const f = new Fighter(0, 0, 0, seededRandom(1)); f.style = style;
  f.attack = { name, variant, contactAt: MOVES[name].windup, elapsed: name === 'Grab' ? .55 : MOVES[name].windup, duration: MOVES[name].duration };
  return projectPose(computePose(f));
}
const landmarks = p => [p.hip, p.shoulder, p.head, p.main.tip, p.off.tip, p.front.tip, p.back.tip];
const difference = (a, b) => landmarks(a).reduce((sum, point, i) => sum + Math.hypot(point[0] - landmarks(b)[i][0], point[1] - landmarks(b)[i][1]), 0);

test('ordinary attacks have large style differences even before any signature unlocks', () => {
  for (let i = 0; i < STYLE_NAMES.length; i++) for (let j = i + 1; j < STYLE_NAMES.length; j++) {
    const a = STYLE_NAMES[i], b = STYLE_NAMES[j];
    assert.ok(difference(pose(a), pose(b)) > 70, `${a}/${b} primary silhouettes must be distinct`);
    assert.ok(difference(pose(a, 'Punch'), pose(b, 'Punch')) > 25, `${a}/${b} must not share a generic punch`);
  }
});
test('ninja sweeps, kickboxing body kicks and taekwondo high kicks occupy different heights', () => {
  const low = pose('Ninja', 'Kick'), middle = pose('Kickboxing', 'Kick'), high = pose('Taekwondo', 'Kick', 1);
  assert.ok(low.front.tip[1] > -12);
  assert.ok(middle.front.tip[1] < low.front.tip[1] - 20);
  assert.ok(high.front.tip[1] < middle.front.tip[1] - 40);
  assert.ok(high.front.tip[0] - high.head[0] > 80, 'high kick has a large, open silhouette');
  for (const p of [low, middle, high]) assert.ok(Math.abs(p.back.tip[1]) < .001);
});
test('boxing extends the strike while guarding the head; judo deeply lowers the throw base', () => {
  const punch = pose('Boxing', 'Punch'), crossed = pose('Boxing', 'Punch', 1), grappling = pose('Judo', 'Grab');
  assert.ok(punch.main.tip[0] > 65, 'body drive contributes to the punch silhouette');
  assert.ok(punch.off.tip[1] < punch.shoulder[1] - 20);
  assert.ok(crossed.off.tip[0] > crossed.main.tip[0] + 20);
  assert.ok(grappling.hip[1] > punch.hip[1] + 15);
});
test('upright turns preserve the hip and support foot instead of sliding or collapsing the whole body', () => {
  const f = new Fighter(0, 0, 0, seededRandom(1)); f.style = 'Taekwondo';
  f.attack = { name: 'Kick', variant: 1, contactAt: .18, duration: .46, elapsed: 0 };
  for (let i = 0; i < 60; i++) {
    f.attack.elapsed = .18 * i / 60;
    const authored = computePose(f), visual = projectPose(authored);
    assert.deepEqual(visual.hip, authored.hip); assert.deepEqual(visual.back.tip, authored.back.tip);
    assert.ok(Math.abs(visual.head[0] - visual.hip[0]) >= Math.abs(authored.head[0] - authored.hip[0]) * .71);
  }
});

test('defensive silhouettes retain low slips, compact shells and open grappling frames', () => {
  const defenses = kind => Object.fromEntries(STYLE_NAMES.map(style => {
    const f = new Fighter(0, 0, 0, seededRandom(1));
    Object.assign(f, { style, defense: { kind, elapsed: .15, duration: .3 } });
    return [style, computePose(f)];
  }));
  for (const kind of ['guard', 'dodge']) {
    const poses = defenses(kind);
    assert.equal(new Set(Object.values(poses).map(p => JSON.stringify(p))).size, 5);
    for (const p of Object.values(poses)) {
      assert.equal(p.rotation, 0);
      assert.ok(Math.abs(p.back.tip[1]) < .001 && Math.abs(p.front.tip[1]) < .001);
    }
  }
  const guards = defenses('guard');
  assert.ok(guards.Ninja.head[1] > guards.Boxing.head[1] + 15);
  assert.ok(guards.Judo.main.tip[0] > guards.Boxing.main.tip[0] + 15);
});
test('ground recoil visibly follows the push direction without a launch or added stun', () => {
  for (const style of STYLE_NAMES) {
    const react = vx => {
      const f = new Fighter(0, 0, 0, seededRandom(1)); f.style = style; f.facing = 1;
      f.receiveHit(1, vx, 0, 0); assert.equal(f.stun, .16); assert.equal(f.z, 0); assert.equal(f.vz, 0);
      f.stun = .1; return computePose(f);
    };
    const forward = react(80), backward = react(-80);
    assert.ok(forward.head[0] > backward.head[0] + 60);
    for (const p of [forward, backward]) assert.ok(Math.abs(p.front.tip[1]) < .001 && Math.abs(p.back.tip[1]) < .001);
  }
});
