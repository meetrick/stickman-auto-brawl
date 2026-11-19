import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js?v=20261119-tactical-ai';
import { firstOutNames, rankLabel, standingsMarkup, eliminationMarkup } from '../results.js?v=20261119-tactical-ai';
import { setLanguage, eventText } from '../i18n.js?v=20261119-tactical-ai';

test('standings and timeline escape names and retain participant numbers for identical names', () => {
  const w = new Match(2, 4, { names: ['<img src=x>', 'Alice', 'Alice', '끝'] });
  w.fighters.forEach(f => { f.readyAt = 100; });
  w.fighters[0].receiveHit(999, 0, 0, 0); w.update();
  w.fighters[1].receiveHit(999, 0, 0, 0); w.fighters[2].receiveHit(999, 0, 0, 0); w.update();
  const html = standingsMarkup(w), timeline = eliminationMarkup(w);
  assert.ok(!html.includes('<img')); assert.ok(!timeline.includes('<img'));
  assert.ok(html.includes('&lt;img src=x&gt;')); assert.ok(timeline.includes('&lt;img src=x&gt;'));
  assert.ok(timeline.includes('#02 Alice · #03 Alice'));
  assert.equal(firstOutNames(w), '<img src=x>');
  assert.equal((html.match(/class="rank-row/g) || []).length, 4);
});
test('shared places and elimination callouts translate without changing recorded results', () => {
  const w = new Match(3, 3); w.fighters.forEach(f => { f.readyAt = 100; });
  w.fighters[0].receiveHit(999, 0, 0, 0); w.fighters[1].receiveHit(999, 0, 0, 0); w.update();
  const before = structuredClone(w.eliminations), entry = before[0];
  setLanguage('en'); assert.equal(rankLabel(entry), 'Tied #2');
  assert.equal(eventText(w.events.find(e => e.type === 'elimination')), 'Out · tied #2');
  setLanguage('ko'); assert.equal(rankLabel(entry), '공동 2위');
  assert.ok(eliminationMarkup(w).includes('1번째 동시 탈락'));
  assert.ok(standingsMarkup(w).includes('공동 2위'));
  assert.deepEqual(w.eliminations, before); setLanguage('en');
});
