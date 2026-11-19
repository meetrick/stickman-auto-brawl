import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js?v=20261119-tactical-ai';
import { computePose, projectPose } from '../pose.js?v=20261119-tactical-ai';
import { STYLES, STYLE_NAMES } from '../styles.js?v=20261119-tactical-ai';

function signature(style) {
  const w = new Match(12, 2, { styles: [style, style] }), [f, target] = w.fighters;
  Object.assign(f, { x: 500, y: 400, age: 2, cooldown: 0 });
  Object.assign(target, { x: 540, y: 400, readyAt: 100 });
  const name = STYLES[style].signature.move; f.attackVariants[name] = 2;
  f.startAttack(name, target); return { w, f, target };
}
test('turning kicks complete an upright turn by contact with a fixed grounded support foot', () => {
  for (const style of ['Ninja', 'Kickboxing', 'Taekwondo']) {
    const { f } = signature(style);
    let turnedAway = false;
    for (let i = 0; i <= 60; i++) {
      f.attack.elapsed = f.attack.contactAt * i / 60;
      const authored = computePose(f), projected = projectPose(authored);
      assert.equal(authored.rotation, 0, 'yaw must not become a somersault');
      assert.equal(f.z, 0); assert.equal(f.vz, 0);
      assert.ok(Math.abs(projected.back.tip[1]) < .001);
      assert.deepEqual(projected.back.tip, authored.back.tip, 'support foot is the projection pivot');
      assert.deepEqual(projected.head[1], authored.head[1], 'a turn must not lift the head');
      if (Math.cos(authored.yaw) < -.8) turnedAway = true;
    }
    const contact = computePose(f);
    assert.ok(turnedAway); assert.ok(Math.abs(contact.yaw - Math.PI * 2) < 1e-9);
    assert.ok(projectPose(contact).front.tip[0] > projectPose(contact).hip[0], 'kick faces the opponent at contact');
  }
});
test('punch loading reverses torso twist into contact without a full turn or jump', () => {
  const { f } = signature('Boxing');
  f.attack.elapsed = f.attack.contactAt * .65; const loaded = computePose(f);
  f.attack.elapsed = f.attack.contactAt; const contact = computePose(f);
  assert.ok(loaded.torsoYaw < -.5); assert.ok(contact.torsoYaw > .5);
  assert.equal(loaded.yaw, 0); assert.equal(contact.yaw, 0); assert.equal(f.z, 0);
  f.attack.elapsed = f.attack.duration;
  assert.equal(computePose(f).torsoYaw, 0);
});
test('projected choreography stays finite, leaves vertical coordinates intact and cannot alter combat', () => {
  for (const style of STYLE_NAMES) {
    const { w, f } = signature(style), reference = signature(style).w;
    for (let i = 0; i < 160; i++) {
      w.update(); reference.update();
      for (const fighter of w.fighters) {
        const p = computePose(fighter), visual = projectPose(p);
        for (const key of ['hip', 'shoulder', 'head']) {
          assert.ok(visual[key].every(Number.isFinite)); assert.equal(visual[key][1], p[key][1]);
        }
        for (const key of ['main', 'off', 'front', 'back']) for (const point of ['joint', 'tip']) {
          assert.ok(visual[key][point].every(Number.isFinite)); assert.equal(visual[key][point][1], p[key][point][1]);
        }
      }
    }
    assert.deepEqual(w.fighters, reference.fighters); assert.deepEqual(w.stats, reference.stats);
    assert.equal(f.z, 0);
  }
});
test('interrupted and defeated fighters cannot retain an attack turn', () => {
  const { w, f } = signature('Taekwondo'); f.attack.elapsed = f.attack.contactAt * .7;
  assert.notEqual(computePose(f).yaw, 0);
  f.receiveHit(1, 30, 0, 0); assert.equal(computePose(f).yaw, 0);
  f.hp = 0; f.settleDeath(w); const settled = projectPose(computePose(f));
  for (let i = 0; i < 120; i++) w.update();
  assert.deepEqual(projectPose(computePose(f)), settled);
});
