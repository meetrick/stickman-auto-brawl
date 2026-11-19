import { Match, STEP } from './app.js?v=20261119-headline';
import { Renderer } from './renderer.js?v=20261119-headline';
import { loadPreferences } from './settings.js?v=20261119-headline';
import { MotionDirector, fighterScale } from './motion-director.js?v=20261119-headline';
import { sampleStudyActor, studyPhase, STUDY_DURATION, STUDY_MARKS } from './motion-study.js?v=20261119-headline';

const $ = s => document.querySelector(s), canvas = $('canvas'), renderer = new Renderer(canvas), ctx = renderer.ctx;
let storage; try { storage = localStorage; } catch { /* Embedded browser. */ }
let locale = loadPreferences(storage).language;
const words = {
  title: ['Every step. Every strike.', '발걸음부터, 타격까지.'],
  description: ['Two fighters, up close. Watch the movement without effects.', '두 캐릭터를 가까이에서, 효과 없이 살펴보세요.'],
  study: ['Movement study', '동작 연구'], live: ['Live bout', '실제 대련'],
  studyNote: ['Choreographed movement study. No scoring or damage.', '연출된 동작 연구입니다. 점수와 피해 판정은 없습니다.'],
  liveNote: ['Real combat simulation. Hits, defense and results follow the game rules.', '실제 전투입니다. 타격·방어·결과는 게임 규칙을 따릅니다.'],
  run: ['Run in', '달려서 진입'], ready: ['Brake & ready', '멈추고 대련 자세'], exchange: ['Grounded exchange', '지상 공방'],
  reset: ['Reset & guard', '물러서서 가드'], jab: ['Jab & slip', '잽과 회피'], kick: ['Side kick', '옆차기'], hook: ['Hook & guard', '훅과 방어'], reaction: ['Hit reaction', '피격 반응'],
  pause: ['Pause', '일시정지'], resume: ['Play', '재생'], restart: ['Restart', '처음부터'], effects: ['Effects', '효과'],
  boxing: ['BOXING', '복싱'], taekwondo: ['TAEKWONDO', '태권도'], bout: ['Live bout', '실제 대련'], ended: ['Round over', '대련 종료'],
};
const tr = key => words[key][locale === 'ko' ? 1 : 0];
const makeWorld = () => {
  const match = new Match(12, 2, { styles: ['Boxing', 'Taekwondo'], personalities: ['Aggressive', 'Aggressive'], names: ['BOXING', 'TAEKWONDO'] });
  match.fighters.forEach((f, i) => { f.x = 540 + i * 120; f.y = 400; });
  return match;
};
const actors = makeWorld().fighters;
const director = new MotionDirector();
let world = makeWorld(), mode = 'study', time = 0, last = 0, accumulator = 0, speed = 1;
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
function translate() {
  document.documentElement.lang = locale;
  for (const id of ['title', 'description', 'study', 'live', 'restart']) $(('#' + id)).textContent = tr(id);
  $('#language').textContent = locale === 'en' ? '한국어' : 'English';
  $('#pause').textContent = tr(paused ? 'resume' : 'pause');
  $('#effects-label').textContent = tr('effects'); $('#boxer-label').textContent = tr('boxing'); $('#kicker-label').textContent = tr('taekwondo');
  $('#mode-note').textContent = tr(mode === 'study' ? 'studyNote' : 'liveNote');
  $('#speed').textContent = `${speed}×`;
  for (const [key] of Object.entries(STUDY_MARKS)) $(`#mark-${key}`).textContent = tr(key);
}
function draw() {
  const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(rect.width * dpr)) canvas.width = Math.round(rect.width * dpr);
  if (canvas.height !== Math.round(rect.height * dpr)) canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#eeeadd'; ctx.fillRect(0, 0, rect.width, rect.height);
  const floor = rect.height * .79;
  ctx.strokeStyle = '#c4c9b5'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, floor + 2); ctx.lineTo(rect.width, floor + 2); ctx.stroke();
  const fighters = mode === 'study' ? actors.map((f, i) => sampleStudyActor(f, i, time)) : world.fighters;
  const extent = mode === 'study' ? time < 2 ? 440 - 140 * time / 2 : 300 : Math.max(300, Math.abs(fighters[0].x - fighters[1].x) + 150);
  const scale = Math.min(2.2, rect.width / extent, rect.height / 220);
  const center = mode === 'study' ? 0 : (fighters[0].x + fighters[1].x) / 2;
  for (const [index, f] of fighters.entries()) {
    const p = director.poseFor(f, mode === 'study' ? time : world.time, mode === 'study' ? actors[index] : f);
    const x = rect.width / 2 + (f.x - center) * scale;
    ctx.save(); ctx.translate(x, floor - f.z * scale); ctx.scale(scale * fighterScale(f) * f.facing, scale * fighterScale(f));
    if (!f.alive && f.z === 0) ctx.translate(0, 37);
    ctx.translate(...p.hip); ctx.rotate(p.rotation); ctx.translate(-p.hip[0], -p.hip[1]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; renderer.skeleton(p, f, '#292b27'); ctx.restore();
  }
  if (mode === 'live' && $('#effects').checked) {
    ctx.save(); ctx.translate(rect.width / 2 - center * scale, floor - 400 * scale); ctx.scale(scale, scale);
    for (const effect of world.effects) renderer.effect(effect); ctx.restore();
  }
  $('#phase').textContent = tr(mode === 'live' ? world.finished ? 'ended' : 'bout' : studyPhase(time));
  $('#clock').textContent = `${(mode === 'live' ? world.time : time).toFixed(2)}s`;
  $('#timeline').value = time;
}
function setMode(next) {
  mode = next; time = accumulator = last = 0; world = makeWorld(); director.reset();
  $('#study').setAttribute('aria-pressed', String(mode === 'study')); $('#live').setAttribute('aria-pressed', String(mode === 'live'));
  $('#timeline').disabled = mode === 'live'; translate(); draw();
}
$('#study').onclick = () => setMode('study'); $('#live').onclick = () => setMode('live');
$('#pause').onclick = () => { paused = !paused; last = 0; translate(); draw(); };
$('#restart').onclick = () => setMode(mode);
$('#speed').onclick = () => { speed = speed === .5 ? 1 : .5; $('#speed').textContent = `${speed}×`; };
$('#language').onclick = () => { locale = locale === 'en' ? 'ko' : 'en'; translate(); draw(); };
$('#effects').onchange = draw;
function seek(value) { time = value; paused = true; director.reset(); translate(); draw(); }
$('#timeline').max = STUDY_DURATION;
$('#timeline').oninput = () => seek(Number($('#timeline').value));
for (const [key, value] of Object.entries(STUDY_MARKS)) $(`#mark-${key}`).onclick = () => { if (mode !== 'study') setMode('study'); seek(value); };
document.addEventListener('visibilitychange', () => { last = 0; });
new ResizeObserver(draw).observe(canvas);
translate();
function frame(now) {
  const elapsed = last ? Math.min(.05, (now - last) / 1000) * speed : 0; last = now;
  if (!paused && !document.hidden) {
    if (mode === 'study') time = (time + elapsed) % STUDY_DURATION;
    else { accumulator += elapsed; while (accumulator >= STEP) { world.update(); accumulator -= STEP; } }
    draw();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
