import { styleProfile } from './styles.js?v=20261119-cinema';

// Forward-kinematic full-body channels. Angles are radians from vertical;
// elbows/knees are relative bends. IK only corrects a contacting foot.
// hip X/Y, waist, chest, neck, main upper/bend, off upper/bend,
// front thigh/bend, back thigh/bend.
export const READY_RIGS = {
  Ninja: [0, -34, .35, .55, .15, 1.2, 1.0, -1, .7, 1.1, -1.3, -.8, .65],
  Boxing: [0, -49, .05, .13, .1, 1.18, 1.96, .48, 2.4, .8, -.85, -.65, .5],
  Judo: [0, -43, .2, .25, .12, 1.4, .9, 1, .7, 1.1, -1.1, -.85, .6],
  Kickboxing: [0, -47, .1, .25, .1, 1.1, 1.9, .7, 2.3, .95, -1, -.8, .5],
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
  sweep: clip('Ninja', { y: -29, waist: -.2, chest: -.5, thigh: 1.9, knee: -1.6, main: -.6, elbow: 1.4 },
    { x: 6, y: -26, waist: .4, chest: .85, neck: .25, thigh: 1.25, knee: .15, main: 1.25, elbow: .8 },
    { x: 6, y: -27, waist: .45, chest: .9, thigh: 1.15, knee: .15 },
    { y: -29, chest: .25, thigh: 1.8, knee: -1.4 }),
  ninjaPalm: clip('Ninja', { y: -29, waist: -.2, chest: -.4, main: -.5, elbow: 1.4 },
    { x: 8, y: -30, waist: .4, chest: .85, neck: .25, main: 1.5, elbow: .05 },
    { x: 8, y: -29, waist: .45, chest: .9, main: 1.6, elbow: .15 },
    { y: -29, chest: .2, main: 1.2, elbow: 1.0 }),
  bodyKick: clip('Kickboxing', { y: -42, waist: .15, chest: .3, thigh: 2.4, knee: -1.9 },
    { x: 8, y: -45, waist: .18, chest: .32, neck: .15, thigh: 1.35, knee: .1, off: -.5, offElbow: 1.7 },
    { x: 8, y: -44, waist: .25, chest: .45, thigh: 1.25, knee: .15 },
    { y: -42, thigh: 2.3, knee: -1.9 }),
  heelKick: clip('Kickboxing', { y: -40, waist: -.2, chest: -.35, thigh: 2.6, knee: -1.9, main: -.4, elbow: 1.5 },
    { x: 7, y: -46, waist: -.18, chest: -.4, neck: -.2, thigh: 1.72, knee: .03, main: .9, elbow: 2.0 },
    { x: 8, y: -44, waist: .22, chest: .45, thigh: 1.3, knee: .15 },
    { y: -41, thigh: 2.2, knee: -1.8 }),
  judoPush: clip('Judo', { y: -37, waist: -.1, chest: -.2, main: .8, elbow: 1.3 },
    { x: 6, y: -39, waist: .3, chest: .45, main: 1.4, elbow: .1, off: 1.1, offElbow: .5 },
    { x: 6, y: -38, waist: .35, chest: .5, main: 1.45, elbow: .2 },
    { y: -37, waist: .15, chest: .2 }),
  hipThrow: [[0, READY_RIGS.Judo], [.18, pose('Judo', { x: 6, y: -39, chest: .5, main: 1.45, elbow: .15, off: 1.3, offElbow: .2 })],
    [.43, pose('Judo', { x: -3, y: -28, waist: -.3, chest: -.5, neck: -.2, main: 2.1, elbow: .8, off: 1.9, offElbow: .9 })],
    [.63, pose('Judo', { x: 9, y: -38, waist: .55, chest: 1.0, neck: .6, main: 1.1, elbow: .25, off: .9, offElbow: .25 })],
    [.8, pose('Judo', { x: 7, y: -34, waist: .45, chest: .8, main: .6, elbow: .3, off: .5, offElbow: .4 })], [1, READY_RIGS.Judo]],
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
  const solve = (i, thigh, bend) => {
    if (contacts[i]) return contactLeg(hip, [x + clamp(legs[i].tip[0] - x, -52, 52), 0]);
    const swing = chain(hip, thigh, bend, 29);
    return swing.tip[1] > 0 ? contactLeg(hip, [swing.tip[0], 0]) : swing;
  };
  return { hip, waist, shoulder, head, main: chain(shoulder, mu, mb, 23), off: chain(shoulder, ou, ob, 23),
    front: solve(0, ft, fb), back: solve(1, bt, bb), rotation: 0, yaw: 0, torsoYaw: 0, weaponAngle: -.7,
    rig: [...rig], contacts: [...contacts], cinematic: true };
}

