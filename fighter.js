import { clamp, range } from './random.js';

export const MOVES = Object.freeze({
  Dash: { damage: 10, knockback: 260, lift: 150, reach: 82, windup: .12, duration: .36 },
  JumpKick: { damage: 14, knockback: 350, lift: 235, reach: 88, windup: .22, duration: .55 },
  Uppercut: { damage: 12, knockback: 195, lift: 460, reach: 62, windup: .18, duration: .46 },
  Grab: { damage: 16, knockback: 440, lift: 310, reach: 46, windup: .25, duration: .62 },
});
export const COLORS = ['#bf473b', '#438477', '#b98935', '#697ea0', '#95618a', '#5e7443', '#c27443', '#577f8b'];
export const NAMES = ['EMBER', 'JADE', 'GOLD', 'COBALT', 'IRIS', 'MOSS', 'RUST', 'TIDE'];
export const PERSONALITIES = ['Aggressive', 'Cowardly'];

export class Fighter {
  constructor(id, x, y, rng = Math.random) {
    Object.assign(this, { id, x, y, z: 0, vx: 0, vy: 0, vz: 0, facing: 1,
      maxHp: 100, hp: 100, speed: 115, power: 1, personality: 'Aggressive',
      state: 'idle', stun: 0, attack: null, cooldown: range(rng, .1, .8),
      flash: 0, age: 0, color: COLORS[id % COLORS.length], name: NAMES[id % NAMES.length] });
    this.maxHp = 80 + Math.floor(rng() * 51);
    this.hp = this.maxHp;
    this.speed = range(rng, 90, 155);
    this.power = range(rng, .8, 1.25);
    this.personality = PERSONALITIES[Math.floor(rng() * PERSONALITIES.length)];
    this.collateralActive = false;
    this.flightHits = new Set();
  }
  get alive() { return this.hp > 0; }
  get standing() { return this.alive && this.z <= 1 && this.stun <= 0; }
  startAttack(name, target) {
    if (!this.standing || this.attack || this.cooldown > 0) return false;
    this.facing = target.x >= this.x ? 1 : -1;
    this.attack = { name, targetId: target.id, elapsed: 0, resolved: false };
    this.state = 'attack';
    if (name === 'JumpKick') this.vz = 260;
    return true;
  }
  receiveHit(damage, vx, vy, vz) {
    if (!this.alive) return false;
    this.hp = Math.max(0, this.hp - damage);
    this.vx = vx; this.vy = vy; this.vz = vz;
    this.z = Math.max(this.z, 2);
    this.stun = .65; this.flash = .16; this.attack = null;
    this.state = this.alive ? 'down' : 'ko';
    this.collateralActive = true;
    this.flightHits.clear();
    return true;
  }
  hit(target, world, name) {
    if (world.arena && !world.arena.attackClear(this, target)) return;
    const move = MOVES[name];
    const dx = target.x - this.x, dy = target.y - this.y;
    const length = Math.hypot(dx, dy) || 1;
    const crit = world.rng() < .1;
    const knockback = move.knockback * (crit ? 2 : 1);
    const lift = move.lift * (crit ? 2 : 1);
    if (!target.receiveHit(move.damage * this.power * (crit ? 3 : 1), dx / length * knockback,
      dy / length * knockback, lift)) return;
    if (crit) { world.stats.crits++; target.flash = .3; }
    world.emit('hit', target, { text: crit ? 'CRIT!' : name.toUpperCase(), source: this.id, crit });
  }
  moveToward(goal, world, multiplier = 1) {
    const waypoint = world.arena?.waypoint(this, goal, world) || goal;
    const dx = waypoint.x - this.x, dy = waypoint.y - this.y, length = Math.hypot(dx, dy) || 1;
    this.vx = dx / length * this.speed * multiplier; this.vy = dy / length * this.speed * multiplier;
    this.state = 'walk';
  }
  think(dt, world) {
    if (world.time < (this.readyAt || 0)) return;
    if (!this.standing || this.attack) return;
    const enemies = world.fighters.filter(f => f !== this && f.alive);
    const target = enemies.sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))[0];
    if (!target) return;
    const dx = target.x - this.x, dy = target.y - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    this.facing = dx >= 0 ? 1 : -1;
    const b = world.bounds;
    const cornered = (this.x < b.left + 60 && dx > 0) || (this.x > b.right - 60 && dx < 0)
      || (this.y < b.top + 45 && dy > 0) || (this.y > b.bottom - 45 && dy < 0);
    // Commit briefly after being cornered; otherwise fleeing resumes one step
    // off the boundary and the coward oscillates without ever fighting back.
    if (cornered) this.courageUntil = world.time + 2.5;
    if (this.personality === 'Cowardly' && distance < 210 && !cornered && world.time >= (this.courageUntil || 0)) {
      this.moveToward({ x: clamp(this.x - dx / distance * 150, b.left + 18, b.right - 18), y: clamp(this.y - dy / distance * 150, b.top + 18, b.bottom - 18) }, world); return;
    }
    if (distance < 70 && this.cooldown <= 0 && target.z < 70) {
      const choices = Object.keys(MOVES).filter(name => MOVES[name].reach >= distance);
      if (choices.length) this.startAttack(choices[Math.floor(world.rng() * choices.length)], target);
    } else if (distance > 38) {
      this.moveToward(target, world);
    }
  }
  update(dt, world) {
    if (this.z === 0 && this.vz === 0) this.collateralActive = false;
    this.age += dt; this.flash = Math.max(0, this.flash - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.previous = { x: this.x, y: this.y, z: this.z };
    this.think(dt, world);
    if (this.attack) {
      const attack = this.attack, move = MOVES[attack.name];
      attack.elapsed += dt;
      if (attack.name === 'Dash') this.vx = this.facing * 300;
      if (!attack.resolved && attack.elapsed >= move.windup) {
        attack.resolved = true;
        const target = world.fighters.find(f => f.id === attack.targetId);
        if (target?.alive && Math.hypot(target.x - this.x, target.y - this.y) <= move.reach + 12 && Math.abs(target.z - this.z) < 85) {
          this.hit(target, world, attack.name);
        }
      }
      if (attack.elapsed >= move.duration) {
        this.attack = null; this.cooldown = range(world.rng, .35, .8);
      }
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.z > 0 || this.vz > 0) {
      this.vz -= 880 * dt; this.z += this.vz * dt;
      if (this.z <= 0) { this.z = 0; this.vz = 0; }
    }
    const b = world.bounds;
    if (this.x < b.left || this.x > b.right) this.vx *= -.55;
    if (this.y < b.top || this.y > b.bottom) this.vy *= -.55;
    this.x = clamp(this.x, b.left, b.right); this.y = clamp(this.y, b.top, b.bottom);
    const drag = Math.exp(-(this.z > 0 ? .65 : 9) * dt);
    this.vx *= drag; this.vy *= drag;
    if (this.standing && !this.attack) this.state = Math.hypot(this.vx, this.vy) > 25 ? 'walk' : 'idle';
  }
}
