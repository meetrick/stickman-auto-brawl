import { clamp } from './random.js';

// Presentation only: never consumes match RNG or changes the simulation.
export class SpectatorCamera {
  reset() { this.focusId = null; this.holdUntil = 0; this.view = null; }
  constructor() { this.reset(); }
  frame(world, width, height, closeUp, reducedMotion = false) {
    const alive = world.fighters.filter(f => f.alive);
    let actor = alive.find(f => f.id === this.focusId);
    if (closeUp && (!actor || world.time >= this.holdUntil)) {
      const event = world.events.find(e => world.time - e.time < 2 && ['hit', 'domino', 'explosion', 'demo'].includes(e.type));
      actor = alive.find(f => f.id === event?.fighter) || alive.find(f => f.attack || f.stun > 0) || alive[0];
      this.focusId = actor?.id; this.holdUntil = world.time + 2;
    }
    let scale = Math.min(width / 1200, height / 680), x = 600, y = 340;
    if (closeUp && actor) {
      scale = Math.min(height / 480, Math.max(width / 640, Math.min(height / 620, width / 460)));
      const buddy = alive.filter(f => f !== actor).sort((a, b) => Math.hypot(a.x - actor.x, a.y - actor.y) - Math.hypot(b.x - actor.x, b.y - actor.y))[0] || actor;
      const halfW = width / scale / 2, halfH = height / scale / 2;
      x = halfW >= 600 ? 600 : clamp((actor.x + buddy.x) / 2, halfW, 1200 - halfW);
      const targetY = (actor.y - actor.z + buddy.y - buddy.z) / 2 - 55;
      y = halfH >= 420 ? 320 : clamp(targetY, -100 + halfH, 740 - halfH);
    }
    const previous = this.view;
    const changed = !previous || previous.closeUp !== closeUp || previous.width !== width || previous.height !== height || world.time < previous.time;
    if (previous && !changed) {
      // A damped two-second hold avoids jumping between every impact.
      const dt = Math.max(0, Math.min(world.time - previous.time, .1));
      const blend = reducedMotion ? 0 : 1 - Math.exp(-dt * 3);
      x = previous.x + (x - previous.x) * blend;
      y = previous.y + (y - previous.y) * blend;
    }
    this.view = { x, y, scale, width, height, closeUp, time: world.time };
    return this.view;
  }
}
