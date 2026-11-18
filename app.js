import { Fighter } from './fighter.js';
import { seededRandom } from './random.js';
import { Renderer } from './renderer.js';
import { resolveDominoes } from './collisions.js';
import { HazardManager } from './hazards.js';

export const STEP = 1 / 120;
export class Match {
  constructor(seed = 1, count = 8, { showcase = false } = {}) {
    this.seed = seed >>> 0; this.rng = seededRandom(this.seed);
    this.bounds = { left: 100, right: 1100, top: 245, bottom: 580 };
    this.time = 0; this.events = []; this.effects = []; this.winner = null; this.finished = false;
    this.stats = { hits: 0, crits: 0, dominoes: 0, explosions: 0, heals: 0 };
    this.hazards = new HazardManager();
    this.showcase = showcase;
    this.fighters = Array.from({ length: count }, (_, id) => {
      const angle = id / count * Math.PI * 2;
      return new Fighter(id, 600 + Math.cos(angle) * 290, 412 + Math.sin(angle) * 115, this.rng);
    });
    if (showcase && count >= 4) this.stageShowcase();
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
    this.hazards.spawn(this, 'mine', { x: d.x, y: d.y });
    this.emit('demo', a, { text: 'CHAOS DEMO' });
  }
  emit(type, fighter, detail = {}) {
    const event = { type, fighter: fighter.id, x: fighter.x, y: fighter.y, z: fighter.z, time: this.time, ...detail };
    this.events.unshift(event); this.events.length = Math.min(this.events.length, 60);
    this.effects.push({ ...event, ttl: 1, life: 1 });
    if (type === 'hit') this.stats.hits++;
  }
  update(dt = STEP) {
    if (this.finished) return;
    this.time += dt;
    for (const fighter of this.fighters) fighter.update(dt, this);
    resolveDominoes(this);
    this.hazards.update(dt, this);
    for (const effect of this.effects) effect.ttl -= dt;
    this.effects = this.effects.filter(e => e.ttl > 0);
    const alive = this.fighters.filter(f => f.alive);
    if (alive.length <= 1 || this.time >= 90) {
      this.finished = true;
      this.winner = alive.length === 1 ? alive[0] : null;
    }
  }
}

if (typeof document !== 'undefined') {
  const canvas = document.querySelector('canvas');
  const renderer = new Renderer(canvas);
  let match, paused = false, speed = 1, accumulator = 0, last = 0, uiClock = 0;
  function start(seed, showcase = false) {
    match = new Match(seed, 8, { showcase }); paused = false; accumulator = 0;
    document.querySelector('#pause').textContent = 'Ⅱ Pause';
    document.querySelector('#seed').textContent = String(match.seed).padStart(6, '0');
    document.querySelector('#mode').textContent = showcase ? 'CHAOS DEMO / STAGED OPENING' : 'NO TEAMS. NO MERCY.';
    updateUI();
  }
  function updateUI() {
    document.querySelector('#clock').textContent = `${Math.floor(match.time / 60).toString().padStart(2, '0')}:${Math.floor(match.time % 60).toString().padStart(2, '0')}`;
    document.querySelector('#alive').textContent = `${match.fighters.filter(f => f.alive).length} / ${match.fighters.length}`;
    document.querySelector('#roster').innerHTML = match.fighters.map(f => `<article class="fighter-card ${f.alive ? '' : 'out'}"><span class="swatch" style="--fighter:${f.color}">${String(f.id + 1).padStart(2, '0')}</span><div class="fighter-info"><strong>${f.name}</strong><span>${f.personality}</span><div class="hp-track"><i style="width:${f.hp / f.maxHp * 100}%;background:${f.color}"></i></div></div><div class="fighter-numbers"><b>${Math.ceil(f.hp)}<small> / ${f.maxHp}</small></b><span>SPD ${Math.round(f.speed)} · ATK ${f.power.toFixed(2)}</span></div></article>`).join('');
    document.querySelector('#events').innerHTML = match.events.slice(0, 5).map(e => `<li><time>${e.time.toFixed(1)}s</time><span>${match.fighters[e.fighter].name} <b>${e.text || e.type}</b></span></li>`).join('') || '<li class="quiet">The arena is holding its breath.</li>';
    document.querySelector('#status').textContent = match.finished ? (match.winner ? `${match.winner.name} WINS` : 'DRAW') : paused ? 'PAUSED' : 'LIVE MATCH';
    for (const key of ['crits', 'dominoes', 'explosions', 'heals']) document.querySelector(`#${key}`).textContent = match.stats[key];
  }
  document.querySelector('#new-match').onclick = () => start(crypto.getRandomValues(new Uint32Array(1))[0]);
  document.querySelector('#replay').onclick = () => start(match.seed, match.showcase);
  document.querySelector('#demo').onclick = () => start(72, true);
  document.querySelector('#pause').onclick = () => { paused = !paused; document.querySelector('#pause').textContent = paused ? '▶ Resume' : 'Ⅱ Pause'; updateUI(); };
  document.querySelector('#speed').onclick = event => { speed = speed === 1 ? 2 : speed === 2 ? .5 : 1; event.target.textContent = `${speed}× Speed`; };
  const params = new URLSearchParams(location.search);
  start(Number(params.get('seed') || crypto.getRandomValues(new Uint32Array(1))[0]), params.get('demo') === '1');
  function frame(now) {
    const elapsed = last ? Math.min((now - last) / 1000, .1) : 0; last = now;
    if (!paused && !match.finished) {
      accumulator += elapsed * speed;
      while (accumulator >= STEP) { match.update(); accumulator -= STEP; }
    }
    renderer.draw(match, paused);
    uiClock += elapsed;
    if (uiClock > .1) { updateUI(); uiClock = 0; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
