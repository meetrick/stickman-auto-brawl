import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, STEP } from '../app.js';
import { Fighter, MOVES, GAITS } from '../fighter.js';
import { seededRandom } from '../random.js';
import { computePose } from '../pose.js';
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
test('keyframed attacks preserve limb lengths and have distinct evolving silhouettes', () => {
  const f = new Fighter(0, 400, 400, seededRandom(1)), strikes = new Set();
  for (const name of Object.keys(MOVES)) {
    const poses = new Set();
    for (let i = 0; i <= 40; i++) {
      f.attack = { name, duration: MOVES[name].duration, elapsed: MOVES[name].duration * i / 40 };
      const p = computePose(f); poses.add(JSON.stringify(p));
      for (const arm of [p.main, p.off]) {
        assert.ok(Math.abs(distance(p.shoulder, arm.joint) - 23) < 1e-6);
        assert.ok(Math.abs(distance(arm.joint, arm.tip) - 23) < 1e-6);
      }
      for (const leg of [p.front, p.back]) {
        assert.ok(Math.abs(distance(p.hip, leg.joint) - 29) < 1e-6);
        assert.ok(Math.abs(distance(leg.joint, leg.tip) - 29) < 1e-6);
      }
      if (i === 20) strikes.add(JSON.stringify(p));
    }
    assert.ok(poses.size > 30, `${name} is continuously animated`);
  }
  assert.equal(strikes.size, Object.keys(MOVES).length);
});
test('run cycle has a wider stride and higher foot lift than walking', () => {
  const f = new Fighter(0, 400, 400); f.stridePhase = Math.PI / 4;
  f.state = 'walk'; const walk = computePose(f);
  f.state = 'run'; const run = computePose(f);
  assert.ok(Math.abs(run.front.tip[0] - run.back.tip[0]) > Math.abs(walk.front.tip[0] - walk.back.tip[0]));
  assert.ok(run.front.tip[1] < walk.front.tip[1]);
});
function pair() {
  const w = new Match(8, 3, { terrain: false }), [a, b, c] = w.fighters;
  a.x = 400; a.y = 400; a.cooldown = 0; b.x = 430; b.y = 400; b.readyAt = 100;
  c.x = 1000; c.y = 550; c.readyAt = 100; w.rng = () => .5;
  return { w, a, b };
}
test('grab visibly holds before dealing damage, then releases into a real throw', () => {
  const { w, a, b } = pair(); const hp = b.hp; a.startAttack('Grab', b);
  for (let i = 0; i < 30; i++) w.update();
  assert.equal(b.heldBy, a.id); assert.equal(b.state, 'held'); assert.ok(b.z > 35); assert.equal(b.hp, hp);
  for (let i = 0; i < 43; i++) w.update();
  assert.equal(b.heldBy, null); assert.ok(b.hp < hp); assert.ok(b.vx > 0 && b.vz > 0);
  assert.equal(w.stats.moves.Grab, 1);
});
test('interrupting a grab or KOing its holder releases the victim without a permanent lock', () => {
  for (const damage of [1, 999]) {
    const { w, a, b } = pair(); a.startAttack('Grab', b);
    for (let i = 0; i < 30; i++) w.update();
    a.receiveHit(damage, -100, 0, 150); w.update();
    assert.equal(b.heldBy, null); assert.equal(a.holdingId, null);
  }
});
test('dash has a windup followed by a locked diagonal burst; all gait styles spawn', () => {
  const { w, a, b } = pair(); b.x = 600; b.y = 500; a.startAttack('Dash', b);
  for (let i = 0; i < 8; i++) w.update(); const slow = Math.hypot(a.vx, a.vy);
  for (let i = 0; i < 12; i++) w.update();
  assert.ok(a.vx > 0 && a.vy > 0); assert.ok(Math.hypot(a.vx, a.vy) > slow * 5);
  const styles = new Set(Array.from({ length: 300 }, (_, i) => new Fighter(i, 0, 0, seededRandom(i)).gait));
  assert.equal(styles.size, GAITS.length);
});

test('sword cuts alternate direction, staff completes a turn, and hammer follows an overhead-to-floor arc', () => {
  const f = new Fighter(0, 400, 400, seededRandom(1));
  const at = (weapon, progress, variant = 0) => {
    f.weapon = weapon; const duration = f.getMove('WeaponStrike').duration;
    f.attack = { name: 'WeaponStrike', duration, elapsed: duration * progress, variant }; return computePose(f);
  };
  const down = at('Sword', .405), rising = at('Sword', .405, 1);
  assert.ok(down.main.tip[1] > rising.main.tip[1]); assert.ok(down.weaponAngle > rising.weaponAngle);
  const begin = at('Staff', 0), end = at('Staff', 1);
  assert.ok(Math.abs((begin.weaponAngle - end.weaponAngle) - Math.PI * 2) < 1e-8);
  const raised = at('Hammer', .34), slam = at('Hammer', .49);
  const headY = p => p.main.tip[1] + Math.sin(p.weaponAngle) * 43;
  assert.ok(headY(slam) - headY(raised) > 100);
  assert.equal(new Set(['Sword', 'Staff', 'Hammer'].map(w => JSON.stringify(at(w, .405)))).size, 3);
});
test('weapon-specific choreography keeps IK bone lengths through both attack variants', () => {
  const f = new Fighter(0, 0, 0, seededRandom(1));
  for (const weapon of ['Sword', 'Staff', 'Hammer']) for (const variant of [0, 1]) for (let i = 0; i <= 100; i++) {
    f.weapon = weapon; const duration = f.getMove('WeaponStrike').duration;
    f.attack = { name: 'WeaponStrike', duration, elapsed: duration * i / 100, variant };
    const p = computePose(f);
    for (const arm of [p.main, p.off]) {
      assert.ok(Math.abs(distance(p.shoulder, arm.joint) - 23) < 1e-6);
      assert.ok(Math.abs(distance(arm.joint, arm.tip) - 23) < 1e-6);
    }
    for (const leg of [p.front, p.back]) assert.ok(Math.abs(distance(leg.joint, leg.tip) - 29) < 1e-6);
  }
});
test('spin kicks finish their rotation before the active hit window', () => {
  const f = new Fighter(0, 0, 0, seededRandom(1)), move = MOVES.JumpKick;
  f.attack = { name: 'JumpKick', duration: move.duration, elapsed: move.duration * .25, variant: 1 };
  assert.ok(Math.abs(computePose(f).rotation) > Math.PI);
  f.attack.elapsed = move.windup;
  assert.ok(Math.abs(computePose(f).rotation + Math.PI * 2) < 1e-8);
});
