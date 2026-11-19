import { MOVES } from './fighter.js?v=20261119-cinema';
import { STYLES } from './styles.js?v=20261119-cinema';

export const STUDY_DURATION = 12;
export const STUDY_MARKS = { run: .9, ready: 2.3, jab: 3.4, kick: 4.48, hook: 7.23, reaction: 8.27 };
const attacks = [
  { start: 3.3, actor: 0, name: 'Punch', variant: 0 },
  { start: 3.66, actor: 0, name: 'Punch', variant: 1 },
  { start: 4.3, actor: 1, name: 'Kick', variant: 0 },
  { start: 4.95, actor: 1, name: 'Kick', variant: 1 },
  { start: 5.7, actor: 1, name: 'Kick', variant: 0, signature: true },
  { start: 7, actor: 0, name: 'Punch', variant: 0, signature: true },
  { start: 8, actor: 0, name: 'Uppercut', variant: 0 },
];
const defenses = [
  { start: 3.22, actor: 1, kind: 'dodge', duration: .36 },
  { start: 3.7, actor: 1, kind: 'guard', duration: .32 },
  { start: 4.36, actor: 0, kind: 'guard', duration: .32 },
  { start: 4.98, actor: 0, kind: 'dodge', duration: .36 },
  { start: 7.08, actor: 1, kind: 'guard', duration: .32 },
];
export function studyPhase(t) { return t < 2 ? 'run' : t < 3.3 ? 'ready' : t < 9 ? 'exchange' : 'reset'; }

// A labeled, scripted study. These snapshots never update or score a Match.
export function sampleStudyActor(base, index, t) {
  const run = Math.min(2, t), u = Math.max(0, run - 1.5), sign = index ? -1 : 1;
  const traveled = run < 1.5 ? (360 / 7) * run : 540 / 7 + 360 / 7 * u - 360 / 7 * u * u;
  const step = t > 2.5 && t < 3.2;
  const stepT = Math.max(0, Math.min(1, (t - 2.5) / .7));
  let x = -150 + traveled + 20 * stepT;
  let moving = t < 2 || step, retreat = false;
  let speed = t < 2 ? run < 1.5 ? 360 / 7 : 360 / 7 - 720 / 7 * u : step ? 20 / .7 : 0;
  let stride = traveled * .15 + 20 * stepT * .15;
  if (index === 0 && t >= 6.35) {
    const v = Math.min(1, (t - 6.35) / .4); x += 18 * v;
    if (v < 1) { moving = true; speed = 45; stride += 18 * v * .15; }
  }
  if (t >= 9) {
    const v = Math.min(1, t - 9); x -= 22 * v;
    if (v < 1) { moving = true; retreat = true; speed = -22; stride += 22 * v * .15; }
  }
  const f = Object.assign(Object.create(Object.getPrototypeOf(base)), base, { x: x * sign, y: 400, facing: sign,
    age: t, vx: sign * speed, vy: 0, vz: 0, z: 0, stun: 0, landing: 0, defense: null,
    stridePhase: stride, state: moving ? t < 2 ? 'run' : 'walk' : 'idle', intent: retreat ? 'flee' : 'chase', attack: null });
  for (const event of attacks) if (event.actor === index) {
    const special = event.signature ? STYLES[f.style].signature : null;
    const move = { ...MOVES[event.name], ...special?.timing };
    if (t >= event.start && t < event.start + move.duration) {
      f.attack = { name: event.name, variant: event.variant, signature: special?.text || null, finisher: false,
        serial: Math.round(event.start * 100), elapsed: t - event.start, duration: move.duration,
        contactAt: move.windup, targetId: index ? 0 : 1, resolved: t - event.start >= move.windup };
      f.state = 'attack'; f.intent = 'attack';
    }
  }
  for (const event of defenses) if (event.actor === index && t >= event.start && t < event.start + event.duration) {
    f.defense = { kind: event.kind, elapsed: t - event.start, duration: event.duration };
    f.state = event.kind; f.intent = event.kind;
  }
  const contact = index === 0 ? 5.97 : 8.23;
  if (t >= contact && t < contact + .16) { f.stun = .16 - (t - contact); f.state = 'hit'; f.hitSide = -1; f.attack = null; }
  return f;
}
