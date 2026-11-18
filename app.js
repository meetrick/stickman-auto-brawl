import { Fighter } from './fighter.js';
import { seededRandom } from './random.js';
import { resolveDominoes } from './collisions.js';
import { HazardManager } from './hazards.js';
import { Arena } from './arena.js';
import { normalizeCount, normalizeName } from './settings.js';
import { normalizeStyle } from './styles.js';

export const STEP = 1 / 120;
export class Match {
  constructor(seed = 1, count = 8, { showcase = false, terrain = false, names = [], styles = [] } = {}) {
    count = normalizeCount(count);
    this.seed = seed >>> 0; this.rng = seededRandom(this.seed);
    this.bounds = { left: 100, right: 1100, top: 245, bottom: 580 };
    this.time = 0; this.events = []; this.effects = []; this.winner = null; this.finished = false;
    this.eliminations = []; this.eliminatedIds = new Set(); this.timedOut = false;
    this.stats = { hits: 0, crits: 0, dominoes: 0, explosions: 0, heals: 0, barHits: 0, wallHits: 0, wallBreaks: 0, luckyBounces: 0, spikes: 0 };
    this.hazards = new HazardManager();
    this.showcase = showcase;
    this.fighters = Array.from({ length: count }, (_, id) => {
      const angle = id / count * Math.PI * 2;
      const fighter = new Fighter(id, 600 + Math.cos(angle) * 290, 412 + Math.sin(angle) * 115, this.rng);
      fighter.name = normalizeName(names[id], id);
      if (normalizeStyle(styles[id]) !== 'Random') fighter.style = styles[id];
      return fighter;
    });
    if (showcase && count >= 4) this.stageShowcase();
    this.arena = terrain ? new Arena(this.seed, this.bounds, this.fighters) : null;
  }
  stageShowcase() {
    // A labeled demonstration uses actual physics, not fabricated event counters.
    const [a, b, c, d] = this.fighters;
    for (const [i, f] of this.fighters.entries()) {
      f.x = 210 + i * 100; f.y = i < 3 ? 395 : 520;
      f.readyAt = 2.8; f.cooldown = 2.8;
    }
    a.x = 240; b.x = 308; c.x = 376;
    a.receiveHit(0, 450, 0, 190);
    d.x = 720; d.y = 465;
    this.emit('demo', a, { text: 'CHAOS DEMO' });
  }
  emit(type, fighter, detail = {}) {
    const event = { type, fighter: fighter.id, x: fighter.x, y: fighter.y, z: fighter.z, time: this.time, ...detail };
    this.events.unshift(event); this.events.length = Math.min(this.events.length, 60);
    this.effects.push({ ...event, ttl: 1, life: 1 });
    if (type === 'hit') this.stats.hits++;
  }
  recordEliminations() {
    const victims = this.fighters.filter(f => !f.alive && !this.eliminatedIds.has(f.id));
    if (!victims.length) return;
    // One fixed physics step is one batch: never break a simultaneous KO by ID.
    const order = this.eliminations.length + 1;
    const rank = this.fighters.length - this.eliminations.length - victims.length + 1;
    for (const f of victims) {
      const entry = { fighterId: f.id, time: this.time, order, rank, tied: victims.length > 1 };
      this.eliminations.push(entry); this.eliminatedIds.add(f.id);
      this.emit('elimination', f, { text: 'ELIMINATED', rank, tied: entry.tied });
    }
  }
  get standings() {
    const alive = this.fighters.filter(f => f.alive);
    const survivors = alive.map(f => ({ fighterId: f.id,
      rank: this.finished ? 1 : null, tied: this.finished && alive.length > 1,
      time: null, order: null }));
    return [...survivors, ...this.eliminations].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0) || a.fighterId - b.fighterId);
  }
  update(dt = STEP) {
    if (this.finished) return;
    this.dt = dt; this.time += dt;
    for (const fighter of this.fighters) fighter.update(dt, this);
    this.arena?.update(this);
    resolveDominoes(this);
    this.hazards.update(dt, this);
    this.recordEliminations();
    for (const effect of this.effects) effect.ttl -= dt;
    this.effects = this.effects.filter(e => e.ttl > 0);
    const alive = this.fighters.filter(f => f.alive);
    if (alive.length <= 1 || this.time >= 90) {
      this.finished = true;
      this.timedOut = alive.length > 1;
      this.winner = alive.length === 1 ? alive[0] : null;
      for (const fighter of this.fighters) if (!fighter.alive) fighter.settleDeath(this);
    }
  }
}

if (typeof document !== 'undefined') import('./ui.js').then(({ boot }) => boot());
