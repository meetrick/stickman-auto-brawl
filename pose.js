import { clamp } from './random.js';

const lerp = (a, b, t) => a + (b - a) * t;
// End-effector tracks, independently authored for this unarmed auto-brawler.
// [time, lean, crouch, main hand XY, off hand XY, front foot XY, back foot XY]
export const TRACKS = {
  Dash: [
    [0, -.2, 9, -6, 17, 16, -6, 14, 0, -20, 0],
    [.2, .65, 17, 23, -6, -28, 17, 24, -5, -31, -7],
    [.45, .85, 7, 36, 5, -29, 14, 30, 0, -34, -10],
    [.8, .5, 5, 33, 9, -19, 16, 27, 0, -25, 0],
    [1, .05, 2, 19, -9, -14, 7, 15, 0, -14, 0],
  ],
  JumpKick: [
    [0, -.15, 12, 20, -7, -12, 5, 15, -9, -18, 0],
    [.22, -.35, 0, 23, -13, -26, 2, 21, -40, -24, -27],
    [.42, -.6, 0, -2, -22, -32, 12, 55, -62, -29, -22],
    [.66, -.48, 0, 12, -16, -28, 14, 54, -57, -31, -18],
    [.85, .12, 5, 22, -8, -16, 6, 26, -18, -15, -13],
    [1, .05, 4, 19, -9, -14, 7, 15, 0, -14, 0],
  ],
  Uppercut: [
    [0, .05, 2, 19, -9, -14, 7, 15, 0, -14, 0],
    [.26, -.4, 18, -12, 21, 21, -16, 20, 0, -20, 0],
    [.44, .22, -5, 18, -43, -22, 13, 20, 0, -15, -8],
    [.65, .35, -3, 22, -37, -20, 12, 22, 0, -16, -4],
    [1, .05, 2, 19, -9, -14, 7, 15, 0, -14, 0],
  ],
  Grab: [
    [0, -.1, 4, 19, -5, 2, 10, 14, 0, -15, 0],
    [.2, .42, 8, 42, 7, 35, -5, 26, 0, -19, 0],
    [.44, -.35, 14, 8, -37, -19, -28, 19, 0, -22, 0],
    [.64, .65, -3, 40, -6, 35, 4, 30, 0, -22, -4],
    [.82, .55, 4, 37, 14, 29, 13, 31, 0, -21, 0],
    [1, .05, 2, 19, -9, -14, 7, 15, 0, -14, 0],
  ],
  WeaponStrike: [
    [0, .04, 3, 20, -10, -9, 8, 15, 0, -15, 0],
    [.22, -.35, 12, -20, -30, 18, -15, 20, 0, -23, 0],
    [.33, -.3, 14, -14, -34, 15, -18, 20, 0, -24, 0],
    [.41, .65, 0, 42, 0, -23, 16, 31, 0, -24, -5],
    [.64, .6, 7, 34, 20, -18, 18, 32, 0, -23, 0],
    [1, .04, 3, 20, -10, -9, 8, 15, 0, -15, 0],
  ],
};
// Individual weapon choreography. Contact aligns near 40% of each move.
export const WEAPON_TRACKS = {
  Sword: [
    [0, .04, 2, 18, -8, -12, 9, 15, 0, -16, 0],
    [.2, -.3, 10, -22, -22, 19, -14, 20, 0, -24, 0],
    [.34, -.42, 12, -15, -34, 17, -17, 20, 0, -26, 0],
    [.405, .62, -2, 43, 1, -26, 12, 34, 0, -26, -7],
    [.53, .75, 6, 29, 26, -20, 16, 36, 0, -27, 0],
    [.76, .22, 4, 23, 6, -14, 6, 23, 0, -20, 0],
    [1, .04, 2, 18, -8, -12, 9, 15, 0, -16, 0],
  ],
  Staff: [
    [0, .08, 3, 17, 2, -8, 6, 19, 0, -19, 0],
    [.16, -.25, 10, -22, 8, -9, 7, 24, 0, -25, 0],
    [.3, -.4, 7, -11, -24, -6, -13, 27, -5, -27, 0],
    [.405, .5, 0, 33, 3, 6, -2, 34, 0, -25, -7],
    [.6, .62, 8, 29, 19, 4, 14, 30, 0, -30, 0],
    [.78, -.12, 4, 15, -15, -9, -9, 22, 0, -22, 0],
    [1, .08, 3, 17, 2, -8, 6, 19, 0, -19, 0],
  ],
  Hammer: [
    [0, -.08, 5, 12, -12, 1, -9, 17, 0, -19, 0],
    [.2, -.3, 16, -8, -34, -13, -25, 22, 0, -24, 0],
    [.34, -.52, 20, -10, -42, -13, -31, 24, 0, -29, 0],
    [.405, .65, 7, 32, 22, 15, 9, 36, 0, -28, -4],
    [.49, .82, 22, 28, 32, 14, 21, 37, 0, -30, 0],
    [.68, .55, 18, 31, 23, 15, 15, 32, 0, -26, 0],
    [1, -.08, 5, 12, -12, 1, -9, 17, 0, -19, 0],
  ],
};
const SWORD_RISING = [
  [0, .04, 2, 18, -8, -12, 9, 15, 0, -16, 0],
  [.22, -.35, 17, -17, 28, 18, -17, 22, 0, -24, 0],
  [.34, -.38, 19, -14, 27, 19, -15, 22, 0, -25, 0],
  [.405, .48, -5, 31, -26, -22, 12, 32, 0, -25, -9],
  [.57, .18, -4, 14, -40, -23, 9, 29, 0, -22, -6],
  [.8, .12, 3, 22, -16, -15, 8, 22, 0, -18, 0],
  [1, .04, 2, 18, -8, -12, 9, 15, 0, -16, 0],
];
const WEAPON_ANGLES = {
  Sword: [[0, -.75], [.22, -2.6], [.34, -2.45], [.405, .35], [.56, 1.3], [.8, -.1], [1, -.75]],
  Staff: [[0, -.7], [.16, -2.4], [.3, -4.55], [.405, -6.15], [.6, -7.9], [.8, -7.5], [1, -Math.PI * 2 - .7]],
  Hammer: [[0, -1.05], [.2, -1.9], [.34, -1.85], [.405, .85], [.49, 1.4], [.68, 1.25], [1, -1.05]],
};

