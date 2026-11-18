const INK = '#292b27';
export class Renderer {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); }
  line(points, color = INK, width = 4.5) {
    const c = this.ctx; c.beginPath(); c.strokeStyle = color; c.lineWidth = width;
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
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
  draw(world, paused) {
    const c = this.ctx, dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    c.setTransform(w / 1200, 0, 0, h / 680, 0, 0);
    c.fillStyle = '#eae6d7'; c.fillRect(0, 0, 1200, 680);
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
    [...world.fighters].sort((a, b) => a.y - b.y || a.id - b.id).forEach(f => this.fighter(f, world.time));
    for (const e of world.effects) {
      c.save(); c.globalAlpha = e.ttl / e.life; c.textAlign = 'center'; c.fillStyle = '#a44735';
      c.font = 'bold 15px monospace'; c.fillText(e.text || e.type, e.x, e.y - e.z - 95 - (1 - e.ttl) * 45); c.restore();
    }
    if (world.finished || paused) {
      c.fillStyle = '#f1eedfcc'; c.fillRect(310, 265, 580, 120);
      c.textAlign = 'center'; c.fillStyle = INK; c.font = 'bold 46px Georgia';
      c.fillText(paused ? 'A moment of peace.' : world.winner ? `${world.winner.name} WINS` : 'A glorious draw.', 600, 323);
      c.font = '12px monospace'; c.fillText(paused ? 'RESUME TO UNLEASH THE CHAOS' : 'NEW MATCH. NEW ODDS. NEW CHAOS.', 600, 357); c.textAlign = 'left';
    }
  }
}
