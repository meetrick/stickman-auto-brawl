import { clamp, range } from './random.js';
import { WEAPONS } from './weapons.js';

export const MOVES = Object.freeze({
  Punch: { damage: 6, knockback: 65, lift: 0, reach: 65, engage: 70, windup: .10, activeEnd: .17, duration: .28 },
  Kick: { damage: 11, knockback: 230, lift: 0, reach: 85, engage: 90, windup: .18, activeEnd: .29, duration: .46 },
  Dash: { damage: 10, knockback: 300, lift: 0, reach: 54, engage: 240, windup: .12, duration: .52 },
  JumpKick: { damage: 14, knockback: 300, lift: 0, reach: 83, engage: 135, windup: .14, activeEnd: .28, duration: .48 },
  Uppercut: { damage: 12, knockback: 195, lift: 285, reach: 62, engage: 62, windup: .23, duration: .58 },
  Grab: { damage: 16, knockback: 400, lift: 255, reach: 55, engage: 55, windup: .16, duration: .86 },
  WeaponStrike: WEAPONS.Sword.strike,
});
export const COLORS = ['#bf473b', '#438477', '#b98935', '#697ea0', '#95618a', '#5e7443', '#c27443', '#577f8b'];
export const NAMES = ['EMBER', 'JADE', 'GOLD', 'COBALT', 'IRIS', 'MOSS', 'RUST', 'TIDE'];
export const PERSONALITIES = ['Aggressive', 'Cowardly', 'Brawler', 'Trickster'];
export const GAITS = ['Walker', 'Runner', 'Sprinter'];
const MOVE_NAMES = Object.keys(MOVES);

