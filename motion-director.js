import { cinematicSample, rigPose, contactLeg } from './cinematic-rig.js?v=20261119-cinema';
import { computePose, projectPose, attackTurn } from './pose.js?v=20261119-cinema';

export const fighterScale = f => .83 + (f.y - 245) / 335 * .23;
const projectRig = (f, rig, contacts) => {
  const turn = attackTurn(f);
  // The new rig already authors shoulder loading and extension. Applying the
  // old torso squash as well would shorten a fully extended jab a second time.
  return projectPose({ ...rigPose(rig, contacts), yaw: turn.yaw, torsoYaw: 0 });
};
export function visualPose(f) {
  const sample = cinematicSample(f);
  if (!sample) return projectPose(computePose(f));
  return projectRig(f, sample.rig, sample.contacts);
}

// Renderer-owned state only: never writes to a Fighter or consumes world RNG.
export class MotionDirector {
  constructor() { this.reset(); }
  reset() { this.states = new WeakMap(); }
  poseFor(f, time, identity = f) {
    const sample = cinematicSample(f);
    if (!sample) { this.states.delete(identity); return projectPose(computePose(f)); }
    let state = this.states.get(identity);
    if (!state || time < state.time || time - state.time > .25 || state.facing !== f.facing) {
      state = { key: '', current: sample.rig, from: sample.rig, entered: time, time,
        facing: f.facing, anchors: [null, null], contacts: [false, false] };
      this.states.set(identity, state);
    }
    if (time === state.time && state.output) return state.output;
    const key = `${f.style}:${sample.clip}:${f.attack?.serial ?? ''}`;
    if (key !== state.key) {
      state.key = key; state.from = [...state.current]; state.entered = time;
      state.duration = f.attack ? Math.min(.065, (sample.contact || .12) * .45) : sample.clip === 'hit' ? .035 : .16;
      state.priorContacts = [...state.contacts];
    }
    let mix = Math.min(1, (time - state.entered) / state.duration);
    if (f.attack && f.attack.elapsed >= (sample.contact || .12)) mix = 1;
    const smooth = mix * mix * (3 - 2 * mix);
    const rig = sample.rig.map((v, i) => state.from[i] + (v - state.from[i]) * smooth);
    const contacts = sample.contacts.map((contact, i) => contact && (mix >= .7 || state.priorContacts[i] || !state.output));
    const scale = fighterScale(f), world = p => ({ x: f.x + p[0] * scale * f.facing, y: f.y + p[1] * scale });
    let p = projectRig(f, rig, contacts);
    for (let i = 0; i < 2; i++) {
      if (!contacts[i] || sample.clip === 'rush') { state.anchors[i] = null; continue; }
      if (!state.anchors[i]) state.anchors[i] = world((i ? p.back : p.front).tip);
    }
    const targets = state.anchors.map(anchor => anchor ? [(anchor.x - f.x) / (scale * f.facing), (anchor.y - f.y) / scale] : null);
    let height = -rig[1];
    targets.forEach((target, i) => {
      if (!target) return;
      const dx = target[0] - rig[0], available = 57.8 ** 2 - dx ** 2;
      const limit = available > 0 ? Math.sqrt(available) - target[1] : 0;
      if (limit < 27) { state.anchors[i] = null; targets[i] = null; }
      else height = Math.min(height, limit);
    });
    height = Math.min(height, (state.height ?? height) + Math.max(0, time - state.time) * 120);
    rig[1] = -height;
    p = projectRig(f, rig, contacts);
    targets.forEach((target, i) => { if (target) p[i ? 'back' : 'front'] = contactLeg(p.hip, target); });
    p.planted = state.anchors.map(Boolean); p.clip = sample.clip;
    state.height = height; state.current = rig; state.contacts = contacts; state.time = time; state.output = p;
    return p;
  }
}
