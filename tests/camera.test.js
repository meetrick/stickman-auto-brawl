import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../app.js';
import { SpectatorCamera } from '../camera.js';

test('overview keeps the entire arena visible without stretching in portrait and landscape', () => {
  for (const [width, height] of [[334, 430], [820, 200], [1000, 567]]) {
    const view = new SpectatorCamera().frame(new Match(72), width, height, false);
    assert.ok(view.x * view.scale <= width / 2 + .001);
    assert.ok((1200 - view.x) * view.scale <= width / 2 + .001);
    assert.ok(view.y * view.scale <= height / 2 + .001);
    assert.ok((680 - view.y) * view.scale <= height / 2 + .001);
  }
});
test('portrait close-up enlarges fighters and stays inside the arena horizontally', () => {
  const world = new Match(72, 8, { showcase: true });
  const camera = new SpectatorCamera();
  const overview = camera.frame(world, 334, 430, false);
  const closeUp = camera.frame(world, 334, 430, true);
  assert.ok(closeUp.scale > overview.scale * 2);
  assert.ok(closeUp.x - 334 / closeUp.scale / 2 >= -.001);
  assert.ok(closeUp.x + 334 / closeUp.scale / 2 <= 1200.001);
});
test('camera switches and rotations cannot change seeded combat or consume RNG', () => {
  const a = new Match(8), b = new Match(8), camera = new SpectatorCamera();
  for (let i = 0; i < 1600; i++) {
    a.update(); b.update();
    camera.frame(a, i % 2 ? 334 : 820, i % 2 ? 430 : 200, i % 3 > 0);
  }
  assert.deepEqual(a.fighters, b.fighters);
  assert.deepEqual(a.stats, b.stats);
  assert.equal(a.rng(), b.rng());
});
test('paused and reduced-motion framing does not drift; new rounds reset focus', () => {
  const world = new Match(72), camera = new SpectatorCamera();
  const initial = camera.frame(world, 334, 430, true);
  world.fighters[0].x = 100;
  let view = camera.frame(world, 334, 430, true);
  assert.equal(view.x, initial.x);
  world.time = 3;
  view = camera.frame(world, 334, 430, true, true);
  assert.equal(view.x, initial.x);
  camera.reset();
  view = camera.frame(world, 334, 430, true);
  assert.ok(Number.isFinite(view.x) && Number.isFinite(view.scale));
  assert.notEqual(view.x, initial.x);
});
