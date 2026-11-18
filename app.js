import { Fighter } from './fighter.js';
import { seededRandom } from './random.js';
import { Renderer } from './renderer.js';
import { resolveDominoes } from './collisions.js';
import { HazardManager } from './hazards.js';
import { Arena } from './arena.js';

export const STEP = 1 / 120;
export class Match {
  constructor(seed = 1, count = 8, { showcase = false, terrain = true } = {}) {
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
    this.arena = terrain ? new Arena(this.seed, this.bounds, this.fighters) : null;
    if (this.arena) for (let i = 0; i < this.arena.mineCount; i++) this.hazards.spawn(this, 'mine');
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
  const $ = selector => document.querySelector(selector);
  const renderer = new Renderer($('canvas'));
  const mobile = matchMedia('(max-width: 800px), (max-width: 950px) and (max-height: 500px) and (orientation: landscape)');
  const rosterPanel = $('#fighters-panel'), tools = $('#tools');
  const cards = new Map();
  let match, paused = false, speed = 1, accumulator = 0, last = 0, uiClock = 0, lastEvent = null;
  const text = (node, value) => { if (node.textContent !== String(value)) node.textContent = value; };
  function updateCameraLabel() {
    text($('#camera'), renderer.overview ? '◎ Auto camera' : '⊞ Overview');
    $('#camera').setAttribute('aria-pressed', String(renderer.overview));
    text($('#mode'), match.showcase ? 'CHAOS DEMO' : mobile.matches && !renderer.overview ? 'AUTO CAMERA' : 'THE COURTYARD');
  }
  function start(seed, showcase = false) {
    match = new Match(seed, 8, { showcase }); paused = false; accumulator = 0;
    renderer.camera.reset(); renderer.dirty = true; lastEvent = null;
    tools.open = false;
    text($('#pause'), 'Ⅱ Pause'); $('#pause').setAttribute('aria-pressed', 'false');
    text($('#seed'), String(match.seed).padStart(6, '0'));
    $('#roster').innerHTML = match.fighters.map(f => `<article class="fighter-card" data-id="${f.id}"><span class="swatch" style="--fighter:${f.color}">${String(f.id + 1).padStart(2, '0')}</span><div class="fighter-info"><strong>${f.name}</strong><span>${f.personality}</span><div class="hp-track"><i style="background:${f.color}"></i></div></div><div class="fighter-numbers"><b><span class="hp"></span><small> / ${f.maxHp}</small></b><span>SPD ${Math.round(f.speed)} · ATK ${f.power.toFixed(2)}</span></div></article>`).join('');
    cards.clear();
    for (const node of $('#roster').children) cards.set(Number(node.dataset.id), { node, hp: node.querySelector('.hp'), bar: node.querySelector('.hp-track i') });
    text($('#map-info'), match.arena ? `${match.arena.name} · ${match.arena.walls.length} walls · ${match.arena.traps.length} spike traps` : 'Open courtyard');
    updateCameraLabel(); updateUI();
  }
  function updateUI() {
    text($('#clock'), `${Math.floor(match.time / 60).toString().padStart(2, '0')}:${Math.floor(match.time % 60).toString().padStart(2, '0')}`);
    const alive = match.fighters.filter(f => f.alive).length;
    text($('#alive'), `${alive} / ${match.fighters.length}`); text($('#arena-alive'), `${alive} left`);
    for (const f of match.fighters) {
      const card = cards.get(f.id);
      card.node.classList.toggle('out', !f.alive);
      text(card.hp, f.alive ? Math.ceil(f.hp) : 'KO');
      const width = `${f.hp / f.maxHp * 100}%`;
      if (card.bar.style.width !== width) card.bar.style.width = width;
    }
    if (lastEvent !== match.events[0]) {
      lastEvent = match.events[0];
      $('#events').innerHTML = match.events.slice(0, 5).map(e => `<li><time>${e.time.toFixed(1)}s</time><span>${match.fighters[e.fighter].name} <b>${e.text || e.type}</b></span></li>`).join('') || '<li class="quiet">The arena is holding its breath.</li>';
    }
    text($('#status'), match.finished ? 'ROUND OVER' : paused ? 'PAUSED' : 'LIVE MATCH');
    $('#pause').disabled = match.finished;
    $('#result').hidden = !match.finished && !paused;
    if (match.finished || paused) {
      text($('#result-caption'), match.finished ? match.winner ? 'LAST STICK STANDING' : 'NO WINNER THIS ROUND' : 'TAKE A BREATHER');
      text($('#result-title'), paused ? 'Paused.' : match.winner ? `${match.winner.name} wins.` : 'A glorious draw.');
      text($('#result-hint'), paused ? 'Tap Resume when you’re ready.' : 'Tap New match. Let chaos roll again.');
    }
    const moment = match.events.find(e => e.crit || ['explosion', 'domino', 'heal'].includes(e.type));
    $('#moment').hidden = paused || match.finished || !moment || match.time - moment.time > 1.8;
    if (moment) {
      text($('#moment'), `${match.fighters[moment.fighter].name} · ${moment.text}`);
      $('#moment').dataset.kind = moment.crit ? 'crit' : moment.type;
    }
    for (const key of ['crits', 'dominoes', 'explosions', 'heals']) text($(`#${key}`), match.stats[key]);
  }
  $('#new-match').onclick = () => start(crypto.getRandomValues(new Uint32Array(1))[0]);
  $('#replay').onclick = () => start(match.seed, match.showcase);
  $('#demo').onclick = () => start(72, true);
  $('#pause').onclick = () => {
    if (match.finished) return;
    paused = !paused; renderer.dirty = true;
    text($('#pause'), paused ? '▶ Resume' : 'Ⅱ Pause');
    $('#pause').setAttribute('aria-pressed', String(paused)); updateUI();
  };
  $('#speed').onclick = () => {
    speed = speed === 1 ? 2 : speed === 2 ? .5 : 1;
    text($('#speed'), `${speed}× Speed`); $('#speed').setAttribute('aria-label', `Playback speed: ${speed} times`);
  };
  $('#camera').onclick = () => { renderer.overview = !renderer.overview; renderer.dirty = true; updateCameraLabel(); };
  document.addEventListener('pointerdown', event => { if (!tools.contains(event.target)) tools.open = false; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && tools.open) { tools.open = false; tools.querySelector('summary').focus(); } });
  document.addEventListener('visibilitychange', () => { last = 0; accumulator = 0; });
  rosterPanel.open = !mobile.matches;
  $('.event-panel').open = !mobile.matches;
  mobile.addEventListener('change', () => { rosterPanel.open = !mobile.matches; $('.event-panel').open = !mobile.matches; renderer.dirty = true; updateCameraLabel(); });
  const params = new URLSearchParams(location.search);
  start(Number(params.get('seed') || crypto.getRandomValues(new Uint32Array(1))[0]), params.get('demo') === '1');
  function frame(now) {
    const elapsed = last ? Math.min((now - last) / 1000, .1) : 0; last = now;
    if (!document.hidden) {
      let advanced = false;
      if (!paused && !match.finished) {
        accumulator += elapsed * speed;
        while (accumulator >= STEP) { match.update(); accumulator -= STEP; advanced = true; }
      }
      if (advanced || (!paused && !match.finished) || renderer.dirty) renderer.draw(match);
      uiClock += elapsed;
      if (uiClock > .1) { updateUI(); uiClock = 0; }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
