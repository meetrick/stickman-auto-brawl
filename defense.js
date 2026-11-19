import { range } from './random.js?v=20261119-tactical-ai';

export const DEFENSE_PROFILES = {
  Ninja: { reaction: .46, guard: .15, speed: 300 },
  Boxing: { reaction: .40, guard: .72, speed: 225 },
  Judo: { reaction: .34, guard: .65, speed: 230 },
  Kickboxing: { reaction: .38, guard: .55, speed: 250 },
  Taekwondo: { reaction: .40, guard: .35, speed: 270 },
};

export function beginDefense(f, kind, threat, world) {
  if (!['guard', 'dodge'].includes(kind) || !f.standing || f.attack || f.defense || f.landing > 0 || f.defenseCooldown > 0) return false;
  const cost = kind === 'guard' ? .12 : .22;
  if (f.stamina < cost + .08 || !threat?.alive) return false;
  const dx = threat.x - f.x, dy = threat.y - f.y, length = Math.hypot(dx, dy) || 1;
  const side = world.rng() < .5 ? -1 : 1;
  f.defense = { kind, elapsed: 0, duration: kind === 'guard' ? .32 : .36, dx: dx / length, dy: dy / length,
    sourceId: threat.id, serial: threat.attack?.serial, used: false };
  f.defenseCooldown = range(world.rng, 1.15, 1.65); f.stamina -= cost;
  f.followUp = null; f.comboStep = 0; f.footworkUntil = 0;
  f.facing = dx >= 0 ? 1 : -1; f.state = kind; f.intent = kind;
  f.vx = f.vy = 0;
  if (kind === 'dodge') {
    const speed = (DEFENSE_PROFILES[f.style] || DEFENSE_PROFILES.Kickboxing).speed;
    const sx = -dy / length * side - dx / length * .35, sy = dx / length * side - dy / length * .35;
    const scale = speed / Math.hypot(sx, sy);
    f.defense.vx = f.vx = sx * scale; f.defense.vy = f.vy = sy * scale;
  }
  return true;
}

export function updateDefense(f, dt) {
  f.defenseCooldown = Math.max(0, (f.defenseCooldown || 0) - dt);
  if (!f.defense) return;
  const d = f.defense; d.elapsed += dt;
  if (d.kind === 'dodge') {
    const speed = d.elapsed < .16 ? 1 : .12;
    f.vx = d.vx * speed; f.vy = d.vy * speed;
  }
  f.state = d.kind;
  if (d.elapsed >= d.duration) {
    f.defense = null; f.vx *= .2; f.vy *= .2;
    f.cooldown = Math.max(f.cooldown, .08); f.state = 'idle';
  }
}

export function reactToThreat(f, world) {
  if (f.defenseCooldown > 0 || f.stamina < .30) return false;
  const threat = world.fighters.find(other => {
    const a = other.attack;
    if (other === f || !other.alive || !a || a.resolved || a.targetId !== f.id || a.elapsed < .025) return false;
    const move = other.getMove(a.name), remaining = move.windup - a.elapsed;
    return remaining >= .035 && remaining <= .18 && Math.hypot(other.x - f.x, other.y - f.y) < move.reach + 60
      && !f.reactedAttacks.has(`${other.id}:${a.serial}`);
  });
  if (!threat) return false;
  f.reactedAttacks.add(`${threat.id}:${threat.attack.serial}`);
  const profile = DEFENSE_PROFILES[f.style] || DEFENSE_PROFILES.Kickboxing;
  const chance = profile.reaction + (f.personality === 'Counterfighter' ? .2 : f.personality === 'Cowardly' ? .16 : f.personality === 'Trickster' ? .08 : f.personality === 'Aggressive' ? -.10 : 0);
  if (world.rng() >= chance) return false;
  const kind = threat.attack.name === 'Grab' || world.rng() >= profile.guard ? 'dodge' : 'guard';
  return beginDefense(f, kind, threat, world);
}

// A timed defense only covers the front, never a flying-body collision.
export function defenseContact(f, attacker, name, world, crit) {
  const d = f.defense;
  if (!d || !f.standing || name === 'Grab' || d.used) return null;
  const dx = attacker.x - f.x, dy = attacker.y - f.y, distance = Math.hypot(dx, dy) || 1;
  if ((dx * d.dx + dy * d.dy) / distance < .35 || d.elapsed < .03) return null;
  if (d.kind === 'dodge') {
    if (d.elapsed > .16 || d.sourceId !== attacker.id || d.serial !== attacker.attack?.serial) return null;
    d.used = true; f.counterTargetId = attacker.id; f.counterUntil = world.time + .7;
    f.courageUntil = world.time + .9;
    world.stats.dodges = (world.stats.dodges || 0) + 1;
    world.emit('dodge', f, { text: 'DODGED!', source: attacker.id });
    return { dodged: true };
  }
  if (d.elapsed > .24) return null;
  d.used = true;
  if (crit || attacker.attack?.signature || name === 'Dash' || f.stamina < .08) {
    f.defense = null;
    world.stats.guardBreaks = (world.stats.guardBreaks || 0) + 1;
    world.emit('guardBreak', f, { text: 'GUARD BREAK!', source: attacker.id });
    return { damage: .75, knockback: .7, lift: .65 };
  }
  f.stamina = Math.max(0, f.stamina - .08);
  f.counterTargetId = attacker.id; f.counterUntil = world.time + .7;
  f.courageUntil = world.time + .9;
  world.stats.blocks = (world.stats.blocks || 0) + 1;
  world.emit('block', f, { text: 'BLOCK!', source: attacker.id });
  return { damage: .25, knockback: .22, lift: 0, guard: d };
}