export function sampleTrack(keys, time) {
  if (time <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) if (time <= keys[i][0]) {
    const a = keys[i - 1], b = keys[i], t = clamp((time - a[0]) / (b[0] - a[0]), 0, 1);
    const eased = t * t * (3 - 2 * t);
    return a.slice(1).map((v, j) => lerp(v, b[j + 1], eased));
  }
  return keys.at(-1).slice(1);
}
export function solveLimb(root, target, upper, lower, bend = 1) {
  const dx = target[0] - root[0], dy = target[1] - root[1];
  const distance = clamp(Math.hypot(dx, dy), .001, upper + lower - .001), angle = Math.atan2(dy, dx);
  const elbowAngle = angle + bend * Math.acos(clamp((upper * upper + distance * distance - lower * lower) / (2 * upper * distance), -1, 1));
  return { joint: [root[0] + Math.cos(elbowAngle) * upper, root[1] + Math.sin(elbowAngle) * upper],
    tip: [root[0] + Math.cos(angle) * distance, root[1] + Math.sin(angle) * distance] };
}
export function computePose(f) {
  const moving = f.alive && (f.state === 'walk' || f.state === 'run'), running = f.alive && f.state === 'run';
  const phase = f.stridePhase || 0, wave = Math.sin(phase), other = Math.sin(phase + Math.PI);
  let lean = moving ? running ? .35 : .1 : Math.sin(f.age * 2.8 + f.id) * .025;
  let crouch = moving ? -Math.abs(Math.sin(phase)) * (running ? 5 : 2) : 2 + Math.sin(f.age * 2.8 + f.id) * 1.2;
  let main = [18 + (moving ? other * 17 : 0), -7 + (moving ? wave * 10 : 0)];
  let off = [-10 + (moving ? wave * 18 : 0), 9 + (moving ? other * 10 : 0)];
  let front = [14, 0], back = [-14, 0];
  if (moving) {
    const stride = running ? 31 : 18, lift = running ? 23 : 8;
    front = [wave * stride, -Math.max(0, Math.cos(phase)) * lift];
    back = [-wave * stride, -Math.max(0, -Math.cos(phase)) * lift];
  } else if (f.z > 1) { front = [19, -18]; back = [-18, -8]; }
  if (f.attack) {
    const weaponKeys = f.weapon === 'Sword' && f.attack.variant === 1 ? SWORD_RISING : WEAPON_TRACKS[f.weapon];
    const keys = f.attack.name === 'WeaponStrike' ? weaponKeys || TRACKS.WeaponStrike : TRACKS[f.attack.name];
    const k = sampleTrack(keys, f.attack.elapsed / f.attack.duration);
    [lean, crouch] = k; main = k.slice(2, 4); off = k.slice(4, 6); front = k.slice(6, 8); back = k.slice(8, 10);
  }
  if (!moving && !f.attack) {
    if (f.weapon === 'Hammer') { main = [12, -12]; off = [2, -8]; }
    if (f.weapon === 'Staff') main = [17, 2];
  }
  let weaponAngle = moving ? -.65 + wave * .18 : f.weapon === 'Hammer' ? -1.05 : f.weapon === 'Staff' ? -.7 : -.75;
  if (f.attack?.name === 'Dash' && f.attack.elapsed > .12 && f.attack.elapsed < .5) weaponAngle = .05;
  if (f.attack?.name === 'WeaponStrike') {
    const progress = f.attack.elapsed / f.attack.duration;
    const angles = f.weapon === 'Sword' && f.attack.variant === 1
      ? [[0, -.75], [.22, 2], [.34, 1.9], [.405, -1.05], [.57, -2], [.8, -1.5], [1, -.75]]
      : WEAPON_ANGLES[f.weapon] || WEAPON_ANGLES.Sword;
    weaponAngle = sampleTrack(angles, progress)[0];
  }
  if (['Staff', 'Hammer'].includes(f.weapon) && f.attack?.name === 'WeaponStrike') {
    const grip = f.weapon === 'Staff' ? 19 : 13;
    off = [main[0] - Math.cos(weaponAngle) * grip, main[1] - Math.sin(weaponAngle) * grip];
  }
  let rotation = f.tumble || 0;
  if (f.alive && f.attack?.name === 'JumpKick') {
    const progress = f.attack.elapsed / f.attack.duration;
    if (f.attack.variant === 1) rotation = -Math.PI * 2 * clamp((progress - .06) / .29, 0, 1);
    else rotation = sampleTrack([[0, 0], [.25, -.25], [.42, -.38], [.7, -.15], [1, 0]], progress)[0];
  }
  if (!f.alive) {
    // One inert pose: no breathing, flailing, or recovery cycle after defeat.
    lean = -.08; crouch = 0; weaponAngle = .35;
    main = [21, 19]; off = [-21, 11]; front = [24, -2]; back = [-18, 1];
    rotation = f.z > 0 ? f.tumble || 0 : -Math.PI / 2;
  } else if (f.state === 'held') { rotation = -1.5; main = [20, 19]; off = [-23, 16]; front = [24, -14]; back = [-22, -7]; }
  else if (f.stun > 0) {
    const flail = Math.sin(f.age * 15 + f.id);
    main = [18, 12 + flail * 20]; off = [-24, -4 - flail * 17]; front = [23, -8 - flail * 12]; back = [-23, -12 + flail * 8];
    lean = -.2;
    if (f.z === 0) rotation = f.alive ? -.8 * Math.min(1, f.stun * 3) : -1.5;
  }
  const hip = [0, -51 + crouch], shoulder = [Math.sin(lean) * 39, hip[1] - Math.cos(lean) * 39];
  const head = [shoulder[0] + Math.sin(lean) * 16, shoulder[1] - Math.cos(lean) * 16];
  const arm = target => solveLimb(shoulder, [shoulder[0] + target[0], shoulder[1] + target[1]], 23, 23, 1);
  const leg = foot => solveLimb(hip, foot, 29, 29, -1);
  return { hip, shoulder, head, main: arm(main), off: arm(off), front: leg(front), back: leg(back), rotation, weaponAngle };
}
