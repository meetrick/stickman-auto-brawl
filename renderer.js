import { SpectatorCamera } from './camera.js';
import { clamp } from './random.js';
const INK = '#292b27';
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.camera = new SpectatorCamera(); this.overview = false; this.dirty = true;
    this.mobile = matchMedia('(max-width: 800px), (max-width: 950px) and (max-height: 500px) and (orientation: landscape)');
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.overview = this.reducedMotion.matches;
    this.rect = canvas.getBoundingClientRect();
    this.resizeObserver = new ResizeObserver(() => { this.rect = canvas.getBoundingClientRect(); this.dirty = true; });
    this.resizeObserver.observe(canvas);
  }
  line(points, color = INK, width = 4.5) {
    const c = this.ctx; c.beginPath(); c.strokeStyle = color; c.lineWidth = width;
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
  }
  wall(w) {
    const c = this.ctx, x = w.x - w.w / 2, y = w.y - w.d / 2;
    const color = w.type === 'spring' ? '#6e9486' : w.type === 'crate' ? '#b59464' : '#a5aa98';
    c.save(); c.lineJoin = 'round'; c.lineWidth = 1.5; c.strokeStyle = '#666c5a';
    c.fillStyle = '#30392a20'; c.fillRect(x - 5, y, w.w + 14, w.d + 8);
    if (w.destroyed) {
      c.fillStyle = color;
      for (let i = 0; i < 5; i++) c.fillRect(x + i * w.w / 5, y + (i % 2) * 8, w.w / 7, 5);
      c.restore(); return;
    }
    c.fillStyle = color; c.fillRect(x, y + w.d - w.height, w.w, w.height); c.strokeRect(x, y + w.d - w.height, w.w, w.height);
    c.fillStyle = w.type === 'spring' ? '#b0c9b5' : w.type === 'crate' ? '#ddc49a' : '#d0d2bf';
    c.fillRect(x, y - w.height, w.w, w.d); c.strokeRect(x, y - w.height, w.w, w.d);
    if (w.type === 'crate') {
      this.line([[x + 5, y + w.d - w.height + 5], [x + w.w - 5, y + w.d - 5]], '#806a4d', 3);
      this.line([[x + w.w - 5, y + w.d - w.height + 5], [x + 5, y + w.d - 5]], '#806a4d', 3);
    } else if (w.type === 'spring') {
      const points = Array.from({ length: 9 }, (_, i) => [x + w.w / 2 + (i % 2 ? 9 : -9), y + w.d - 7 - i * (w.height - 14) / 8]);
      this.line(points, '#e8edd9', 3);
    } else {
      this.line([[x, y + w.d - w.height / 2], [x + w.w, y + w.d - w.height / 2]], '#838b75', 1);
      this.line([[w.x, y + w.d - w.height], [w.x, y + w.d - w.height / 2]], '#838b75', 1);
    }
    c.restore();
  }
  trap(trap, world) {
    const c = this.ctx, phase = world.arena.trapPhase(trap, world.time), active = phase === 'active';
    c.save(); c.translate(trap.x, trap.y);
    c.fillStyle = active ? '#af514738' : '#444e3c20'; c.strokeStyle = phase === 'warning' ? '#c58631' : '#858b77'; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(0, 0, 26, 16, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    for (let i = -1; i <= 1; i++) {
      c.fillStyle = active ? '#9b5145' : '#818775'; c.beginPath();
      c.moveTo(i * 14 - 5, 4); c.lineTo(i * 14, active ? -25 : -3); c.lineTo(i * 14 + 5, 4); c.closePath(); c.fill();
    }
    if (phase === 'warning') { c.fillStyle = '#b57828'; c.font = 'bold 15px monospace'; c.textAlign = 'center'; c.fillText('!', 0, -20); }
    c.restore();
  }
  hazard(item, world) {
    const c = this.ctx, armed = world.time >= item.armAt;
    c.save(); c.translate(item.x, item.y);
    const pulse = .5 + .5 * Math.sin((world.time - item.born) * 11);
    if (item.type === 'mine') {
      c.globalAlpha = armed ? .55 + pulse * .45 : .3;
      c.strokeStyle = '#bb493b'; c.fillStyle = '#bb493b22'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(0, 0, 18 + pulse * 4, 10 + pulse * 2, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#a33c30'; c.beginPath(); c.ellipse(0, -2, 11, 6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = armed && pulse > .5 ? '#ffd8a1' : '#e27251';
      c.beginPath(); c.arc(0, -5, 3, 0, Math.PI * 2); c.fill();
      if (!armed) { c.font = '9px monospace'; c.textAlign = 'center'; c.fillStyle = '#b34638'; c.fillText('ARMING', 0, -18); }
    } else {
      c.globalAlpha = .6; c.fillStyle = '#5e9c7433'; c.beginPath(); c.ellipse(0, 0, 17, 9, 0, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1; c.translate(0, -8 + Math.sin(world.time * 4 + item.id) * 2);
      c.fillStyle = '#6b9b70'; c.strokeStyle = '#3b6745'; c.lineWidth = 1.5;
      c.beginPath(); c.roundRect(-8, -10, 16, 19, 4); c.fill(); c.stroke();
      c.fillStyle = '#b9a67d'; c.fillRect(-5, -15, 10, 5);
      this.line([[-4, -1], [4, -1]], '#f3f1dc', 2.5); this.line([[0, -5], [0, 3]], '#f3f1dc', 2.5);
    }
    c.restore();
  }
  effect(e) {
    const c = this.ctx, progress = 1 - e.ttl / e.life;
    c.save(); c.globalAlpha = 1 - progress;
    if (e.type === 'explosion') {
      c.translate(e.x, e.y);
      c.strokeStyle = '#c75b33'; c.fillStyle = '#edbd5866'; c.lineWidth = 4 * (1 - progress) + 1;
      c.beginPath(); c.ellipse(0, 0, 15 + progress * 110, 8 + progress * 48, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      for (let i = 0; i < 15; i++) {
        const angle = i * 2.39996, radius = 15 + progress * (55 + i * 3);
        c.fillStyle = i % 2 ? '#c26338' : '#e6a736'; c.beginPath();
        c.arc(Math.cos(angle) * radius, Math.sin(angle) * radius * .5 - progress * 85, 2 + (1 - progress) * 6, 0, Math.PI * 2); c.fill();
      }
      c.translate(-e.x, -e.y);
    }
    if (e.crit) {
      c.strokeStyle = '#d99524'; c.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        this.line([[e.x + Math.cos(angle) * (15 + progress * 30), e.y - e.z - 55 + Math.sin(angle) * (15 + progress * 30)],
          [e.x + Math.cos(angle) * (25 + progress * 40), e.y - e.z - 55 + Math.sin(angle) * (25 + progress * 40)]], '#d99524', 2);
      }
    }
    c.textAlign = 'center'; c.fillStyle = e.type === 'heal' ? '#43845b' : e.crit ? '#ba7c1d' : '#a44735';
    c.font = `bold ${e.crit || e.type === 'explosion' ? 26 : 15}px monospace`;
    c.fillText(e.text || e.type, e.x, e.y - e.z - 95 - progress * 45); c.restore();
  }
  fighter(f, time) {
    const c = this.ctx, scale = .83 + (f.y - 245) / 335 * .23;
    const sy = f.y - f.z;
    c.save(); c.translate(f.x, f.y); c.scale(scale, scale * .3);
    c.fillStyle = '#37392c22'; c.beginPath(); c.ellipse(0, 0, Math.max(8, 23 - f.z * .04), 13, 0, 0, Math.PI * 2); c.fill(); c.restore();
    c.save(); c.translate(f.x, sy); c.scale(scale * f.facing, scale);
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (!f.alive || f.stun > 0) { c.translate(0, -28); c.rotate(-Math.min(1.5, .6 + f.z * .01 + (f.alive ? 0 : 1))); c.translate(0, 28); }
    const walk = f.state === 'walk' ? Math.sin(f.age * 13) : Math.sin(f.age * 2) * .08;
    const attacking = f.attack && f.attack.elapsed >= .08;
    const move = f.attack?.name;
    const bob = Math.abs(walk) * 3;
    const hip = [0, -43 + bob], shoulder = [attacking ? 7 : 1, -77 + bob];
    const ink = f.flash > 0 ? '#fff8e0' : INK;
    this.line([hip, [-11 - walk * 9, -24], [-14 - walk * 19, 0]], ink);
    const foot = attacking && move === 'JumpKick' ? [53, -57] : [15 + walk * 19, 0];
    this.line([hip, [13 + walk * 9, -23], foot], ink, 5);
    this.line([hip, shoulder], ink, 9);
    this.line([hip, shoulder], f.color, 5);
    this.line([shoulder, [-15, -59], [-5, -49]], ink, 4);
    let hand = [23, -65];
    if (attacking) hand = move === 'Uppercut' ? [28, -111] : move === 'Grab' ? [44, -70] : [44, -65];
    this.line([shoulder, [20, -62], hand], ink, 4.5);
    this.line([shoulder, [3, -88 + bob]], ink, 4);
    c.fillStyle = '#f4efdd'; c.strokeStyle = ink; c.lineWidth = 3;
    c.beginPath(); c.arc(3, -99 + bob, 11, 0, Math.PI * 2); c.fill(); c.stroke();
    this.line([[-7, -102 + bob], [13, -102 + bob]], f.color, 4);
    this.line([[-7, -102 + bob], [-21, -105 + Math.sin(time * 12 + f.id) * 4], [-30, -99]], f.color, 2.5);
    this.line([[9, -97 + bob], [12, -97 + bob]], ink, 2);
    c.restore();
    if (f.alive) {
      c.save(); c.translate(f.x, sy - 126 * scale); c.textAlign = 'center';
      c.font = '600 10px monospace'; c.fillStyle = f.color; c.fillText(f.name, 0, -7);
      c.fillStyle = '#38392b22'; c.fillRect(-22, 0, 44, 3);
      c.fillStyle = f.color; c.fillRect(-22, 0, 44 * f.hp / f.maxHp, 3); c.restore();
    }
  }
  draw(world) {
    const c = this.ctx, dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const rect = this.rect;
    if (!rect.width || !rect.height) return;
    const w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    const view = this.camera.frame(world, rect.width, rect.height, this.mobile.matches && !this.overview, this.reducedMotion.matches);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#eae6d7'; c.fillRect(0, 0, rect.width, rect.height);
    c.save(); c.translate(rect.width / 2, rect.height / 2); c.scale(view.scale, view.scale); c.translate(-view.x, -view.y);
    // Perspective lines and distant mountains are all procedural Canvas paths.
    c.fillStyle = '#d9dccf';
    for (let i = 0; i < 3; i++) {
      c.beginPath(); c.moveTo(-100, 250);
      for (let x = -100; x <= 1300; x += 35) c.lineTo(x, 157 + i * 24 + Math.sin(x * .009 + i * 2) * 29 + Math.cos(x * .02 + i) * 13);
      c.lineTo(1300, 270); c.closePath(); c.fill();
    }
    c.fillStyle = '#f1eedf'; c.beginPath(); c.moveTo(115, 252); c.lineTo(1085, 252); c.lineTo(1190, 618); c.lineTo(10, 618); c.closePath(); c.fill();
    c.strokeStyle = '#bfc3b155'; c.lineWidth = 1;
    for (let x = 0; x <= 1200; x += 90) this.line([[600 + (x - 600) * .78, 252], [x, 618]], '#bfc3b155', 1);
    for (let y = 270; y < 620; y += 49) this.line([[100 - (y - 252) * .27, y], [1100 + (y - 252) * .27, y]], '#bfc3b155', 1);
    this.line([[115, 252], [1085, 252], [1190, 618], [10, 618], [115, 252]], '#a8ae9a', 1.5);
    c.save(); c.translate(600, 433); c.scale(1, .4); c.strokeStyle = '#87917c33'; c.lineWidth = 2;
    c.beginPath(); c.arc(0, 0, 140, 0, Math.PI * 2); c.stroke();
    c.font = '600 34px Georgia'; c.textAlign = 'center'; c.fillStyle = '#87917c33'; c.fillText('乱 闘', 0, 13); c.restore();
    c.font = '11px monospace'; c.fillStyle = '#878d79'; c.fillText('THE COURTYARD / 01', 44, 653);
    c.textAlign = 'right'; c.fillText('EVERY BODY IS A PROJECTILE', 1156, 653); c.textAlign = 'left';
    for (const item of world.hazards.items) this.hazard(item, world);
    for (const trap of world.arena?.traps || []) this.trap(trap, world);
    const objects = [...world.fighters.map(f => ({ depth: f.y, fighter: f })), ...(world.arena?.walls || []).map(w => ({ depth: w.y + w.d / 2, wall: w }))];
    objects.sort((a, b) => a.depth - b.depth).forEach(o => o.wall ? this.wall(o.wall) : this.fighter(o.fighter, world.time));
    for (const e of world.effects) this.effect(e);
    c.restore();
    if (view.closeUp) {
      const edges = { left: 0, right: 0 };
      for (const f of world.fighters.filter(f => f.alive)) {
        const x = (f.x - view.x) * view.scale + rect.width / 2;
        const y = (f.y - f.z - 55 - view.y) * view.scale + rect.height / 2;
        if (x >= 15 && x <= rect.width - 15 && y >= 55 && y <= rect.height - 25) continue;
        const left = x < rect.width / 2, side = left ? 'left' : 'right';
        const sx = left ? 9 : rect.width - 43;
        const sy = clamp(75 + edges[side]++ * 28, 65, rect.height - 55);
        c.fillStyle = '#f5f3e9e6'; c.strokeStyle = f.color; c.lineWidth = 1;
        c.beginPath(); c.roundRect(sx, sy, 34, 22, 11); c.fill(); c.stroke();
        c.fillStyle = f.color; c.textAlign = 'center'; c.font = '10px monospace';
        const insideX = x >= 15 && x <= rect.width - 15;
        const arrow = insideX && y < 55 ? '↑' : insideX && y > rect.height - 25 ? '↓' : left ? '‹' : '›';
        c.fillText(`${arrow}${String(f.id + 1).padStart(2, '0')}`, sx + 17, sy + 15);
      }
      c.textAlign = 'left';
    }
    this.dirty = false;
  }
}
