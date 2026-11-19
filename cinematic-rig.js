import { styleProfile } from './styles.js?v=20261119-headline';

// Forward-kinematic full-body channels. Angles are radians from vertical;
// elbows/knees are relative bends. IK only corrects a contacting foot.
// hip X/Y, waist, chest, neck, main upper/bend, off upper/bend,
// front thigh/bend, back thigh/bend.
export const READY_RIGS = {
  Boxing: [0, -49, .05, .13, .1, 1.18, 1.96, .48, 2.4, .8, -.85, -.65, .5],
  Taekwondo: [0, -51, -.12, -.25, -.18, .85, 2.05, -.55, -2.15, .72, -.6, -.55, .38],
};
const channels = { x: 0, y: 1, waist: 2, chest: 3, neck: 4, main: 5, elbow: 6, off: 7, offElbow: 8, thigh: 9, knee: 10, rear: 11, rearKnee: 12 };
const pose = (style, values) => {
  const r = [...READY_RIGS[style]];
  for (const [key, value] of Object.entries(values)) r[channels[key]] = value;
  return r;
};
const clip = (style, load, strike, follow, recover) => [[0, READY_RIGS[style]], [.27, pose(style, load)],
  [.4, pose(style, strike)], [.49, pose(style, follow)], [.74, pose(style, recover)], [1, READY_RIGS[style]]];
