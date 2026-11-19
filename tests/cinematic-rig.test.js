import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js?v=20261119-headline';
import { cinematicSample, rigPose, READY_RIGS } from '../cinematic-rig.js?v=20261119-headline';
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
