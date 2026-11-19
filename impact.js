// Presentation time only. Never mutates a match or consumes its seeded RNG.
export class ImpactFeedback {
  constructor() { this.reset(); }
  reset() { this.seen = new WeakSet(); this.clock = 0; this.stop = 0; this.nextAt = 0; this.impulse = null; }
  advance(elapsed, reducedMotion = false) {
    this.clock += elapsed;
    if (reducedMotion) { this.stop = 0; this.impulse = null; return elapsed; }
    const consumed = Math.min(elapsed, this.stop);
    this.stop -= consumed; return elapsed - consumed;
  }
  observe(events, reducedMotion = false) {
    let strongest = 0;
    for (const event of events) {
      if (this.seen.has(event)) continue;
      this.seen.add(event);
      if (event.type !== 'hit') continue;
      const strength = event.crit || event.signature ? 1 : ['Uppercut', 'Grab'].includes(event.move) ? .65 : 0;
      strongest = Math.max(strongest, strength);
    }
    if (!strongest || reducedMotion || this.clock < this.nextAt) return false;
    this.stop = strongest === 1 ? .045 : .025;
    this.impulse = { at: this.clock, strength: strongest };
    this.nextAt = this.clock + .20;
    return true;
  }
  offset(reducedMotion = false) {
    const age = this.impulse ? this.clock - this.impulse.at : 1;
    if (reducedMotion || age >= .16) return { x: 0, y: 0 };
    const amount = this.impulse.strength * 2.2 * Math.pow(1 - age / .16, 2);
    return { x: Math.sin(age * 105) * amount, y: Math.sin(age * 79) * amount * .55 };
  }
}
