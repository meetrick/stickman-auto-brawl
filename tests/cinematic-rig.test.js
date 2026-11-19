import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js?v=20261119-cinema';
import { cinematicSample, rigPose, READY_RIGS } from '../cinematic-rig.js?v=20261119-cinema';
import { STYLES } from '../styles.js?v=20261119-cinema';
const length = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

test('authored rigs preserve separate spine segments and all limb lengths through a complete run', () => {
  for (const style of Object.keys(READY_RIGS)) {
    const f = new Match(12, 2, { styles: [style, style] }).fighters[0];
    f.state = 'run';
    for (let i = 0; i <= 240; i++) {
      f.stridePhase = i / 240 * Math.PI * 2;
      const sample = cinematicSample(f), p = rigPose(sample.rig, sample.contacts);
      assert.ok(Math.abs(length(p.hip, p.waist) - 18) < 1e-6);
      assert.ok(Math.abs(length(p.waist, p.shoulder) - 21) < 1e-6);
      for (const arm of [p.main, p.off]) {
        assert.ok(Math.abs(length(p.shoulder, arm.joint) - 23) < 1e-6);
        assert.ok(Math.abs(length(arm.joint, arm.tip) - 23) < 1e-6);
      }
      for (const [j, leg] of [p.front, p.back].entries()) {
        assert.ok(Math.abs(length(p.hip, leg.joint) - 29) < 1e-6);
        assert.ok(Math.abs(length(leg.joint, leg.tip) - 29) < 1e-6);
        if (sample.contacts[j]) assert.ok(Math.abs(leg.tip[1]) < 1e-6);
      }
    }
  }
});
test('all disciplines and legal attacks have valid authored contact and recovery poses', () => {
  for (const [style, profile] of Object.entries(STYLES)) for (const [name, weight] of Object.entries(profile.weights)) {
    if (!weight) continue;
    for (const variant of [0, 1]) {
      const [f, target] = new Match(12, 2, { styles: [style, style] }).fighters;
      f.cooldown = 0; f.attackVariants[name] = variant; f.startAttack(name, target);
      for (let i = 0; i <= 60; i++) {
        f.attack.elapsed = f.attack.duration * i / 60;
        const sample = cinematicSample(f); assert.ok(sample, `${style}/${name}`);
        const p = rigPose(sample.rig, sample.contacts);
        for (const arm of [p.main, p.off]) {
          assert.ok(Math.abs(length(p.shoulder, arm.joint) - 23) < 1e-6);
          assert.ok(Math.abs(length(arm.joint, arm.tip) - 23) < 1e-6);
        }
        for (const leg of [p.front, p.back]) {
          assert.ok(Math.abs(length(p.hip, leg.joint) - 29) < 1e-6);
          assert.ok(Math.abs(length(leg.joint, leg.tip) - 29) < 1e-6);
          assert.ok(leg.tip[1] <= 1e-5, 'a foot must not penetrate the floor');
        }
      }
    }
  }
});
test('new rigs never override held, airborne, stunned or defeated states and consume no RNG', () => {
  const a = new Match(12, 2, { styles: ['Boxing', 'Taekwondo'] }), b = new Match(12, 2, { styles: ['Boxing', 'Taekwondo'] });
  for (const f of a.fighters) {
    const before = structuredClone(f); cinematicSample(f); assert.deepEqual(structuredClone(f), before);
    for (const change of [{ hp: 0 }, { z: 10 }, { heldBy: 1 }, { stun: .1 }]) {
      const copy = Object.assign(Object.create(Object.getPrototypeOf(f)), f, change);
      assert.equal(cinematicSample(copy), null);
    }
  }
  assert.equal(a.rng(), b.rng());
});
test('guarded walking keeps a lower foot lift than a full run', () => {
  const f = new Match(12, 2, { styles: ['Boxing', 'Taekwondo'] }).fighters[0];
  f.stridePhase = .125 * Math.PI * 2;
  f.state = 'walk'; const walk = cinematicSample(f), wp = rigPose(walk.rig, walk.contacts);
  f.state = 'run'; const run = cinematicSample(f), rp = rigPose(run.rig, run.contacts);
  assert.equal(walk.clip, 'walk'); assert.equal(run.clip, 'run');
  assert.ok(rp.back.tip[1] < wp.back.tip[1] - 5);
});
