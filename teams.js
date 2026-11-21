// Preserve display spelling; use a stable key only for automatic grouping.
export const teamNameKey = value => String(value).normalize('NFC').trim().toLowerCase();
export const sameTeam = (a, b) => Boolean(a && b && a.teamId != null && a.teamId === b.teamId);
export const areEnemies = (a, b) => Boolean(a && b && a !== b && !sameTeam(a, b));

export function buildTeams(fighters) {
  const byName = new Map();
  for (const f of fighters) {
    const key = teamNameKey(f.name);
    if (!byName.has(key)) byName.set(key, { id: byName.size, key, name: f.name, color: f.color, fighterIds: [] });
    const team = byName.get(key);
    team.fighterIds.push(f.id); f.teamId = team.id; f.color = team.color;
  }
  return [...byName.values()];
}
