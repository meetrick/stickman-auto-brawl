import { Match, STEP } from './app.js';
import { Renderer } from './renderer.js';
import { COLORS } from './fighter.js';
import { MIN_FIGHTERS, MAX_FIGHTERS, SETTINGS_KEY, normalizePreferences, loadPreferences, savePreferences, escapeHTML } from './settings.js';
import { t, eventText, setLanguage, getLanguage } from './i18n.js';

export function boot() {
  const $ = selector => document.querySelector(selector), renderer = new Renderer($('canvas'));
  let storage = null;
  try { storage = window.localStorage; } catch { /* Storage may be disabled in private/embedded browsers. */ }
  let preferences = loadPreferences(storage), draftNames = [...preferences.names];
  setLanguage(preferences.language);
  const mobile = matchMedia('(max-width: 800px), (max-width: 950px) and (max-height: 500px) and (orientation: landscape)');
  const rosterPanel = $('#fighters-panel'), tools = $('#tools'), dialog = $('#setup-dialog'), cards = new Map();
  let match, paused = false, speed = 1, accumulator = 0, last = 0, uiClock = 0, lastEvent = null;
  const text = (node, value) => { if (node.textContent !== String(value)) node.textContent = value; };
  const persist = () => savePreferences(storage, preferences);
  const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
  for (let count = MIN_FIGHTERS; count <= MAX_FIGHTERS; count++) {
    const option = document.createElement('option'); option.value = String(count); $('#fighter-count').append(option);
  }
  function updateCameraLabel() {
    text($('#camera'), t(renderer.overview ? 'autoCameraButton' : 'overview'));
    $('#camera').setAttribute('aria-pressed', String(renderer.overview));
    text($('#mode'), t(match.showcase ? 'demoMode' : mobile.matches && !renderer.overview ? 'autoCamera' : 'courtyard'));
  }
  function renderRoster() {
    $('#roster').innerHTML = match.fighters.map(f => `<article class="fighter-card" data-id="${f.id}"><span class="swatch" style="--fighter:${f.color}">${String(f.id + 1).padStart(2, '0')}</span><div class="fighter-info"><strong>${escapeHTML(f.name)}</strong><span><span class="traits"></span><em class="loadout"></em></span><div class="hp-track"><i style="background:${f.color}"></i></div></div><div class="fighter-numbers"><b><span class="hp"></span><small> / ${f.maxHp}</small></b><span class="stats"></span></div></article>`).join('');
    cards.clear();
    for (const node of $('#roster').children) {
      const id = Number(node.dataset.id); node.querySelector('strong').title = match.fighters[id].name;
      cards.set(id, { node, hp: node.querySelector('.hp'), bar: node.querySelector('.hp-track i'), traits: node.querySelector('.traits'), weapon: node.querySelector('.loadout'), stats: node.querySelector('.stats') });
    }
  }
  function start(seed, showcase = false, setup = preferences) {
    match = new Match(seed, setup.count, { showcase, names: setup.names }); paused = false; accumulator = 0;
    renderer.camera.reset(); renderer.dirty = true; renderer.nameLabels?.clear(); lastEvent = null; tools.open = false;
    text($('#seed'), String(match.seed).padStart(6, '0')); $('#pause').setAttribute('aria-pressed', 'false');
    renderRoster(); updateCameraLabel(); updateUI();
  }
  function updateUI() {
    text($('#clock'), `${Math.floor(match.time / 60).toString().padStart(2, '0')}:${Math.floor(match.time % 60).toString().padStart(2, '0')}`);
    const alive = match.fighters.filter(f => f.alive).length;
    text($('#alive'), `${alive} / ${match.fighters.length}`); text($('#arena-alive'), t('alive', { count: alive }));
    for (const f of match.fighters) {
      const card = cards.get(f.id); card.node.classList.toggle('out', !f.alive);
      text(card.hp, f.alive ? Math.ceil(f.hp) : t('ko'));
      text(card.traits, `${t(f.personality)} · ${t(f.gait)}`); text(card.weapon, t(f.weapon));
      text(card.stats, `${t('spd')} ${Math.round(f.speed)} · ${t('atk')} ${f.power.toFixed(2)}`);
      const width = `${f.hp / f.maxHp * 100}%`; if (card.bar.style.width !== width) card.bar.style.width = width;
    }
    if (lastEvent !== match.events[0]) {
      lastEvent = match.events[0];
      $('#events').innerHTML = match.events.slice(0, 5).map(e => `<li><time>${e.time.toFixed(1)}s</time><span>${escapeHTML(match.fighters[e.fighter].name)} <b>${escapeHTML(eventText(e))}</b></span></li>`).join('') || `<li class="quiet">${t('quiet')}</li>`;
    }
    text($('#map-info'), match.arena ? t('map', { name: t(match.arena.name), bars: match.arena.bars.length }) : t('openCourt'));
    text($('#status'), t(match.finished ? 'roundOver' : paused ? 'paused' : 'live'));
    text($('#pause'), t(paused ? 'resume' : 'pause')); $('#pause').disabled = match.finished;
    text($('#speed'), t('speed', { speed })); $('#speed').setAttribute('aria-label', t('speedLabel', { speed }));
    $('#result').hidden = !match.finished && !paused;
    if (match.finished || paused) {
      text($('#result-caption'), t(match.finished ? match.winner ? 'lastStanding' : 'noWinner' : 'breather'));
      text($('#result-title'), paused ? t('pauseTitle') : match.winner ? t('winner', { name: match.winner.name }) : t('draw'));
      text($('#result-hint'), t(paused ? 'resumeHint' : 'newMatchHint'));
    }
    const moment = match.events.find(e => e.crit || ['domino', 'heal', 'wall', 'bar'].includes(e.type));
    $('#moment').hidden = paused || match.finished || !moment || match.time - moment.time > 1.8;
    if (moment) { text($('#moment'), `${match.fighters[moment.fighter].name} · ${eventText(moment)}`); $('#moment').dataset.kind = moment.crit ? 'crit' : moment.type; }
    text($('#weapon-hits'), match.stats.moves?.WeaponStrike || 0);
    for (const key of ['crits', 'dominoes', 'heals']) text($(`#${key}`), match.stats[key]);
  }
  function translatePage() {
    document.documentElement.lang = getLanguage(); document.title = getLanguage() === 'ko' ? '스틱맨 — 오토 브롤' : 'Stickman — Auto Brawl';
    for (const node of document.querySelectorAll('[data-i18n]')) text(node, t(node.dataset.i18n));
    for (const [selector, key] of [['.brand', 'homeLabel'], ['.arena-panel', 'arenaLabel'], ['canvas', 'canvasLabel'], ['.metrics', 'metricsLabel'], ['.controls', 'controlsLabel'], ['#events', 'eventsLabel']]) $(selector).setAttribute('aria-label', t(key));
    $('#camera').title = t('cameraLabel'); text($('#language'), getLanguage() === 'en' ? '한국어' : 'English');
    $('#language').setAttribute('aria-label', t('switchLanguage')); $('#setup-language').value = getLanguage();
    for (const option of $('#fighter-count').options) option.textContent = t('countOption', { count: option.value });
    for (const input of document.querySelectorAll('#name-fields input')) input.setAttribute('aria-label', t('nameLabel', { number: Number(input.dataset.index) + 1 }));
    lastEvent = null; renderer.dirty = true; updateCameraLabel(); updateUI();
  }
  function changeLanguage(language) {
    setLanguage(language); preferences.language = getLanguage(); persist(); translatePage();
  }
  function collectNames() { for (const input of document.querySelectorAll('#name-fields input')) draftNames[Number(input.dataset.index)] = input.value; }
  function renderNameFields() {
    $('#name-fields').replaceChildren();
    for (let i = 0; i < Number($('#fighter-count').value); i++) {
      const row = document.createElement('label'); row.className = 'name-row'; row.style.setProperty('--fighter', COLORS[i % COLORS.length]);
      const badge = document.createElement('span'); badge.textContent = String(i + 1).padStart(2, '0');
      const input = document.createElement('input'); input.type = 'text'; input.value = draftNames[i]; input.maxLength = 16;
      input.dataset.index = String(i); input.autocomplete = 'off'; input.spellcheck = false; input.setAttribute('autocapitalize', 'off');
      input.setAttribute('aria-label', t('nameLabel', { number: i + 1 })); row.append(badge, input); $('#name-fields').append(row);
    }
  }
  function openSetup() {
    tools.open = false; draftNames = [...preferences.names]; $('#fighter-count').value = String(preferences.count);
    renderNameFields(); dialog.showModal(); accumulator = 0; last = 0;
  }
  $('#fighter-count').onchange = () => { collectNames(); renderNameFields(); };
  $('#language').onclick = () => changeLanguage(getLanguage() === 'en' ? 'ko' : 'en');
  $('#setup-language').onchange = event => changeLanguage(event.target.value);
  $('#new-match').onclick = $('#setup').onclick = openSetup;
  $('#setup-cancel').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { accumulator = 0; last = 0; renderer.dirty = true; $('#new-match').focus({ preventScroll: true }); });
  $('#setup-form').onsubmit = event => {
    event.preventDefault(); collectNames();
    preferences = normalizePreferences({ ...preferences, count: $('#fighter-count').value, names: draftNames }); persist();
    dialog.close(); start(newSeed()); window.scrollTo({ top: 0, behavior: 'auto' });
  };
  $('#replay').onclick = () => start(match.seed, match.showcase, { count: match.fighters.length, names: match.fighters.map(f => f.name) });
  $('#demo').onclick = () => start(72, true, { count: 8, names: preferences.names });
  $('#pause').onclick = () => { if (match.finished) return; paused = !paused; renderer.dirty = true; $('#pause').setAttribute('aria-pressed', String(paused)); updateUI(); };
  $('#speed').onclick = () => { speed = speed === 1 ? 2 : speed === 2 ? .5 : 1; updateUI(); };
  $('#camera').onclick = () => { renderer.overview = !renderer.overview; renderer.dirty = true; updateCameraLabel(); };
  document.addEventListener('pointerdown', event => { if (!tools.contains(event.target)) tools.open = false; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && tools.open) { tools.open = false; tools.querySelector('summary').focus(); } });
  document.addEventListener('visibilitychange', () => { last = 0; accumulator = 0; });
  rosterPanel.open = !mobile.matches; $('.event-panel').open = !mobile.matches;
  mobile.addEventListener('change', () => { rosterPanel.open = !mobile.matches; $('.event-panel').open = !mobile.matches; renderer.dirty = true; updateCameraLabel(); });
  const params = new URLSearchParams(location.search);
  start(Number(params.get('seed') || newSeed()), params.get('demo') === '1'); translatePage();
  let hasSaved = false; try { hasSaved = Boolean(storage?.getItem(SETTINGS_KEY)); } catch { /* Use default preferences. */ }
  if (!hasSaved && !params.has('seed') && !params.has('demo')) openSetup();
  function frame(now) {
    const elapsed = last ? Math.min((now - last) / 1000, .1) : 0; last = now;
    if (!document.hidden) {
      let advanced = false;
      const running = !paused && !match.finished && !dialog.open;
      if (running) { accumulator += elapsed * speed; while (accumulator >= STEP) { match.update(); accumulator -= STEP; advanced = true; } }
      if (advanced || running || renderer.dirty) renderer.draw(match);
      uiClock += elapsed; if (uiClock > .1) { updateUI(); uiClock = 0; }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