function runRig(style, phase, retreat) {
  const r = READY_RIGS[style], p = (((retreat ? -phase : phase) / (Math.PI * 2)) % 1 + 1) % 1;
  // Contact, compression, passing, push-off, then the opposite leg repeats.
  const legs = [[0, [1, -1, -.85, -.5]], [.125, [.3, -.5, -.3, -1.7]],
    [.25, [-.5, .65, .9, -1.8]], [.375, [-.85, .8, 1.35, -1.3]],
    [.5, [-.85, -.5, 1, -1]], [.625, [-.3, -1.7, .3, -.5]],
    [.75, [.9, -1.8, -.5, .65]], [.875, [1.35, -1.3, -.85, .8]], [1, [1, -1, -.85, -.5]]];
  const leg = sampleRig(legs, p), swing = Math.sin(p * Math.PI * 2);
  const rig = [...r]; rig[1] = r[1] + 2 + Math.abs(Math.sin(p * Math.PI * 4)) * 2;
  rig[2] = retreat ? -.12 : style === 'Ninja' ? .45 : .2;
  rig[3] = retreat ? -.22 : { Ninja: .72, Boxing: .38, Judo: .38, Kickboxing: .45, Taekwondo: .22 }[style];
  rig[4] = retreat ? -.1 : .2;
  rig[5] = .5 + swing * .75; rig[6] = 1.65; rig[7] = .5 - swing * .75; rig[8] = 1.65;
  if (style === 'Ninja' && !retreat) { rig[5] = -.7 + swing * .2; rig[6] = .6; rig[7] = -1 - swing * .2; rig[8] = .65; }
  if (style === 'Judo') { rig[5] = .9 + swing * .4; rig[6] = 1.0; rig[7] = .9 - swing * .4; rig[8] = 1.0; }
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
    const target = pose(f.style, d.kind === 'guard' ? { y: ready[1] + 5, chest: -.2, main: 1.4, elbow: 1.8, off: 1.0, offElbow: 2.2 }
      : { y: { Ninja: -23, Boxing: -31, Judo: -32, Kickboxing: -37, Taekwondo: -43 }[f.style], waist: -.25, chest: -.72, neck: -.35 });
    return { rig: ready.map((v, i) => lerp(v, target[i], amount)), contacts: [true, true], clip: d.kind };
  }
  if (f.attack) {
    const a = f.attack, special = a.finisher ? styleProfile(f.style).finisher : styleProfile(f.style).signature;
    const contact = a.contactAt ?? (a.signature ? special.timing.windup : { Punch: .1, Kick: .18, Uppercut: .23, Dash: .12 }[a.name]);
    if (a.name === 'Grab') {
      const windup = a.contactAt ?? (a.signature ? special.timing.windup : .16), release = a.signature ? special.timing.throwAt || .55 : .55;
      const p = a.elapsed <= windup ? a.elapsed / windup * .18 : a.elapsed <= release ? .18 + (a.elapsed - windup) / (release - windup) * .45
        : .63 + (a.elapsed - release) / Math.max(.001, a.duration - release) * .37;
      return { rig: sampleRig(CINEMATIC_CLIPS.hipThrow, p), contacts: [true, true], clip: 'hipThrow', contact: windup };
    }
    if (!contact || !['Punch', 'Kick', 'Uppercut', 'Dash'].includes(a.name)) return null;
    if (a.name === 'Dash') {
      const running = runRig(f.style, f.stridePhase || a.elapsed * 22, false);
      running.rig[2] = .35; running.rig[3] = .7; running.clip = 'rush'; return running;
    }
    const name = a.name === 'Uppercut' ? 'uppercut' : f.style === 'Ninja' ? a.name === 'Kick' ? 'sweep' : 'ninjaPalm'
      : f.style === 'Judo' ? a.name === 'Kick' ? 'sweep' : 'judoPush'
      : f.style === 'Kickboxing' ? a.name === 'Kick' ? a.signature || a.variant === 1 ? 'heelKick' : 'bodyKick' : a.variant === 1 ? 'cross' : 'jab'
      : f.style === 'Boxing' ? a.signature ? 'hook' : a.variant === 1 ? 'cross' : 'jab'
      : a.name === 'Kick' ? a.signature ? 'backKick' : a.variant === 1 ? 'roundhouse' : 'sideKick' : 'jab';
    const progress = a.elapsed <= contact ? a.elapsed / contact * .4 : .4 + (a.elapsed - contact) / Math.max(.001, a.duration - contact) * .6;
    const rig = sampleRig(CINEMATIC_CLIPS[name], progress);
    // Rare Taekwondo punches retain its side-on foundation.
    if (f.style === 'Taekwondo' && a.name !== 'Kick') { rig[2] -= .15; rig[7] = ready[7]; rig[8] = ready[8]; }
    return { rig, contacts: a.name === 'Kick' ? [progress >= .96, true] : [true, true], clip: name, contact };
  }
  if (['walk', 'run', 'evade'].includes(f.state)) {
    const sample = runRig(f.style, f.stridePhase || 0, f.intent === 'flee');
    if (f.state !== 'run') {
      for (let i = 9; i < 13; i++) sample.rig[i] *= .65;
      for (let i = 5; i < 9; i++) sample.rig[i] = lerp(ready[i], sample.rig[i], .3);
      sample.clip = f.intent === 'flee' ? 'backstep' : f.state === 'evade' ? 'shuffle' : 'walk';
    }
    return sample;
  }
  const rig = [...ready]; rig[3] += Math.sin(f.age * 2.5 + f.id) * .018;
  return { rig, contacts: [true, true], clip: 'ready' };
}
