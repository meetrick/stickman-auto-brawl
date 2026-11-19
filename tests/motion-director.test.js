import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js?v=20261119-headline';
import { MotionDirector, fighterScale } from '../motion-director.js?v=20261119-headline';
import { cinematicSample, rigPose } from '../cinematic-rig.js?v=20261119-headline';
import { sampleStudyActor, STUDY_DURATION } from '../motion-study.js?v=20261119-headline';
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

test('a contacting foot stays fixed in world space through a moving run phase', () => {
  for (const style of ['Boxing', 'Taekwondo']) {
    const f = new Match(12, 2, { styles: [style, style] }).fighters[0], director = new MotionDirector();
    Object.assign(f, { x: 400, y: 400, facing: 1, state: 'run' });
    let previous = null, lockedSamples = 0;
    for (let tick = 0; tick < 240; tick++) {
      f.x += 150 / 120; f.stridePhase += 150 / 120 * .075;
      const p = director.poseFor(f, tick / 120), scale = fighterScale(f);
      const feet = [p.front, p.back].map(leg => [f.x + leg.tip[0] * scale, f.y + leg.tip[1] * scale]);
      if (previous) for (let i = 0; i < 2; i++) if (previous.planted[i] && p.planted[i]) {
        assert.ok(dist(previous.feet[i], feet[i]) < 1e-6); lockedSamples++;
      }
      previous = { feet, planted: p.planted };
    }
    assert.ok(lockedSamples > 100, 'locking must cover real stance phases, not just one frame');
  }
});
test('the full scripted study has finite joint geometry, grounded supports and no damage side effects', () => {
  const world = new Match(12, 2, { styles: ['Boxing', 'Taekwondo'] }), before = structuredClone(world.fighters);
  const director = new MotionDirector(); let authoredContacts = 0;
  for (let tick = 0; tick < STUDY_DURATION * 120; tick++) for (const [i, base] of world.fighters.entries()) {
    const f = sampleStudyActor(base, i, tick / 120), sample = cinematicSample(f);
    assert.equal(f.z, 0);
    if (sample) {
      const raw = rigPose(sample.rig, sample.contacts);
      for (const arm of [raw.main, raw.off]) {
        assert.ok(Math.abs(dist(raw.shoulder, arm.joint) - 23) < 1e-6);
        assert.ok(Math.abs(dist(arm.joint, arm.tip) - 23) < 1e-6);
      }
      if (f.attack) authoredContacts++;
    }
    const p = director.poseFor(f, tick / 120, base);
    for (const point of [p.hip, p.shoulder, p.head, p.front.tip, p.back.tip]) assert.ok(point.every(Number.isFinite));
  }
  assert.ok(authoredContacts > 200); assert.deepEqual(structuredClone(world.fighters), before);
  assert.equal(world.stats.hits, 0); assert.equal(world.time, 0);
});
test('run-to-ready transition remains continuous and paused rendering does not drift', () => {
  const base = new Match(12, 2, { styles: ['Boxing', 'Taekwondo'] }).fighters[0], director = new MotionDirector();
  let previous;
  for (let tick = 210; tick < 280; tick++) {
    const time = tick / 120, f = sampleStudyActor(base, 0, time), p = director.poseFor(f, time, base);
    if (previous) assert.ok(dist(previous.head, p.head) < 8, 'braking should not snap the head');
    assert.deepEqual(director.poseFor(f, time, base), p);
    previous = p;
  }
});
test('rendered and unrendered matches have identical attacks, RNG and standings; KO poses stay inert', () => {
  const a = new Match(72, 8, { styles: ['Boxing', 'Taekwondo'] }), b = new Match(72, 8, { styles: ['Boxing', 'Taekwondo'] });
  const director = new MotionDirector();
  while (!a.finished) {
    a.update(); b.update();
    for (const f of a.fighters) director.poseFor(f, a.time);
  }
  assert.deepEqual(a.fighters, b.fighters); assert.deepEqual(a.stats, b.stats); assert.deepEqual(a.standings, b.standings); assert.equal(a.rng(), b.rng());
  for (const f of a.fighters.filter(f => !f.alive)) {
    const p = director.poseFor(f, a.time); assert.deepEqual(director.poseFor(f, a.time + 10), p);
  }
});
