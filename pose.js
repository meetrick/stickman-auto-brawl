import { clamp } from './random.js?v=20261119-headline';
import { styleProfile } from './styles.js?v=20261119-headline';
import { MARTIAL_STANCES, MARTIAL_GUARDS, MARTIAL_DODGES, martialTrack } from './martial-motion.js?v=20261119-headline';

const lerp = (a, b, t) => a + (b - a) * t;
export const STANCES = MARTIAL_STANCES;
export const STYLE_TRACKS = {
  Taekwondo: { Kick: [
    [0, -.05, 7, 13, -15, -15, 6, 28, 0, -27, 0],
    [.23, -.3, 10, 14, -18, -16, 10, 14, -36, -19, 0],
    [.40, -.48, 5, 2, -19, -25, 10, 55, -43, -13, 0],
    [.58, -.35, 6, 10, -17, -23, 10, 51, -39, -15, 0],
    [.79, -.12, 9, 15, -15, -17, 6, 17, -29, -22, 0],
    [1, -.05, 7, 13, -15, -15, 6, 28, 0, -27, 0],
  ] },
  Ninja: { Kick: [
    [0, -.12, 13, 22, -5, -22, 12, 26, 0, -24, 0],
    [.22, -.32, 23, 14, -9, -27, 8, 14, -22, -24, 0],
    [.40, .28, 22, 30, -3, -30, 15, 52, -7, -23, 0],
    [.62, .35, 18, 28, 4, -25, 16, 50, -9, -24, 0],
    [1, -.12, 13, 22, -5, -22, 12, 26, 0, -24, 0],
  ] },
  Judo: { Grab: [
    [0, .12, 12, 32, -4, 23, 9, 26, 0, -26, 0],
    [.20, .35, 12, 43, 0, 35, 9, 28, 0, -24, 0],
    [.44, -.45, 23, 14, -12, 27, -1, 16, 0, -25, 0],
    [.64, .92, 14, 39, 18, 29, 26, 31, 0, -26, 0],
    [.83, .6, 20, 30, 27, 22, 29, 30, 0, -24, 0],
    [1, .12, 12, 32, -4, 23, 9, 26, 0, -26, 0],
  ] },
};
const ROUNDHOUSE = [
  [0, .02, 6, 19, -20, -4, -17, 27, 0, -25, 0],
  [.20, -.22, 8, 12, -23, -10, -17, 13, -34, -18, 0],
  [.40, -.5, 5, -8, -20, -25, -5, 51, -57, -12, 0],
  [.57, -.28, 5, 5, -22, -16, -11, 48, -38, -14, 0],
  [.79, .13, 8, 16, -21, -4, -17, -3, -25, -21, 0],
  [1, .02, 6, 19, -20, -4, -17, 27, 0, -25, 0],
];
const TAEKWONDO_ROUNDHOUSE = [
  [0, -.05, 7, 13, -15, -15, 6, 28, 0, -27, 0],
  [.23, -.28, 9, 10, -21, -19, 7, 10, -40, -18, 0],
  [.40, -.38, 5, -10, -21, -27, 13, 50, -67, -12, 0],
  [.58, -.16, 6, 3, -18, -24, 9, 48, -51, -15, 0],
  [.79, .12, 10, 13, -17, -14, 6, -5, -27, -22, 0],
  [1, -.05, 7, 13, -15, -15, 6, 28, 0, -27, 0],
];
export const SIGNATURE_TRACKS = {
  Taekwondo: [
    [0, -.05, 7, 13, -15, -15, 6, 28, 0, -27, 0],
    [.23, -.42, 16, -17, -5, -24, 14, -10, -31, -20, 0],
    [.32, -.44, 9, -21, -18, -29, 12, 19, -49, -14, 0],
    [.38, -.28, 5, -23, -14, -27, 16, 55, -65, -12, 0],
    [.58, .25, 8, 22, -14, -17, 5, 42, -45, -17, 0],
    [.80, .16, 11, 17, -17, -15, 5, -8, -24, -23, 0],
    [1, -.05, 7, 13, -15, -15, 6, 28, 0, -27, 0],
  ],
  Ninja: [
    [0, -.15, 14, 18, -7, -22, 13, 26, 0, -24, 0],
    [.25, -.5, 25, -6, -6, -27, 12, 12, -20, -24, 0],
    [.345, -.4, 8, -19, -18, -30, 6, 53, -43, -14, 0],
    [.55, -.25, 10, -13, -12, -25, 10, 50, -37, -17, 0],
    [.78, .2, 19, 25, -7, -19, 12, 14, -20, -24, 0],
    [1, -.12, 13, 22, -5, -22, 12, 26, 0, -24, 0],
  ],
  Boxing: [
    [0, .1, 7, 16, -24, 1, -21, 20, 0, -23, 0],
    [.2, -.45, 22, -22, 9, 8, -24, 22, 0, -24, 0],
    [.31, -.3, 19, -14, -18, 5, -24, 24, 0, -24, 0],
    [.385, .65, 5, 44, -13, 3, -23, 29, 0, -23, 0],
    [.54, .5, 6, 27, -29, 1, -22, 28, 0, -22, 0],
    [.78, .12, 9, 13, -24, 0, -21, 23, 0, -23, 0],
    [1, .12, 7, 16, -24, 1, -21, 20, 0, -23, 0],
  ],
  Judo: [
    [0, .12, 12, 32, -4, 23, 9, 26, 0, -26, 0],
    [.2, .44, 13, 43, 2, 35, 10, 28, 0, -24, 0],
    [.39, -.62, 28, 12, -7, 24, 3, 12, 0, -28, 0],
    [.54, -.4, 24, 20, -12, 29, -3, 19, 0, -26, 0],
    [.67, 1.05, 15, 42, 16, 30, 27, 33, 0, -24, 0],
    [.81, .72, 23, 29, 30, 19, 31, 31, 0, -24, 0],
    [1, .12, 12, 32, -4, 23, 9, 26, 0, -26, 0],
  ],
  Kickboxing: [
    [0, .02, 6, 19, -20, -4, -17, 27, 0, -25, 0],
    [.2, -.35, 13, 14, -22, -20, -9, -8, -28, -20, 0],
    [.32, -.5, 10, -11, -20, -26, 6, 18, -43, -14, 0],
    [.385, -.35, 5, -18, -17, -25, 11, 55, -56, -12, 0],
    [.54, .16, 7, 12, -18, -20, -11, 42, -43, -17, 0],
    [.77, .28, 12, 20, -22, -4, -17, -11, -22, -22, 0],
    [1, .02, 6, 19, -20, -4, -17, 27, 0, -25, 0],
  ],
};
export const FINISHER_TRACKS = {
  Ninja: [
    [0, -.15, 17, 17, -8, -22, 13, 23, 0, -25, 0],
    [.18, -.4, 26, -15, 8, -25, 15, 20, 0, -28, 0],
    [.26, .85, 12, 44, -4, -30, 17, 34, 0, -30, -7],
    [.47, .82, 8, 42, 5, -28, 15, 32, 0, -31, 0],
    [.72, .4, 14, 28, -8, -22, 10, 25, 0, -24, 0],
    [1, -.12, 13, 22, -5, -22, 12, 26, 0, -24, 0],
  ],
  Boxing: [
    [0, .12, 7, 16, -24, 1, -21, 20, 0, -23, 0],
    [.23, -.45, 25, -12, 20, 7, -24, 23, 0, -25, 0],
    [.34, -.3, 20, -4, 9, 5, -24, 23, 0, -25, 0],
    [.40, .35, 2, 20, -43, 3, -24, 24, 0, -22, 0],
    [.57, .48, 3, 24, -37, 1, -23, 25, 0, -22, 0],
    [.80, .15, 8, 16, -25, 1, -22, 23, 0, -23, 0],
    [1, .12, 7, 16, -24, 1, -21, 20, 0, -23, 0],
  ],
};
// End-effector tracks, independently authored for this unarmed auto-brawler.
// [time, lean, crouch, main hand XY, off hand XY, front foot XY, back foot XY]
export const TRACKS = {
  Punch: [
    [0, -.12, 5, 12, -18, -6, -13, 21, 0, -20, 0],
    [.24, -.25, 8, -7, -12, 15, -18, 22, 0, -22, 0],
    [.36, .48, 2, 45, -12, 9, -16, 29, 0, -23, 0],
    [.43, .55, 3, 43, -10, 7, -20, 29, 0, -23, 0],
    [.64, .12, 9, 14, -23, 3, -21, 24, 0, -23, 0],
    [1, .06, 4, 15, -18, -5, -14, 21, 0, -20, 0],
  ],
  Kick: [
    [0, .05, 4, 17, -14, -6, -13, 21, 0, -21, 0],
    [.24, -.22, 6, 12, -19, -14, -13, 22, -36, -16, 0],
    [.40, -.48, 2, -3, -17, -22, -9, 54, -46, -12, 0],
    [.57, -.4, 4, 4, -14, -20, -8, 52, -42, -13, 0],
    [.79, -.1, 6, 15, -17, -9, -12, 23, -28, -17, 0],
    [1, .05, 4, 17, -14, -6, -13, 21, 0, -21, 0],
  ],
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
    [.30, -.6, 0, -2, -22, -32, 12, 55, -62, -29, -22],
    [.58, -.48, 0, 12, -16, -28, 14, 54, -57, -31, -18],
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
const CROSS = [
  [0, .04, 5, 13, -18, -5, -14, 21, 0, -20, 0],
  [.24, -.30, 9, 16, -17, -18, -8, 22, 0, -24, 0],
  [.36, .58, 4, 9, -20, 45, -5, 31, 0, -24, 0],
  [.55, .42, 4, 10, -17, 37, 3, 31, 0, -22, 0],
  [1, .06, 4, 15, -18, -5, -14, 21, 0, -20, 0],
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

// Yaw turns around the upright axis, not a screen-space somersault.
// Finish the turn at the actual contact time so the strike still faces its target.
export function attackTurn(f) {
  const a = f.attack;
  if (!f.alive || !a || f.weapon !== 'None' || f.z > 1 || f.stun > 0 || f.heldBy != null) return { yaw: 0, torsoYaw: 0 };
  const profile = styleProfile(f.style);
  const special = a.finisher ? profile.finisher : profile.signature;
  const contact = a.contactAt ?? (a.signature ? special.timing.windup : { Punch: .10, Kick: .18, Uppercut: .23, Grab: .16, Dash: .12 }[a.name]);
  if (!contact) return { yaw: 0, torsoYaw: 0 };
  const t = a.elapsed, end = a.duration;
  const spin = a.name === 'Kick' && ['Ninja', 'Kickboxing', 'Taekwondo'].includes(f.style)
    && (a.signature || a.variant === 1 && f.style !== 'Ninja');
  const yaw = spin ? sampleTrack([[0, 0], [contact * .25, -.22], [contact * .58, Math.PI * .8],
    [contact * .85, Math.PI * 1.7], [contact, Math.PI * 2],
    [Math.min(end - .03, contact + .08), Math.PI * 2 + .16], [end, Math.PI * 2]], t)[0] : 0;
  const twist = a.name === 'Punch' ? .72 : a.name === 'Uppercut' ? .58 : a.name === 'Grab' ? .8 : a.name === 'Kick' ? .45 : .28;
  const direction = a.name === 'Punch' && a.variant === 1 ? -1 : 1;
  const torsoYaw = sampleTrack([[0, 0], [contact * .65, -twist], [contact, twist * .85],
    [contact + (end - contact) * .28, twist * .3], [end, 0]], t)[0] * direction;
  return { yaw, torsoYaw };
}

// Project authored IK into a shallow 3D turn. The support foot is the pivot;
// vertical coordinates never change, and Canvas stroke widths remain stable.
export function projectPose(p) {
  if (!p.yaw && !p.torsoYaw) return p;
  const cosine = Math.cos(p.yaw), sine = Math.sin(p.yaw);
  // Keep the spine readable edge-on. Limbs wrap around it, rather than
  // mirroring the whole body into a thin, sliding stick.
  const width = .72 + .28 * Math.abs(cosine * Math.cos(p.torsoYaw));
  const torso = point => [p.hip[0] + (point[0] - p.hip[0]) * width, point[1]];
  const shoulder = torso(p.shoulder), angle = p.yaw + p.torsoYaw;
  const arm = (point, depth) => [shoulder[0] + (point[0] - p.shoulder[0]) * Math.cos(angle) + depth * Math.sin(angle), point[1]];
  const leg = (point, depth) => [p.hip[0] + (point[0] - p.hip[0]) * cosine + depth * sine, point[1]];
  return { ...p, hip: [...p.hip], ...(p.waist ? { waist: torso(p.waist) } : {}), shoulder, head: torso(p.head),
    main: { joint: arm(p.main.joint, -5), tip: arm(p.main.tip, -9) },
    off: { joint: arm(p.off.joint, 5), tip: arm(p.off.tip, 9) },
    front: { joint: leg(p.front.joint, -4), tip: leg(p.front.tip, -7) },
    back: { joint: [...p.back.joint], tip: [...p.back.tip] } };
}
export function computePose(f) {
  const moving = f.alive && ['walk', 'run', 'evade'].includes(f.state), running = f.alive && ['run', 'evade'].includes(f.state);
  const phase = (f.stridePhase || 0) * (f.intent === 'flee' ? -1 : 1), wave = Math.sin(phase), other = Math.sin(phase + Math.PI);
  let lean = moving ? running ? .35 : .1 : Math.sin(f.age * 2.8 + f.id) * .025;
  let crouch = moving ? -Math.abs(Math.sin(phase)) * (running ? 5 : 2) : 2 + Math.sin(f.age * 2.8 + f.id) * 1.2;
  let main = [16 + (moving ? other * 17 : 0), -17 + (moving ? wave * 10 : 0)];
  let off = [-5 + (moving ? wave * 18 : 0), -12 + (moving ? other * 10 : 0)];
  let front = [21, 0], back = [-20, 0], drive = 0;
  if (moving) {
    const stride = running ? 31 : 18, lift = running ? 23 : 8;
    front = [wave * stride, -Math.max(0, Math.cos(phase)) * lift];
    back = [-wave * stride, -Math.max(0, -Math.cos(phase)) * lift];
  } else if (f.z > 1) { front = [19, -18]; back = [-18, -8]; }
  const stance = STANCES[f.style];
  if (stance && f.weapon === 'None' && f.z <= 1) {
    [lean, crouch] = stance; main = stance.slice(2, 4); off = stance.slice(4, 6);
    if (!moving) { front = stance.slice(6, 8); back = stance.slice(8, 10); }
    if (moving) {
      if (f.style === 'Ninja') {
        lean = running ? .65 : .35; crouch += 3;
        main = [-12 + wave * 5, 11]; off = [-25, 12 + other * 5];
      } else if (f.style === 'Boxing') {
        crouch += Math.abs(wave) * 2;
        front = [wave * (running ? 22 : 16), -Math.max(0, Math.cos(phase)) * (running ? 7 : 4)];
        back = [-wave * (running ? 22 : 16), -Math.max(0, -Math.cos(phase)) * (running ? 7 : 4)];
        main[1] += wave * 2; off[1] -= wave * 2;
      } else if (f.style === 'Judo') {
        front = [wave * (running ? 26 : 20), -Math.max(0, Math.cos(phase)) * (running ? 10 : 6)];
        back = [-wave * (running ? 26 : 20), -Math.max(0, -Math.cos(phase)) * (running ? 10 : 6)];
      } else if (f.style === 'Taekwondo') {
        lean = running ? .17 : -.06; crouch += Math.abs(wave) * 2;
        front = [wave * (running ? 30 : 23), -Math.max(0, Math.cos(phase)) * (running ? 17 : 9)];
        back = [-wave * (running ? 30 : 23), -Math.max(0, -Math.cos(phase)) * (running ? 17 : 9)];
      } else { lean += running ? .2 : .05; main[1] += wave * 3; off[1] -= wave * 3; }
    } else { crouch += Math.sin(f.age * 4 + f.id) * .7; }
  }
  if (f.attack) {
    const authored = martialTrack(f);
    const weaponKeys = f.weapon === 'Sword' && f.attack.variant === 1 ? SWORD_RISING : WEAPON_TRACKS[f.weapon];
    const keys = f.attack.signature ? (f.attack.finisher && FINISHER_TRACKS[f.style]) || SIGNATURE_TRACKS[f.style] || TRACKS[f.attack.name] : f.attack.name === 'WeaponStrike' ? weaponKeys || TRACKS.WeaponStrike
      : f.style === 'Taekwondo' && f.attack.name === 'Kick' && f.attack.variant === 1 ? TAEKWONDO_ROUNDHOUSE
        : STYLE_TRACKS[f.style]?.[f.attack.name] || (f.style === 'Kickboxing' && f.attack.name === 'Kick' && f.attack.variant === 1 ? ROUNDHOUSE
        : f.attack.name === 'Punch' && f.attack.variant === 1 ? CROSS : TRACKS[f.attack.name]);
    const a = f.attack;
    const special = a.finisher ? styleProfile(f.style).finisher : styleProfile(f.style).signature;
    const contact = a.contactAt ?? (a.signature ? special.timing.windup : { Punch: .10, Kick: .18, Dash: .12, Uppercut: .23 }[a.name]);
    // New ordinary and signature poses reach full extension at real contact.
    const progress = authored && contact && a.name !== 'Grab' ? a.elapsed <= contact ? a.elapsed / contact * .4
      : .4 + (a.elapsed - contact) / (a.duration - contact) * .6 : a.elapsed / a.duration;
    const k = sampleTrack(authored || keys, progress);
    [lean, crouch] = k; main = k.slice(2, 4); off = k.slice(4, 6); front = k.slice(6, 8); back = k.slice(8, 10);
    drive = k[10] || 0;
    if (!authored && f.style === 'Boxing' && f.attack.name === 'Punch') {
      if (f.attack.variant === 1) main = [11, -24]; else off = [3, -23];
    }
    if (!authored && f.style === 'Ninja' && f.attack.name === 'Dash') { lean += .12; crouch += 8; }
  }
  if (!moving && !f.attack) {
    if (f.weapon === 'Hammer') { main = [12, -12]; off = [2, -8]; }
    if (f.weapon === 'Staff') main = [17, 2];
  }
  if (f.alive && moving && f.intent === 'flee' && !f.attack && !f.defense && f.z === 0) {
    lean = (f.style === 'Ninja' ? -.38 : -.22) + Math.sin(f.age * 8) * .06;
    crouch = 8 + Math.abs(wave) * 3;
    main = [17, -21 + wave * 3]; off = [-8, -12 - wave * 5];
  }
  if (f.alive && f.defense && f.z === 0) {
    const d = f.defense, guard = d.kind === 'guard';
    const amount = guard ? clamp(Math.min(d.elapsed / .05, (d.duration - d.elapsed) / .08), 0, 1)
      : Math.sin(clamp(d.elapsed / d.duration, 0, 1) * Math.PI);
    const base = STANCES[f.style] || STANCES.Kickboxing;
    const target = (guard ? MARTIAL_GUARDS : MARTIAL_DODGES)[f.style]
      || (guard ? MARTIAL_GUARDS.Kickboxing : MARTIAL_DODGES.Kickboxing);
    const k = base.map((v, i) => lerp(v, target[i], amount));
    [lean, crouch] = k; main = k.slice(2, 4); off = k.slice(4, 6); front = k.slice(6, 8); back = k.slice(8, 10);
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
  // Absorb a landing with bent knees while both feet stay on the floor.
  if (f.alive && f.landing > 0 && f.z === 0) {
    crouch += Math.sin(clamp(f.landing / .10, 0, 1) * Math.PI) * 11;
    front = [22, 0]; back = [-21, 0];
  }
  let rotation = f.tumble || 0;
  if (f.alive && f.attack?.name === 'JumpKick') {
    const progress = f.attack.elapsed / f.attack.duration;
    rotation = sampleTrack([[0, 0], [.25, -.18], [.42, -.25], [.7, -.10], [1, 0]], progress)[0];
  }
  if (!f.alive) {
    // One inert pose: no breathing, flailing, or recovery cycle after defeat.
    lean = -.08; crouch = 0; weaponAngle = .35;
    main = [21, 19]; off = [-21, 11]; front = [24, -2]; back = [-18, 1];
    rotation = f.z > 0 ? f.tumble || 0 : -Math.PI / 2;
  } else if (f.state === 'held') { rotation = f.heldSignature ? -.45 - clamp(f.heldProgress || 0, 0, 1) * 1.1 : f.heldStyle === 'Judo' ? -.65 : -1.5; main = [20, 19]; off = [-23, 16]; front = [24, -14]; back = [-22, -7]; }
  else if (f.stun > 0 && f.state === 'hit' && f.z === 0) {
    // A short chest/head recoil, not a knockdown or airborne flail.
    const recoil = Math.sin(clamp(f.stun / .16, 0, 1) * Math.PI * .8);
    lean = (f.hitSide || -1) * .85 * recoil;
    crouch = (STANCES[f.style]?.[1] || 5) + 9 * recoil; rotation = 0;
    main = [10, -17]; off = [-10, -9]; front = [23, 0]; back = [-22, 0];
  } else if (f.stun > 0) {
    const flail = Math.sin(f.age * 15 + f.id);
    main = [18, 12 + flail * 20]; off = [-24, -4 - flail * 17]; front = [23, -8 - flail * 12]; back = [-23, -12 + flail * 8];
    lean = -.2;
    if (f.z === 0) rotation = f.alive ? -.8 * Math.min(1, f.stun * 3) : -1.5;
  }
  if (!f.alive || f.stun > 0 || f.heldBy != null || f.defense || f.landing > 0) drive = 0;
  const hip = [drive, -51 + crouch], shoulder = [hip[0] + Math.sin(lean) * 39, hip[1] - Math.cos(lean) * 39];
  const head = [shoulder[0] + Math.sin(lean) * 16, shoulder[1] - Math.cos(lean) * 16];
  const arm = target => solveLimb(shoulder, [shoulder[0] + target[0], shoulder[1] + target[1]], 23, 23, 1);
  const leg = foot => solveLimb(hip, foot, 29, 29, -1);
  return { hip, shoulder, head, main: arm(main), off: arm(off), front: leg(front), back: leg(back), rotation, weaponAngle, ...attackTurn(f) };
}
