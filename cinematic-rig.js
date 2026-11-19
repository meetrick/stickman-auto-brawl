import { styleProfile } from './styles.js?v=20261119-headline';

// Forward-kinematic full-body channels. Angles are radians from vertical;
// elbows/knees are relative bends. IK only corrects a contacting foot.
// hip X/Y, waist, chest, neck, main upper/bend, off upper/bend,
// front thigh/bend, back thigh/bend.
export const READY_RIGS = {
  Boxing: [0, -49, .05, .13, .1, 1.18, 1.96, .48, 2.4, .8, -.85, -.65, .5],
  Taekwondo: [0, -51, -.12, -.25, -.18, .85, 2.05, -.55, -2.15, .72, -.6, -.55, .38],
};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function sampleRig(keys, t) {
  if (t <= keys[0][0]) return [...keys[0][1]];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [a, av] = keys[i - 1], [b, bv] = keys[i];
    const u = clamp((t - a) / (b - a), 0, 1), s = u * u * (3 - 2 * u);
    return av.map((v, j) => lerp(v, bv[j], s));
  }
  return [...keys.at(-1)[1]];
}
const offset = (root, angle, length, up = false) => [root[0] + Math.sin(angle) * length, root[1] + Math.cos(angle) * length * (up ? -1 : 1)];
const chain = (root, upper, bend, length) => {
  const joint = offset(root, upper, length);
  return { joint, tip: offset(joint, upper + bend, length) };
};
export function contactLeg(root, tip, bend = -1) {
  const dx = tip[0] - root[0], dy = tip[1] - root[1], d = clamp(Math.hypot(dx, dy), .001, 57.9999);
  const angle = Math.atan2(dy, dx), knee = angle + bend * Math.acos(d / 58);
  const joint = [root[0] + Math.cos(knee) * 29, root[1] + Math.sin(knee) * 29];
  return { joint, tip: [root[0] + Math.cos(angle) * d, root[1] + Math.sin(angle) * d] };
}
export function rigPose(rig, contacts = [true, true]) {
  const [x, y, waistAngle, chestAngle, neckAngle, mu, mb, ou, ob, ft, fb, bt, bb] = rig;
  const original = [x, y], legs = [chain(original, ft, fb, 29), chain(original, bt, bb, 29)];
  let height = -y;
  for (let i = 0; i < 2; i++) if (contacts[i]) {
    const dx = clamp(legs[i].tip[0] - x, -52, 52);
    height = Math.min(height, Math.sqrt(57.9 ** 2 - dx ** 2));
  }
  const hip = [x, -height], waist = offset(hip, waistAngle, 18, true);
  const shoulder = offset(waist, chestAngle, 21, true), head = offset(shoulder, neckAngle, 16, true);
  const solve = (i, thigh, bend) => contacts[i] ? contactLeg(hip, [x + clamp(legs[i].tip[0] - x, -52, 52), 0]) : chain(hip, thigh, bend, 29);
  return { hip, waist, shoulder, head, main: chain(shoulder, mu, mb, 23), off: chain(shoulder, ou, ob, 23),
    front: solve(0, ft, fb), back: solve(1, bt, bb), rotation: 0, yaw: 0, torsoYaw: 0, weaponAngle: -.7,
    rig: [...rig], contacts: [...contacts], cinematic: true };
}

function runRig(style, phase, retreat) {
  const r = READY_RIGS[style], p = ((phase / (Math.PI * 2)) % 1 + 1) % 1;
  // Contact, compression, passing, push-off, then the opposite leg repeats.
  const legs = [[0, [1, -1, -.85, -.5]], [.125, [.3, -.5, -.3, -1.7]],
    [.25, [-.5, .65, .9, -1.8]], [.375, [-.85, .8, 1.35, -1.3]],
    [.5, [-.85, -.5, 1, -1]], [.625, [-.3, -1.7, .3, -.5]],
    [.75, [.9, -1.8, -.5, .65]], [.875, [1.35, -1.3, -.85, .8]], [1, [1, -1, -.85, -.5]]];
  const leg = sampleRig(legs, p), swing = Math.sin(p * Math.PI * 2);
  const rig = [...r]; rig[1] = -47 + Math.abs(Math.sin(p * Math.PI * 4)) * 2;
  rig[2] = retreat ? -.12 : .2; rig[3] = retreat ? -.22 : style === 'Boxing' ? .38 : .22;
  rig[4] = retreat ? -.1 : .2;
  rig[5] = .5 + swing * .75; rig[6] = 1.65; rig[7] = .5 - swing * .75; rig[8] = 1.65;
  rig.splice(9, 4, ...leg);
  return { rig, contacts: [p < .46, p >= .5 && p < .96], clip: retreat ? 'retreat' : 'run', phase: p };
}

export function cinematicSample(f) {
  const ready = READY_RIGS[f.style];
  if (!ready || f.weapon !== 'None' || !f.alive || f.z > 1 || f.heldBy != null || f.stun > 0 || f.landing > 0 || f.attack || f.defense) return null;
  if (['walk', 'run', 'evade'].includes(f.state)) return runRig(f.style, f.stridePhase || 0, f.intent === 'flee');
  const rig = [...ready]; rig[3] += Math.sin(f.age * 2.5 + f.id) * .018;
  return { rig, contacts: [true, true], clip: 'ready' };
}
