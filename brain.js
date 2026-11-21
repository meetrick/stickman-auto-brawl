import { clamp } from './random.js?v=20261119-cinema';
import { sameTeam } from './teams.js?v=20261119-cinema';

export const PERSONALITIES = ['Aggressive', 'Cowardly', 'Brawler', 'Trickster', 'Opportunist', 'Counterfighter'];
export const normalizePersonality = value => PERSONALITIES.includes(value) ? value : 'Random';
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function chooseOpponent(f, enemies, world, fallback) {
  if (!enemies.length) return null;
  const committed = enemies.find(g => g.id === f.counterTargetId && world.time < f.counterUntil
    || g.id === f.engagementTargetId && f.followUp && world.time < f.followUpUntil);
  if (committed) return committed;
  // Nearby help is tactical, not a stat boost; real counters/combos stay committed.
  if (world.hasTeams && (f.personality !== 'Cowardly' || f.hp / f.maxHp > .55)) {
    const allies = world.fighters.filter(g => g !== f && g.alive && sameTeam(f, g));
    const threats = enemies.filter(g => distance(f, g) < 260 && allies.some(ally =>
      ally.heldBy === g.id || g.attack?.targetId === ally.id
      || ally.lastAttackerId === g.id && world.time < ally.retaliateUntil && distance(g, ally) < 140));
    if (threats.length) return threats.reduce((a, b) => distance(f, a) <= distance(f, b) ? a : b);
  }
  const nearest = enemies.reduce((a, b) => distance(f, a) <= distance(f, b) ? a : b);
  if (['Aggressive', 'Cowardly'].includes(f.personality)) return nearest;
  if (f.personality === 'Brawler') {
    return enemies.find(g => g.id === f.lastAttackerId && world.time < f.retaliateUntil && distance(f, g) < 180) || fallback || nearest;
  }
  if (f.personality !== 'Opportunist') return fallback || nearest;
  const remembered = f.opponentMemory;
  const previous = enemies.find(g => g.id === remembered?.id);
  if (previous && world.time < remembered.until) return previous;
  // Read visible health, range and current attacks, never future RNG results.
  const candidates = enemies.filter(g => distance(f, g) < 340);
  const score = g => distance(f, g) * .65 + g.hp / g.maxHp * 100
    - (g.attack && g.attack.targetId !== f.id ? 65 : 0) - (g.stun > 0 ? 35 : 0);
  const target = candidates.length ? candidates.reduce((a, b) => score(a) <= score(b) ? a : b) : nearest;
  f.opponentMemory = { id: target.id, until: world.time + .6 }; return target;
}

export function retreatGoal(f, threat, enemies, bounds, side = 1) {
  const length = distance(f, threat) || 1, dx = (f.x - threat.x) / length, dy = (f.y - threat.y) / length;
  const desired = { x: f.x + dx * 145 + dy * 65 * side, y: f.y + dy * 145 - dx * 65 * side };
  const angle = Math.atan2(desired.y - f.y, desired.x - f.x), visible = enemies.filter(g => distance(f, g) < 320);
  const candidates = [0, .6, -.6, 1.2, -1.2, Math.PI].map(offset => ({
    x: clamp(f.x + Math.cos(angle + offset) * 155, bounds.left + 22, bounds.right - 22),
    y: clamp(f.y + Math.sin(angle + offset) * 155, bounds.top + 22, bounds.bottom - 22),
  }));
  const score = goal => {
    const clearance = Math.min(...visible.map(g => distance(goal, g)), 320);
    const wall = Math.min(goal.x - bounds.left, bounds.right - goal.x, goal.y - bounds.top, bounds.bottom - goal.y);
    return clearance * 1.4 + Math.min(45, wall) - distance(goal, desired) * .7;
  };
  return candidates.reduce((a, b) => score(a) >= score(b) ? a : b);
}