export const CINEMATIC_CLIPS = {
  jab: clip('Boxing', { y: -44, waist: -.12, chest: -.25, neck: -.1, main: .9, elbow: 2.2 },
    { x: 8, y: -47, waist: .2, chest: .58, neck: .3, main: 1.5, elbow: .05, thigh: .95, knee: -.9 },
    { x: 8, y: -46, waist: .23, chest: .62, neck: .3, main: 1.55, elbow: .13 },
    { y: -44, waist: -.1, chest: -.2, main: 1.1, elbow: 2.0 }),
  cross: clip('Boxing', { y: -43, waist: -.2, chest: -.35, neck: -.1, off: -.35, offElbow: 2.0 },
    { x: 10, y: -46, waist: .3, chest: .6, neck: .35, off: 1.55, offElbow: .03, thigh: 1, knee: -.95 },
    { x: 9, y: -45, waist: .32, chest: .62, off: 1.6, offElbow: .12 },
    { y: -43, waist: -.12, chest: -.22, off: .75, offElbow: 2.3 }),
  hook: clip('Boxing', { y: -37, waist: -.32, chest: -.6, neck: -.25, main: -.3, elbow: 1.9 },
    { x: 9, y: -44, waist: .4, chest: .65, neck: .35, main: 1.65, elbow: .6 },
    { x: 9, y: -43, waist: .42, chest: .7, main: 2.1, elbow: .9 },
    { y: -41, waist: -.12, chest: -.28, main: 1.2, elbow: 1.9 }),
  uppercut: clip('Boxing', { y: -32, waist: -.3, chest: -.65, neck: -.25, main: -.25, elbow: 1.7 },
    { x: 7, y: -48, waist: .22, chest: .4, neck: .2, main: 2.45, elbow: .2 },
    { x: 7, y: -47, waist: .28, chest: .5, main: 2.3, elbow: .35 },
    { y: -42, waist: -.1, chest: -.22, main: 1.25, elbow: 1.9 }),
  sideKick: clip('Taekwondo', { y: -47, waist: -.22, chest: -.4, neck: -.25, thigh: 2.7, knee: -2.1 },
    { x: 4, y: -51, waist: -.3, chest: -.65, neck: -.4, thigh: 1.92, knee: .02, main: 1.1, elbow: 1.8 },
    { x: 4, y: -50, waist: -.3, chest: -.62, thigh: 1.86, knee: .08 },
    { y: -47, waist: -.2, chest: -.35, thigh: 2.5, knee: -2.0 }),
  roundhouse: clip('Taekwondo', { y: -45, waist: -.32, chest: -.5, neck: -.3, thigh: 2.8, knee: -2.0, main: -.6, elbow: 1.8 },
    { x: 4, y: -51, waist: -.4, chest: -.8, neck: -.5, thigh: 2.3, knee: -.06, main: -.9, elbow: 1.7 },
    { x: 5, y: -49, waist: -.1, chest: -.3, thigh: 1.8, knee: .15, main: .3, elbow: 2.1 },
    { y: -46, waist: .1, chest: .1, thigh: 2.4, knee: -2.0, main: .7, elbow: 2.0 }),
  backKick: clip('Taekwondo', { y: -44, waist: -.38, chest: -.6, neck: -.3, thigh: 2.9, knee: -2.1, main: -.8, elbow: 1.8 },
    { x: 5, y: -51, waist: -.45, chest: -.78, neck: -.45, thigh: 2.22, knee: -.02, main: -1.0, elbow: 1.7 },
    { x: 5, y: -48, waist: .1, chest: .25, thigh: 1.6, knee: .12, main: .8, elbow: 2.1 },
    { y: -45, waist: .15, chest: .2, thigh: 2.5, knee: -2.0, main: .75, elbow: 2.0 }),
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
  if (!ready || f.weapon !== 'None' || !f.alive || f.z > 1 || f.heldBy != null || f.landing > 0) return null;
  if (f.stun > 0) {
    if (f.state !== 'hit') return null;
    const r = [...ready], recoil = Math.sin(clamp(f.stun / .16, 0, 1) * Math.PI * .8), side = f.hitSide || -1;
    r[1] += recoil * 7; r[2] = side * .28 * recoil; r[3] = side * .8 * recoil; r[4] = side * .5 * recoil;
    return { rig: r, contacts: [true, true], clip: 'hit' };
  }
  if (f.defense) {
    const d = f.defense, amount = Math.sin(clamp(d.elapsed / d.duration, 0, 1) * Math.PI);
    const target = pose(f.style, d.kind === 'guard' ? { y: -44, chest: -.2, main: 1.4, elbow: 1.8, off: 1.0, offElbow: 2.2 }
      : { y: f.style === 'Boxing' ? -31 : -43, waist: -.25, chest: -.72, neck: -.35 });
    return { rig: ready.map((v, i) => lerp(v, target[i], amount)), contacts: [true, true], clip: d.kind };
  }
  if (f.attack) {
    const a = f.attack, special = a.finisher ? styleProfile(f.style).finisher : styleProfile(f.style).signature;
    const contact = a.contactAt ?? (a.signature ? special.timing.windup : { Punch: .1, Kick: .18, Uppercut: .23, Dash: .12 }[a.name]);
    if (!contact || !['Punch', 'Kick', 'Uppercut', 'Dash'].includes(a.name)) return null;
    if (a.name === 'Dash') {
      const running = runRig(f.style, f.stridePhase || a.elapsed * 22, false);
      running.rig[2] = .35; running.rig[3] = .7; running.clip = 'rush'; return running;
    }
    const name = f.style === 'Boxing' ? a.name === 'Uppercut' ? 'uppercut' : a.signature ? 'hook' : a.variant === 1 ? 'cross' : 'jab'
      : a.name === 'Kick' ? a.signature ? 'backKick' : a.variant === 1 ? 'roundhouse' : 'sideKick' : 'jab';
    const progress = a.elapsed <= contact ? a.elapsed / contact * .4 : .4 + (a.elapsed - contact) / Math.max(.001, a.duration - contact) * .6;
    const rig = sampleRig(CINEMATIC_CLIPS[name], progress);
    // Rare Taekwondo punches retain its side-on foundation.
    if (f.style === 'Taekwondo' && a.name !== 'Kick') { rig[2] -= .15; rig[7] = ready[7]; rig[8] = ready[8]; }
    return { rig, contacts: a.name === 'Kick' ? [progress >= .96, true] : [true, true], clip: name, contact };
  }
  if (['walk', 'run', 'evade'].includes(f.state)) return runRig(f.style, f.stridePhase || 0, f.intent === 'flee');
  const rig = [...ready]; rig[3] += Math.sin(f.age * 2.5 + f.id) * .018;
  return { rig, contacts: [true, true], clip: 'ready' };
}
