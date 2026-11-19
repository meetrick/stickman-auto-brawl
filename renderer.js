import { SpectatorCamera } from './camera.js?v=20261119-tactical-ai';
import { clamp } from './random.js?v=20261119-tactical-ai';
import { barPoint } from './arena.js?v=20261119-tactical-ai';
import { computePose, projectPose } from './pose.js?v=20261119-tactical-ai';
import { WEAPONS } from './weapons.js?v=20261119-tactical-ai';
import { t, eventText } from './i18n.js?v=20261119-tactical-ai';
const INK = '#292b27';
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.camera = new SpectatorCamera(); this.overview = false; this.dirty = true;
    this.nameLabels = new Map();
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
  spinner(bar, time, part) {
    const c = this.ctx;
    if (part === 0) {
      c.save(); c.fillStyle = '#556451'; c.beginPath(); c.ellipse(bar.x, bar.y, 15, 8, 0, 0, Math.PI * 2); c.fill();
      this.line([[bar.x, bar.y], [bar.x, bar.y - bar.height - 7]], '#66705d', 10);
      c.fillStyle = '#d4ba75'; c.beginPath(); c.arc(bar.x, bar.y - bar.height, 9, 0, Math.PI * 2); c.fill(); c.restore(); return;
    }
    const from = barPoint(bar, time, (Math.abs(part) - 1) / 3 * bar.radius * Math.sign(part));
    const to = barPoint(bar, time, Math.abs(part) / 3 * bar.radius * Math.sign(part));
    c.save(); c.lineCap = 'round';
    this.line([[from.x, from.y + 3], [to.x, to.y + 3]], '#39452d22', 12);
    this.line([[from.x, from.y - bar.height], [to.x, to.y - bar.height]], '#713f32', 12);
    this.line([[from.x, from.y - bar.height - 2], [to.x, to.y - bar.height - 2]], '#bd7053', 7);
    if (Math.abs(part) === 3) { c.fillStyle = '#eed494'; c.beginPath(); c.arc(to.x, to.y - bar.height, 6, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  hazard(item, world) {
    const c = this.ctx, armed = world.time >= item.armAt;
    c.save(); c.translate(item.x, item.y);
    const pulse = .5 + .5 * Math.sin((world.time - item.born) * 11);
      c.globalAlpha = .6; c.fillStyle = '#5e9c7433'; c.beginPath(); c.ellipse(0, 0, 17, 9, 0, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1; c.translate(0, -8 + Math.sin(world.time * 4 + item.id) * 2);
      c.fillStyle = '#6b9b70'; c.strokeStyle = '#3b6745'; c.lineWidth = 1.5;
      c.beginPath(); c.roundRect(-8, -10, 16, 19, 4); c.fill(); c.stroke();
      c.fillStyle = '#b9a67d'; c.fillRect(-5, -15, 10, 5);
      this.line([[-4, -1], [4, -1]], '#f3f1dc', 2.5); this.line([[0, -5], [0, 3]], '#f3f1dc', 2.5);
    c.restore();
  }
  effect(e) {
    const c = this.ctx, progress = 1 - e.ttl / e.life;
    c.save(); c.globalAlpha = 1 - progress;
    if (e.move === 'WeaponStrike' && e.weapon === 'Hammer' && progress < .5) {
      for (let i = 0; i < 8; i++) {
        const direction = i * Math.PI / 4, spread = progress * 100 + 8;
        c.fillStyle = '#a1a082'; c.globalAlpha = (1 - progress * 2) * .25;
        c.beginPath(); c.ellipse(e.x + Math.cos(direction) * spread, e.y + Math.sin(direction) * spread * .35,
          4 + progress * 10, 2 + progress * 4, 0, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1 - progress;
    }
    if (e.type === 'hit' && !e.blocked && progress < .4) {
      const x = e.x, y = e.y - e.z - 55;
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3 + .25, inner = 7 + progress * 20, outer = inner + 12;
        this.line([[x + Math.cos(angle) * inner, y + Math.sin(angle) * inner], [x + Math.cos(angle) * outer, y + Math.sin(angle) * outer]], '#b26737', 2.5);
      }
    }
    if (['block', 'guardBreak'].includes(e.type) && progress < .35) {
      const x = e.x, y = e.y - e.z - 80;
      c.strokeStyle = e.type === 'block' ? '#548c8b' : '#b96c48'; c.lineWidth = 3;
      c.beginPath(); c.arc(x, y, 20 + (this.reducedMotion.matches ? 0 : progress * 12), -.95, .95); c.stroke();
      if (e.type === 'guardBreak') this.line([[x + 16, y - 15], [x + 6, y], [x + 21, y + 13]], '#b96c48', 2);
    }
    if (!this.reducedMotion.matches && ['dodge', 'escape'].includes(e.type) && progress < .25) {
      for (let i = 0; i < 3; i++) this.line([[e.x - 24 - progress * 35, e.y - 55 + i * 9], [e.x - 10 - progress * 35, e.y - 55 + i * 9]], '#718b7b', 2);
    }
    if (!this.reducedMotion.matches && e.type === 'hit' && !e.blocked && (e.crit || e.signature || ['Uppercut', 'Grab'].includes(e.move)) && progress < .28) {
      c.save(); c.translate(e.x, e.y - e.z - 52); c.scale(1, .65);
      c.globalAlpha = (1 - progress / .28) * .65;
      c.strokeStyle = e.crit ? '#c98a28' : '#718565'; c.lineWidth = 3 - progress * 6;
      c.beginPath(); c.arc(0, 0, 10 + progress * 140, 0, Math.PI * 2); c.stroke(); c.restore();
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
    c.font = `bold ${e.crit ? 26 : 15}px monospace`;
    // Keep attack names in the optional combat feed, away from the fighters.
    if (e.type === 'heal') c.fillText(eventText(e), e.x, e.y - e.z - 95 - progress * 45);
    c.restore();
  }
  weapon(p, f) {
    if (!f.weapon || f.weapon === 'None') return;
    const c = this.ctx, stowed = ['Grab', 'Punch', 'Kick'].includes(f.attack?.name);
    c.save(); c.translate(...(stowed ? p.shoulder : p.main.tip)); c.rotate(stowed ? -2.1 : p.weaponAngle);
    const length = WEAPONS[f.weapon].length;
    if (f.weapon === 'Sword') {
      this.line([[-9, 0], [0, 0]], '#695035', 5);
      c.fillStyle = '#d9dfd1'; c.strokeStyle = '#687361'; c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(3, -4); c.lineTo(length - 8, -3); c.lineTo(length, 0); c.lineTo(length - 8, 4); c.lineTo(3, 4); c.closePath(); c.fill(); c.stroke();
      this.line([[2, -9], [2, 9]], '#bd9b51', 3);
    } else if (f.weapon === 'Staff') {
      this.line([[-22, 0], [length, 0]], '#70523c', 6);
      this.line([[-22, -1], [length, -1]], '#c1a06a', 2);
      this.line([[length - 11, 0], [length, 0]], f.color, 7);
      this.line([[-22, 0], [-12, 0]], f.color, 7);
    } else {
      this.line([[-9, 0], [length, 0]], '#8c6744', 5);
      c.fillStyle = '#8b9b91'; c.strokeStyle = '#4a5c51'; c.lineWidth = 2;
      c.beginPath(); c.roundRect(length - 10, -17, 19, 34, 3); c.fill(); c.stroke();
      this.line([[length - 7, -12], [length + 5, -12]], '#d4dcce', 2);
    }
    c.restore();
  }
  weaponTrail(f) {
    if (this.reducedMotion.matches || f.attack?.name !== 'WeaponStrike') return;
    const progress = f.attack.elapsed / f.attack.duration;
    if (progress < .28 || progress > .74) return;
    const c = this.ctx, length = WEAPONS[f.weapon]?.length || 0;
    if (!length) return;
    const window = f.weapon === 'Sword' ? .065 : f.weapon === 'Staff' ? .11 : .12;
    const outer = [], inner = [];
    for (let i = 0; i <= 9; i++) {
      const elapsed = Math.max(0, f.attack.elapsed - window * (1 - i / 9));
      const pose = computePose({ ...f, attack: { ...f.attack, elapsed } });
      const [x, y] = pose.main.tip, angle = pose.weaponAngle;
      outer.push([x + Math.cos(angle) * length, y + Math.sin(angle) * length]);
      inner.push([x + Math.cos(angle) * length * .52, y + Math.sin(angle) * length * .52]);
    }
    c.save(); c.fillStyle = f.color; c.globalAlpha *= .17;
    c.beginPath(); outer.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    [...inner].reverse().forEach(([x, y]) => c.lineTo(x, y)); c.closePath(); c.fill();
    c.globalAlpha = .45; this.line(outer, '#fdf8da', 2.5); c.restore();
  }
  strikeTrail(f) {
    if (this.reducedMotion.matches || !['Punch', 'Kick', 'Uppercut'].includes(f.attack?.name)) return;
    const a = f.attack, move = f.getMove(a.name);
    if (a.elapsed < move.windup * .7 || a.elapsed > (move.activeEnd || move.duration - .05) + .04) return;
    const points = [];
    for (let i = 0; i <= 6; i++) {
      const pose = projectPose(computePose({ ...f, attack: { ...a, elapsed: Math.max(0, a.elapsed - (a.signature ? .085 : .045) * (1 - i / 6)) } }));
      points.push(a.name === 'Kick' ? pose.front.tip : a.variant === 1 ? pose.off.tip : pose.main.tip);
    }
    const c = this.ctx; c.save(); c.globalAlpha *= .28;
    this.line(points, f.color, (a.name === 'Kick' ? 8 : 6) + (a.signature ? 3 : 0)); c.restore();
  }
  skeleton(p, f, ink) {
    this.line([p.shoulder, p.off.joint, p.off.tip], ink, 4);
    this.line([p.hip, p.back.joint, p.back.tip], ink, 4.5);
    this.line([p.hip, p.front.joint, p.front.tip], ink, 5);
    this.line([p.hip, p.shoulder], ink, 9);
    this.line([p.hip, p.shoulder], f.color, 5.5);
    this.line([p.shoulder, p.head], ink, 4);
    const c = this.ctx, [hx, hy] = p.head;
    c.fillStyle = '#f4efdd'; c.strokeStyle = ink; c.lineWidth = 3;
    c.beginPath(); c.arc(hx, hy, 11, 0, Math.PI * 2); c.fill(); c.stroke();
    if (f.style === 'Ninja') { c.fillStyle = ink; c.fillRect(hx - 9, hy + 1, 18, 7); }
    if (f.style === 'Judo' || f.style === 'Taekwondo') {
      this.line([[p.hip[0] - 9, p.hip[1] - 3], [p.hip[0] + 9, p.hip[1] - 3], [p.hip[0] + 5, p.hip[1] + 9]], ink, 3);
    }
    if (f.style === 'Taekwondo') this.line([[p.shoulder[0] - 6, p.shoulder[1] + 2], [p.shoulder[0], p.shoulder[1] + 12], [p.shoulder[0] + 6, p.shoulder[1] + 2]], '#e5ddc8', 2.5);
    this.weapon(p, f);
    this.line([p.shoulder, p.main.joint, p.main.tip], ink, 4.5);
    c.fillStyle = ink; c.beginPath(); c.arc(...p.main.tip, 3, 0, Math.PI * 2); c.fill();
    if (f.style === 'Judo' && f.alive) {
      for (const [hand, elbow] of [[p.main.tip, p.main.joint], [p.off.tip, p.off.joint]]) {
        const angle = Math.atan2(hand[1] - elbow[1], hand[0] - elbow[0]);
        for (const spread of [-.5, .5]) this.line([hand, [hand[0] + Math.cos(angle + spread) * 7, hand[1] + Math.sin(angle + spread) * 7]], ink, 1.8);
      }
    }
    if (f.style === 'Boxing' || f.style === 'Kickboxing') {
      c.fillStyle = f.style === 'Boxing' ? f.color : '#e6dfc9'; c.strokeStyle = ink; c.lineWidth = 1.5;
      for (const hand of [p.main.tip, p.off.tip]) {
        c.beginPath(); c.arc(...hand, f.style === 'Boxing' ? 5.5 : 4, 0, Math.PI * 2); c.fill(); c.stroke();
      }
    }
    this.line([[hx - 10, hy - 4], [hx + 10, hy - 4]], f.color, 3.8);
    const drag = clamp(Math.abs(f.vx) * .04, 0, 16), flutter = f.alive ? Math.sin(f.age * 15 + f.id) * 4 : 0;
    c.strokeStyle = f.color; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(hx - 9, hy - 4); c.quadraticCurveTo(hx - 20 - drag, hy - 9 + flutter, hx - 29 - drag, hy - 2 + flutter); c.stroke();
    c.beginPath(); c.moveTo(hx - 9, hy - 3); c.quadraticCurveTo(hx - 17 - drag, hy + flutter, hx - 24 - drag, hy + 8 + flutter); c.stroke();
    if (f.alive && Math.cos(p.yaw || 0) >= 0) this.line([[hx + 4, hy - 1], [hx + 8, hy - 2]], ink, 2);
    else if (!f.alive) { this.line([[hx + 3, hy - 4], [hx + 8, hy + 1]], ink, 1.5); this.line([[hx + 8, hy - 4], [hx + 3, hy + 1]], ink, 1.5); }
  }
  fighter(f, time) {
    const c = this.ctx, scale = .83 + (f.y - 245) / 335 * .23, sy = f.y - f.z, p = projectPose(computePose(f));
    c.save(); c.translate(f.x, f.y); c.scale(scale, scale * .3);
    c.fillStyle = '#37392c22'; c.beginPath(); c.ellipse(0, 0, Math.max(8, 23 - f.z * .04), 13, 0, 0, Math.PI * 2); c.fill(); c.restore();
    if (f.state === 'run' && f.z < 2) {
      c.save(); c.fillStyle = '#889275';
      for (let i = 0; i < 3; i++) {
        const t = (time * 3 + i / 3 + f.id * .13) % 1; c.globalAlpha = (1 - t) * .25;
        c.beginPath(); c.ellipse(f.x - f.facing * (8 + t * 32), f.y - t * 6, 2 + t * 6, 1 + t * 3, 0, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    }
    const dashTrail = f.attack?.name === 'Dash' && f.attack.elapsed > .12 && f.attack.elapsed < .5;
    const hopTrail = f.attack?.name === 'JumpKick' && f.attack.elapsed > .05 && f.attack.elapsed < .28;
    const signatureTrail = f.attack?.signature && f.attack.elapsed >= f.getMove(f.attack.name).windup * .75 && f.attack.elapsed < (f.getMove(f.attack.name).activeEnd || .72);
    const dodgeTrail = f.defense?.kind === 'dodge' && f.defense.elapsed > .02 && f.defense.elapsed < .18;
    if (!this.reducedMotion.matches && (dashTrail || hopTrail || signatureTrail || dodgeTrail)) {
      for (const lag of [.085, .045]) {
        const ghost = { ...f };
        if (f.attack) ghost.attack = { ...f.attack, elapsed: Math.max(0, f.attack.elapsed - lag) };
        if (dodgeTrail) ghost.defense = { ...f.defense, elapsed: Math.max(0, f.defense.elapsed - lag) };
        const pose = projectPose(computePose(ghost));
        c.save(); c.globalAlpha = lag > .06 ? .08 : .18;
        c.translate(f.x - f.vx * lag, sy - f.vy * lag + (hopTrail ? f.vz * lag : 0)); c.scale(scale * f.facing, scale);
        c.translate(...pose.hip); c.rotate(pose.rotation); c.translate(-pose.hip[0], -pose.hip[1]);
        c.lineCap = 'round'; c.lineJoin = 'round'; this.skeleton(pose, f, INK); c.restore();
      }
    }
    c.save(); c.translate(f.x, sy); c.scale(scale * f.facing, scale); c.lineCap = 'round'; c.lineJoin = 'round';
    if (f.alive && f.attack?.signature && f.attack.elapsed < f.getMove(f.attack.name).windup) {
      c.save(); c.globalAlpha = .22; c.strokeStyle = f.color; c.lineWidth = 2;
      c.beginPath(); c.ellipse(0, 0, 22 + f.attack.elapsed * 30, 7, 0, 0, Math.PI * 2); c.stroke(); c.restore();
    }
    if (!f.alive && f.z === 0) c.translate(0, 37);
    c.translate(...p.hip); c.rotate(p.rotation); c.translate(-p.hip[0], -p.hip[1]);
    this.weaponTrail(f);
    this.strikeTrail(f);
    this.skeleton(p, f, f.flash > 0 ? '#b54c37' : INK);
    if (f.attack && f.attack.elapsed > .16 && f.attack.elapsed < .46) {
      c.save(); c.strokeStyle = `${f.color}88`; c.lineWidth = 3;
      if (f.attack.name === 'JumpKick') { c.beginPath(); c.arc(1, -55, 55, -.7, .65); c.stroke(); }
      if (f.attack.name === 'Uppercut') { c.beginPath(); c.arc(2, -90, 36, 1.2, -1.35, true); c.stroke(); }
      c.restore();
    }
    c.restore();
    if (f.alive) {
      c.save(); c.translate(f.x, sy - 131 * scale); c.textAlign = 'center';
      c.font = '600 10px monospace'; c.fillStyle = f.color;
      if (!this.nameLabels.has(f.name)) {
        const letters = Array.from(f.name);
        while (letters.length > 1 && c.measureText(letters.join('') + '…').width > 88) letters.pop();
        this.nameLabels.set(f.name, letters.length < Array.from(f.name).length ? letters.join('') + '…' : f.name);
      }
      c.fillText(this.nameLabels.get(f.name), 0, -7);
      c.fillStyle = '#38392b22'; c.fillRect(-22, 0, 44, 3);
      c.fillStyle = f.color; c.fillRect(-22, 0, 44 * f.hp / f.maxHp, 3); c.restore();
    }
  }
  draw(world, feedback) {
    const c = this.ctx, dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const rect = this.rect;
    if (!rect.width || !rect.height) return;
    const w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    const view = this.camera.frame(world, rect.width, rect.height, this.mobile.matches && !this.overview, this.reducedMotion.matches);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#eae6d7'; c.fillRect(0, 0, rect.width, rect.height);
    const shake = world.finished ? { x: 0, y: 0 } : feedback?.offset(this.reducedMotion.matches) || { x: 0, y: 0 };
    c.save(); c.translate(rect.width / 2 + shake.x, rect.height / 2 + shake.y); c.scale(view.scale, view.scale); c.translate(-view.x, -view.y);
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
    c.font = '11px monospace'; c.fillStyle = '#878d79'; c.fillText(t('courtyard') + ' / 01', 44, 653);
    c.textAlign = 'right'; c.fillText(t('projectile'), 1156, 653); c.textAlign = 'left';
    for (const item of world.hazards.items) this.hazard(item, world);
    const objects = [...world.fighters.map(f => ({ depth: f.y, fighter: f })), ...(world.arena?.walls || []).map(w => ({ depth: w.y + w.d / 2, wall: w }))];
    for (const bar of world.arena?.bars || []) for (let part = -3; part <= 3; part++) {
      const point = barPoint(bar, world.time, part === 0 ? 0 : (Math.abs(part) - .5) / 3 * bar.radius * Math.sign(part));
      objects.push({ depth: point.y, bar, part });
    }
    objects.sort((a, b) => a.depth - b.depth).forEach(o => o.bar ? this.spinner(o.bar, world.time, o.part) : o.wall ? this.wall(o.wall) : this.fighter(o.fighter, world.time));
    for (const e of world.effects) this.effect(e);
    c.restore();
    if (view.closeUp) {
      const edges = { left: [], right: [] };
      for (const f of world.fighters.filter(f => f.alive)) {
        const x = (f.x - view.x) * view.scale + rect.width / 2;
        const y = (f.y - f.z - 55 - view.y) * view.scale + rect.height / 2;
        if (x >= 15 && x <= rect.width - 15 && y >= 55 && y <= rect.height - 25) continue;
        const left = x < rect.width / 2, side = left ? 'left' : 'right';
        const insideX = x >= 15 && x <= rect.width - 15;
        const arrow = insideX && y < 55 ? '↑' : insideX && y > rect.height - 25 ? '↓' : left ? '‹' : '›';
        edges[side].push({ color: f.color, label: `${arrow}${String(f.id + 1).padStart(2, '0')}` });
      }
      const capacity = Math.max(1, Math.min(4, Math.floor((rect.height - 130) / 28)));
      for (const [side, entries] of Object.entries(edges)) {
        const markers = entries.length <= capacity ? entries : [...entries.slice(0, capacity - 1),
          { color: INK, label: `+${entries.length - capacity + 1}` }];
        for (const [index, marker] of markers.entries()) {
          const sx = side === 'left' ? 9 : rect.width - 43;
          const sy = clamp(75 + index * 28, 65, rect.height - 55);
          c.fillStyle = '#f5f3e9e6'; c.strokeStyle = marker.color; c.lineWidth = 1;
          c.beginPath(); c.roundRect(sx, sy, 34, 22, 11); c.fill(); c.stroke();
          c.fillStyle = marker.color; c.textAlign = 'center'; c.font = '10px monospace';
          c.fillText(marker.label, sx + 17, sy + 15);
        }
      }
      c.textAlign = 'left';
    }
    this.dirty = false;
  }
}