export function planBehavior(f, target, enemies, world, cornered = false) {
  const time = world.time, d = distance(f, target);
  const counter = target.id === f.counterTargetId && time < f.counterUntil;
  const combo = f.followUp && time < f.followUpUntil;
  // Endgame, real counters and connected combinations take precedence.
  if (enemies.length <= 1 || counter || combo) { f.tacticalPlan = null; return null; }
  const old = f.tacticalPlan;
  if (old && old.role === f.personality && old.targetId === target.id && time < old.until
    && (old.mode !== 'heal' || f.hp < f.maxHp && world.hazards.items.some(i => i.id === old.itemId))) return old;
  const nearby = enemies.filter(g => distance(f, g) < 150);
  const hp = f.hp / f.maxHp;
  let plan = null;
  if (['Cowardly', 'Opportunist'].includes(f.personality) && hp < .55 && d > 85 && time >= (f.seekHealAfter || 0)) {
    const potions = world.hazards.items.filter(item => item.type === 'potion' && item.armAt <= time
      && distance(f, item) < 230 && !enemies.some(g => distance(g, item) < 65));
    if (potions.length) {
      const item = potions.reduce((a, b) => distance(f, a) < distance(f, b) ? a : b);
      plan = { mode: 'heal', goal: { x: item.x, y: item.y }, itemId: item.id, until: time + .2 };
      f.healPursuitUntil ||= time + 1.8;
      if (time >= f.healPursuitUntil) { plan = null; f.seekHealAfter = time + 1.5; f.healPursuitUntil = 0; }
    }
  }
  if (plan?.mode !== 'heal') f.healPursuitUntil = 0;
  if (old?.mode === 'withdraw' && time >= (f.withdrawUntil || 0)) {
    f.tacticalCommitUntil = time + 1.1;
    f.courageUntil = Math.max(f.courageUntil || 0, f.tacticalCommitUntil);
  }
  const canWithdraw = !cornered && f.stamina > .3 && !f.exhausted && time >= (f.tacticalCommitUntil || 0);
  const inDanger = hp < .25 && nearby.length >= (f.personality === 'Aggressive' ? 3 : 2);
  if (!plan && canWithdraw && inDanger) {
    f.withdrawUntil ||= time + .7;
    if (time >= f.withdrawUntil) { f.withdrawUntil = time + .7; }
    plan = { mode: 'withdraw', until: Math.min(time + .2, f.withdrawUntil),
      goal: retreatGoal(f, target, enemies, world.bounds, f.id % 2 ? 1 : -1) };
  }
  const patient = ['Opportunist', 'Counterfighter'].includes(f.personality);
  const recovering = target.attack && (target.attack.resolved || target.attack.elapsed > (target.getMove(target.attack.name).activeEnd || target.getMove(target.attack.name).windup + .12));
  const occupied = target.attack && target.attack.targetId !== f.id;
  if (!plan && patient && !cornered && time >= (f.tacticalCommitUntil || 0) && d < 210 && d > 65) {
    if (recovering || occupied && f.personality === 'Opportunist' || target.stun > 0) {
      f.tacticalCommitUntil = time + 1; f.watchUntil = 0;
    } else {
      f.watchUntil ||= time + (f.personality === 'Counterfighter' ? .65 : .45);
      if (time >= f.watchUntil) { f.tacticalCommitUntil = time + 1.1; f.watchUntil = 0; }
      else {
        const dx = (f.x - target.x) / (d || 1), dy = (f.y - target.y) / (d || 1), side = f.id % 2 ? 1 : -1;
        plan = { mode: 'watch', until: Math.min(time + .2, f.watchUntil), goal: {
          x: clamp(target.x + dx * 112 + dy * 40 * side, world.bounds.left + 22, world.bounds.right - 22),
          y: clamp(target.y + dy * 112 - dx * 40 * side, world.bounds.top + 22, world.bounds.bottom - 22) } };
      }
    }
  }
  f.tacticalPlan = plan ? { ...plan, role: f.personality, targetId: target.id } : null;
  return f.tacticalPlan;
}
