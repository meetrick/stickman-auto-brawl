import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js?v=20261119-headline';
import { normalizePreferences, savePreferences, loadPreferences } from '../settings.js?v=20261119-headline';
import { PERSONALITIES } from '../brain.js?v=20261119-headline';
import { t, MESSAGES } from '../i18n.js?v=20261119-headline';

test('legacy preferences default personalities to Random without losing names or martial arts', () => {
  const p = normalizePreferences({ count: 4, names: ['봄'], styles: ['Taekwondo'] });
  assert.equal(p.count, 4); assert.equal(p.names[0], '봄'); assert.equal(p.styles[0], 'Taekwondo');
  assert.deepEqual(p.personalities, Array(24).fill('Random'));
  assert.deepEqual(normalizePreferences({ personalities: ['Cowardly', 'bad', 'Counterfighter'] }).personalities.slice(0, 3), ['Cowardly', 'Random', 'Counterfighter']);
});
test('personality choices survive storage and remain available beyond a temporarily reduced count', () => {
  const map = new Map(), storage = { setItem: (k, v) => map.set(k, v), getItem: k => map.get(k) };
  const personalities = Array(24).fill('Random'); personalities[23] = 'Opportunist'; personalities[0] = 'Cowardly';
  assert.ok(savePreferences(storage, { count: 2, personalities }));
  const loaded = loadPreferences(storage); assert.equal(loaded.count, 2);
  assert.equal(loaded.personalities[0], 'Cowardly'); assert.equal(loaded.personalities[23], 'Opportunist');
});
test('selecting a personality does not reroll stats, gaits or martial arts; resolved setup replays exactly', () => {
  const a = new Match(72, 6, { personalities: PERSONALITIES }), random = new Match(72, 6);
  assert.deepEqual(a.fighters.map(f => f.personality), PERSONALITIES);
  assert.deepEqual(a.fighters.map(({ personality, ...f }) => f), random.fighters.map(({ personality, ...f }) => f));
  const b = new Match(a.seed, 6, { names: a.fighters.map(f => f.name), styles: a.fighters.map(f => f.style), personalities: a.fighters.map(f => f.personality) });
  while (!a.finished) { a.update(); b.update(); }
  assert.deepEqual(a.fighters, b.fighters); assert.deepEqual(a.standings, b.standings);
});
test('personality choices and live intentions have English and Korean labels', () => {
  for (const locale of ['en', 'ko']) {
    for (const role of PERSONALITIES) {
      assert.ok(MESSAGES[role] && t(role, {}, locale).length > 0);
      assert.notEqual(t(`${role}Hint`, {}, locale), `${role}Hint`);
    }
    for (const intent of ['watch', 'heal', 'flee', 'counter', 'attack', 'chase']) assert.notEqual(t(`intent_${intent}`, {}, locale), `intent_${intent}`);
    assert.notEqual(t('RandomPersonality', {}, locale), 'RandomPersonality');
  }
});