export class Fighter {
  constructor(id, x, y, rng = Math.random) {
    Object.assign(this, { id, x, y, z: 0, vx: 0, vy: 0, vz: 0, facing: 1,
      state: 'idle', stun: 0, attack: null, cooldown: range(rng, .1, .8),
      flash: 0, age: 0, attackVariants: {}, stridePhase: rng() * Math.PI * 2, tumble: 0, angularVelocity: 0,
      stamina: 1, intent: 'chase', heldBy: null, holdingId: null,
      color: COLORS[id % COLORS.length], name: NAMES[id % NAMES.length] });
    this.maxHp = 80 + Math.floor(rng() * 51); this.hp = this.maxHp;
    this.speed = range(rng, 90, 155); this.power = range(rng, .8, 1.25);
    this.personality = PERSONALITIES[Math.floor(rng() * PERSONALITIES.length)];
    this.gait = GAITS[Math.floor(rng() * GAITS.length)];
    this.weapon = 'None';
    const moves = MOVE_NAMES.filter(name => name !== 'WeaponStrike' || this.weapon !== 'None');
    this.favoriteMove = moves[Math.floor(rng() * moves.length)];
    this.tempo = range(rng, .8, 1.3);
    this.collateralActive = false; this.flightHits = new Set();
  }
  get alive() { return this.hp > 0; }
  get standing() { return this.alive && this.heldBy == null && this.z <= 1 && this.stun <= 0; }
  getMove(name) { return name === 'WeaponStrike' ? WEAPONS[this.weapon]?.strike || MOVES.WeaponStrike : MOVES[name]; }
  startAttack(name, target) {
    if (!this.standing || this.landing > 0 || this.attack || this.cooldown > 0 || target.heldBy != null || (name === 'JumpKick' && this.jumpCooldown > 0) || (name === 'WeaponStrike' && this.weapon === 'None')) return false;
    const dx = target.x - this.x, dy = target.y - this.y, length = Math.hypot(dx, dy) || 1;
    this.facing = dx >= 0 ? 1 : -1;
    const variant = (this.attackVariants[name] || 0) % 2;
    this.attackVariants[name] = (this.attackVariants[name] || 0) + 1;
    this.attack = { name, targetId: target.id, elapsed: 0, duration: this.getMove(name).duration, variant, resolved: false, hitIds: [], dx: dx / length, dy: dy / length };
    this.state = 'attack'; this.vx = this.vy = 0;
    if (name === 'JumpKick') { this.vz = 195; this.jumpCooldown = 3.5; }
    return true;
  }
  receiveHit(damage, vx, vy, vz) {
    if (!this.alive) return false;
    this.hp = Math.max(0, this.hp - damage);
    const airborne = vz > 0 || this.z > 1;
    this.vx = vx; this.vy = vy; this.vz = vz;
    if (airborne) this.z = Math.max(this.z, 2);
    this.stun = airborne ? .42 : .16; this.flash = .12; this.attack = null; this.heldBy = null;
    this.followUp = null; this.comboStep = 0;
    this.tumble = 0; this.angularVelocity = clamp(vx / 130, -6, 6);
    this.state = this.alive ? airborne ? 'down' : 'hit' : 'ko'; this.collateralActive = airborne; this.flightHits.clear();
    return true;
  }
  releaseGrab(world) {
    const target = world.fighters.find(f => f.id === this.holdingId);
    if (target?.heldBy === this.id) {
      target.heldBy = null; target.stun = .3; target.vz = 70; target.state = target.alive ? 'down' : 'ko';
    }
    this.holdingId = null;
  }
  settleDeath(world) {
    if (this.alive) return;
    if (this.holdingId != null) this.releaseGrab(world);
    this.heldBy = null; this.attack = null; this.state = 'ko'; this.intent = 'dead';
    this.z = 0; this.vx = this.vy = this.vz = this.angularVelocity = 0;
    this.tumble = -Math.PI / 2; this.stun = this.flash = 0; this.sprinting = false;
    this.collateralActive = false; this.flightHits.clear(); this.settled = true;
    this.previous = { x: this.x, y: this.y, z: 0 };
  }
  hit(target, world, name) {
    if (name === 'WeaponStrike' && this.weapon === 'None') return false;
    if (world.arena && !world.arena.attackClear(this, target)) return false;
    const move = this.getMove(name), dx = target.x - this.x, dy = target.y - this.y, length = Math.hypot(dx, dy) || 1;
    const crit = this.attack?.name === name ? (this.attack.crit ??= world.rng() < .1) : world.rng() < .1;
    const knockback = move.knockback * (crit ? 2 : 1), lift = move.lift * (crit ? 2 : 1);
    if (!target.receiveHit(move.damage * this.power * (crit ? 3 : 1), dx / length * knockback, dy / length * knockback, lift)) return false;
    if (crit) { world.stats.crits++; target.flash = .3; }
    const text = name === 'WeaponStrike' ? { Sword: 'SLASH!', Staff: 'STAFF SWEEP!', Hammer: 'HAMMER SMASH!' }[this.weapon]
      : { Punch: 'PUNCH!', Kick: 'KICK!', Dash: 'DASH CRASH!', JumpKick: 'FLYING KICK!', Uppercut: 'UPPERCUT!', Grab: 'THROWN!' }[name];
    world.stats.moves ||= Object.fromEntries(MOVE_NAMES.map(key => [key, 0])); world.stats.moves[name]++;
    if (name === 'WeaponStrike') {
      world.stats.weaponHits ||= { Sword: 0, Staff: 0, Hammer: 0 }; world.stats.weaponHits[this.weapon]++;
    }
    world.emit('hit', target, { text: crit ? 'CRIT!' : text, move: name, weapon: this.weapon, source: this.id, crit }); return true;
  }
  moveToward(goal, world, hurry = false) {
    const waypoint = world.arena?.waypoint(this, goal, world) || goal;
    const dx = waypoint.x - this.x, dy = waypoint.y - this.y, length = Math.hypot(dx, dy) || 1;
    const sprint = (this.gait === 'Sprinter' || hurry) && this.stamina > .2 && !this.exhausted;
    const multiplier = sprint ? 1.85 : this.gait === 'Runner' ? 1.35 : .9;
    this.vx = dx / length * this.speed * multiplier; this.vy = dy / length * this.speed * multiplier;
    this.state = multiplier > 1.1 ? 'run' : 'walk'; this.sprinting = sprint;
    if (Math.abs(dx) > 4) this.facing = dx > 0 ? 1 : -1;
  }
  think(dt, world) {
    if (world.time < (this.readyAt || 0) || !this.standing || this.landing > 0 || this.attack) return;
    const enemies = world.fighters.filter(f => f !== this && f.alive && f.heldBy == null);
    const target = enemies.sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))[0];
    if (!target) return;
    const dx = target.x - this.x, dy = target.y - this.y, distance = Math.hypot(dx, dy) || 1, b = world.bounds;
    this.facing = dx >= 0 ? 1 : -1;
    const cornered = (this.x < b.left + 60 && dx > 0) || (this.x > b.right - 60 && dx < 0)
      || (this.y < b.top + 45 && dy > 0) || (this.y > b.bottom - 45 && dy < 0);
    if (cornered) this.courageUntil = world.time + 2.5;
    if (this.personality === 'Cowardly' && distance < 210 && !cornered && world.time >= (this.courageUntil || 0)) {
      this.intent = 'flee';
      this.moveToward({ x: clamp(this.x - dx / distance * 150, b.left + 18, b.right - 18), y: clamp(this.y - dy / distance * 150, b.top + 18, b.bottom - 18) }, world, true);
      this.facing = dx >= 0 ? 1 : -1;
      if (world.time >= (this.evadeAt || 0)) {
        this.evadeAt = world.time + range(world.rng, 1, 2);
        if (distance < 145 && world.rng() < .3) { this.vx *= 1.3; this.vy *= 1.3; this.state = 'evade'; }
      }
      return;
    }
    if (world.time >= (this.decisionAt || 0)) {
      this.decisionAt = world.time + range(world.rng, .55, 1.1);
      this.flankSide = world.rng() < .5 ? -1 : 1;
      this.flank = this.personality === 'Trickster' && world.rng() < .55;
    }
    if (this.cooldown <= 0 && target.z < 65) {
      if (this.followUp && world.time < this.followUpUntil && distance < MOVES[this.followUp].engage) {
        const name = this.followUp; this.followUp = null;
        if (this.startAttack(name, target)) { this.intent = 'combo'; return; }
      }
      let choices = MOVE_NAMES.filter(name => distance <= this.getMove(name).engage && (name !== 'JumpKick' || !(this.jumpCooldown > 0)) && (name !== 'Grab' || target.standing) && (name !== 'WeaponStrike' || this.weapon !== 'None'));
      const preferred = this.personality === 'Brawler' ? 'Grab' : this.personality === 'Trickster' ? 'Kick'
        : this.weapon !== 'None' ? 'WeaponStrike' : 'Punch';
      // Close-range specialists must actually close in, rather than selecting
      // Dash as soon as it becomes the first available move every encounter.
      if (distance > this.getMove(preferred).engage) choices = [];
      if (choices.length) {
        // Ground exchanges dominate; launches and short hops punctuate them.
        const weights = choices.map(name => ({ name, weight: (name === preferred ? 5 : 1) * (['JumpKick', 'Uppercut', 'Grab'].includes(name) ? .45 : 1) * (name === this.favoriteMove ? 1.5 : 1) }));
        let roll = world.rng() * weights.reduce((sum, item) => sum + item.weight, 0);
        const name = weights.find(item => (roll -= item.weight) < 0)?.name || choices.at(-1);
        this.comboStep = 0;
        if (this.startAttack(name, target)) { this.intent = 'attack'; return; }
      }
    }
    if (this.flank && distance < 180 && distance > 45) {
      this.intent = 'flank';
      this.moveToward({ x: clamp(target.x - dy / distance * 85 * this.flankSide, b.left + 18, b.right - 18), y: clamp(target.y + dx / distance * 85 * this.flankSide, b.top + 18, b.bottom - 18) }, world, true);
    } else if (distance > 37) { this.intent = 'chase'; this.moveToward(target, world, (this.personality === 'Aggressive' && distance > 170) || (this.personality === 'Brawler' && distance > 70)); }
  }
  updateAttack(dt, world) {
    const a = this.attack, move = this.getMove(a.name); a.elapsed += dt;
    if (a.name === 'Dash') { const speed = !a.resolved && a.elapsed >= move.windup && a.elapsed < .36 ? 560 : 0; this.vx = a.dx * speed; this.vy = a.dy * speed; }
    if (a.name === 'JumpKick') { const speed = a.elapsed > .04 && a.elapsed < .28 ? 250 : 0; this.vx = a.dx * speed; this.vy = a.dy * speed; }
    if (a.name === 'Punch' || a.name === 'Kick') {
      const speed = a.elapsed > move.windup * .55 && a.elapsed < move.windup + .04 ? 145 : 0;
      this.vx = a.dx * speed; this.vy = a.dy * speed;
    }
    if (a.name === 'WeaponStrike') {
      const lunge = a.elapsed >= move.windup * .7 && a.elapsed < move.windup + .09 ? (this.weapon === 'Hammer' ? 110 : 190) : 0;
      this.vx = a.dx * lunge; this.vy = a.dy * lunge;
    }
    if (a.name === 'Grab') {
      this.vx = a.attempted ? 0 : a.dx * 160; this.vy = a.attempted ? 0 : a.dy * 160;
      const target = world.fighters.find(f => f.id === a.targetId);
      if (!a.attempted && a.elapsed >= move.windup) {
        a.attempted = true;
        if (target?.standing && Math.hypot(target.x - this.x, target.y - this.y) < move.reach + 12 && (!world.arena || world.arena.attackClear(this, target))) {
          this.holdingId = target.id; target.heldBy = this.id; target.attack = null; target.collateralActive = false;
          world.emit('grab', target, { text: 'GRABBED!', source: this.id });
        }
      }
      if (this.holdingId != null && target?.heldBy === this.id) {
        target.x = this.x + this.facing * 24; target.y = this.y + 1;
        target.z = 35 + clamp((a.elapsed - .16) / .32, 0, 1) * 30;
        target.vx = target.vy = target.vz = 0; target.state = 'held';
        if (a.elapsed >= .55 && !a.resolved) {
          a.resolved = true; this.releaseGrab(world); this.hit(target, world, 'Grab');
        }
      } else if (this.holdingId != null) this.holdingId = null;
    } else if (!a.resolved && a.elapsed >= move.windup && a.elapsed < (move.activeEnd || move.duration - .05)) {
      const candidates = world.fighters.filter(f => f !== this && f.alive && f.heldBy == null
        && !a.hitIds.includes(f.id)
        && Math.hypot(f.x - this.x, f.y - this.y) <= move.reach + 12 && Math.abs(f.z - this.z) < 85
        && (a.name !== 'WeaponStrike' || Math.abs((f.x - this.x) * a.dy - (f.y - this.y) * a.dx) < move.arcWidth)
        && (f.x - this.x) * a.dx + (f.y - this.y) * a.dy > (a.name === 'JumpKick' ? -28 : -15));
      candidates.sort((f, g) => Math.hypot(f.x - this.x, f.y - this.y) - Math.hypot(g.x - this.x, g.y - this.y));
      if (candidates[0] && this.hit(candidates[0], world, a.name)) {
        a.hitIds.push(candidates[0].id); a.resolved = a.hitIds.length >= (move.cleave || 1);
      }
    }
    if (a.elapsed >= move.duration) {
      this.releaseGrab(world); this.attack = null; this.cooldown = range(world.rng, .22, .55) * this.tempo;
      if (a.name === 'Punch' && a.hitIds.length && (this.comboStep || 0) < 2) {
        this.comboStep = (this.comboStep || 0) + 1;
        this.followUp = this.comboStep === 1 ? 'Punch' : 'Kick';
        this.followUpUntil = world.time + .65; this.cooldown = .045;
      }
      if (a.name === 'WeaponStrike' && this.weapon === 'Sword' && a.hitIds.length && world.rng() < .35) {
        this.followUp = 'Dash'; this.followUpUntil = world.time + 1; this.cooldown = .12;
      }
    }
  }
  update(dt, world) {
    if (this.settled) return;
    if (!this.alive && this.z === 0 && this.vz <= 0) { this.settleDeath(world); return; }
    this.previous = { x: this.x, y: this.y, z: this.z };
    this.age += dt; this.flash = Math.max(0, this.flash - dt);
    this.jumpCooldown = Math.max(0, (this.jumpCooldown || 0) - dt);
    this.landing = Math.max(0, (this.landing || 0) - dt);
    if (this.holdingId != null && (!this.alive || this.attack?.name !== 'Grab')) this.releaseGrab(world);
    if (this.heldBy != null) {
      const holder = world.fighters.find(f => f.id === this.heldBy);
      if (holder?.alive && holder.holdingId === this.id && holder.attack?.name === 'Grab') return;
      this.heldBy = null; this.stun = .3; this.vz = 70;
    }
    if (this.z === 0 && this.vz === 0) this.collateralActive = false;
    this.cooldown = Math.max(0, this.cooldown - dt); this.stun = Math.max(0, this.stun - dt);
    this.stamina = clamp(this.stamina + dt * (this.sprinting && this.standing ? -.4 : .25), 0, 1); this.sprinting = false;
    if (this.stamina <= .2) this.exhausted = true;
    else if (this.stamina >= .65) this.exhausted = false;
    this.think(dt, world);
    if (this.attack) this.updateAttack(dt, world);
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.stridePhase += Math.hypot(this.vx, this.vy) * dt * (this.state === 'run' ? .075 : .1);
    if (this.z > 0 || this.vz > 0) {
      this.vz -= 1280 * dt; this.z += this.vz * dt;
      if (this.collateralActive) this.tumble += this.angularVelocity * dt;
      if (this.z <= 0) { this.z = 0; this.vz = 0; this.landing = .10; }
    } else if (this.alive) this.tumble *= Math.exp(-dt * 12);
    const b = world.bounds;
    if (this.x < b.left || this.x > b.right) this.vx *= -.55;
    if (this.y < b.top || this.y > b.bottom) this.vy *= -.55;
    this.x = clamp(this.x, b.left, b.right); this.y = clamp(this.y, b.top, b.bottom);
    const drag = Math.exp(-(this.z > 0 ? .65 : 9) * dt); this.vx *= drag; this.vy *= drag;
    if (this.standing && !this.attack && Math.hypot(this.vx, this.vy) < 25) this.state = 'idle';
    if (!this.alive && this.z === 0) this.settleDeath(world);
  }
}
