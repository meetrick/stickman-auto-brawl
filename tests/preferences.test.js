import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js?v=20261119-tactical-ai';
import { normalizeCount, normalizeName, normalizePreferences, loadPreferences, savePreferences, escapeHTML, SETTINGS_KEY } from '../settings.js?v=20261119-tactical-ai';
import { MESSAGES, setLanguage, getLanguage, t, eventText } from '../i18n.js?v=20261119-tactical-ai';

test('participant counts stay within 2–24 and names are trimmed, bounded, and have unique defaults', () => {
  assert.equal(normalizeCount(1), 2); assert.equal(normalizeCount(99), 24); assert.equal(normalizeCount('bad'), 8);
  assert.equal(normalizeName('  민수  ', 0), '민수'); assert.equal(normalizeName('', 8), 'FIGHTER 9');
  assert.equal(Array.from(normalizeName('🙂'.repeat(20), 0)).length, 16);
  const p = normalizePreferences({ count: 12, names: ['Alice', '민수'] });
  assert.equal(p.count, 12); assert.equal(p.names[1], '민수'); assert.equal(new Set(p.names).size, 24);
});
test('user names remain literal text when included in roster and event markup', () => {
  const name = '<b>민수</b>';
  assert.equal(normalizeName(name, 0), name);
  assert.equal(escapeHTML(name), '&lt;b&gt;민수&lt;/b&gt;');
  assert.equal(escapeHTML('"&\''), '&quot;&amp;&#39;');
});
test('preferences persist and survive malformed or unavailable storage with English defaults', () => {
  const values = new Map(), storage = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, v) };
  assert.equal(loadPreferences(storage).language, 'en');
  assert.ok(savePreferences(storage, { count: 4, language: 'ko', names: ['봄', 'Summer'] }));
  const loaded = loadPreferences(storage); assert.equal(loaded.count, 4); assert.equal(loaded.language, 'ko'); assert.equal(loaded.names[0], '봄');
  values.set(SETTINGS_KEY, '{broken'); assert.equal(loadPreferences(storage).count, 8);
  assert.equal(loadPreferences(null).language, 'en'); assert.equal(savePreferences(null, {}), false);
  assert.equal(normalizePreferences(null).language, 'en');
});
test('English and Korean translations cover the same placeholders and translate combat events', () => {
  const tokens = value => [...value.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
  for (const [key, pair] of Object.entries(MESSAGES)) {
    assert.equal(pair.length, 2); assert.ok(pair.every(v => typeof v === 'string' && v.length > 0), key);
    assert.deepEqual(tokens(pair[0]), tokens(pair[1]), key);
  }
  setLanguage('ko'); assert.equal(getLanguage(), 'ko'); assert.equal(t('winner', { name: '봄' }), '봄 승리!');
  assert.equal(eventText({ text: 'CRIT!' }), '치명타!'); assert.equal(eventText({ text: '+15 HP' }), '체력 +15');
  setLanguage('en'); assert.equal(t('newMatch'), 'New match');
});
test('custom names and locale do not alter seeded battle outcomes', () => {
  const a = new Match(8, 4, { names: ['Alice', '봄', 'Charlie', '겨울'] }), b = new Match(8, 4);
  setLanguage('ko');
  for (let i = 0; i < 1600; i++) { a.update(); b.update(); }
  assert.deepEqual(a.stats, b.stats);
  assert.deepEqual(a.fighters.map(({ name, ...f }) => f), b.fighters.map(({ name, ...f }) => f));
  setLanguage('en');
});
test('two-, six-, twelve-, sixteen- and twenty-four-player rounds finish with valid named participants', () => {
  for (const count of [2, 6, 12, 16, 24]) {
    const w = new Match(17, count, { names: Array.from({ length: count }, (_, i) => `선수${i + 1}`) });
    for (let i = 0; i < 10810 && !w.finished; i++) w.update();
    assert.equal(w.finished, true); assert.equal(w.fighters.length, count);
    for (const [i, f] of w.fighters.entries()) { assert.equal(f.name, `선수${i + 1}`); assert.ok(Number.isFinite(f.x) && f.hp >= 0); }
  }
});

test('expanding legacy twelve-fighter preferences preserves existing names, styles and count', () => {
  const names = Array.from({ length: 12 }, (_, i) => `Friend ${i + 1}`);
  const p = normalizePreferences({ count: 12, names, styles: Array(12).fill('Judo'), language: 'ko' });
  assert.equal(normalizePreferences().count, 8);
  assert.equal(p.count, 12); assert.equal(p.language, 'ko');
  assert.deepEqual(p.names.slice(0, 12), names); assert.equal(p.names[23], 'FIGHTER 24');
  assert.deepEqual(p.styles.slice(0, 12), Array(12).fill('Judo'));
  assert.deepEqual(p.styles.slice(12), Array(12).fill('Random'));
});
