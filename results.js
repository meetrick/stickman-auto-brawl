import { escapeHTML } from './settings.js?v=20261121-name-teams';
import { t } from './i18n.js?v=20261121-name-teams';

export function rankLabel(entry) {
  return entry.rank == null ? '—' : t(entry.tied ? 'tiedPlace' : 'place', { rank: entry.rank });
}

export function firstOutNames(match) {
  return match.eliminations.filter(entry => entry.order === 1)
    .map(entry => match.fighters[entry.fighterId].name).join(' · ');
}

export function lastPlaceTeamNames(match) {
  return match.teamEliminations.filter(entry => entry.order === 1)
    .map(entry => match.teams.find(team => team.id === entry.teamId).name).join(' · ');
}

export function standingsMarkup(match) {
  return match.standings.map(entry => {
    const fighter = match.fighters[entry.fighterId];
    const first = entry.order === 1;
    const status = entry.time == null ? t(match.finished ? 'survived' : 'stillFighting')
      : t(entry.tied ? 'tiedOutOrder' : 'outOrder', { order: entry.order });
    return `<li class="rank-row${match.finished && entry.rank === 1 ? ' rank-top' : ''}${first ? ' rank-last' : ''}"><b class="rank-place">${escapeHTML(rankLabel(entry))}</b><div class="rank-name"><strong>${escapeHTML(fighter.name)}</strong><small>#${String(fighter.id + 1).padStart(2, '0')} · ${escapeHTML(t(fighter.style))} · ${escapeHTML(status)}</small></div><span class="rank-time">${entry.time == null ? '—' : t('elapsedSeconds', { seconds: entry.time.toFixed(2) })}</span></li>`;
  }).join('');
}

export function teamStandingsMarkup(match) {
  return match.teamStandings.map(entry => {
    const team = match.teams.find(team => team.id === entry.teamId);
    const alive = team.fighterIds.filter(id => match.fighters[id].alive).length;
    return `<li class="rank-row${match.finished && entry.rank === 1 ? ' rank-top' : ''}"><b class="rank-place">${escapeHTML(rankLabel(entry))}</b><div class="rank-name"><strong><i class="team-dot" style="background:${team.color}"></i>${escapeHTML(team.name)}</strong><small>${escapeHTML(t('teamSurvivors', { alive, total: team.fighterIds.length }))} · ${team.fighterIds.map(id => `#${String(id + 1).padStart(2, '0')}`).join(' ')}</small></div><span class="rank-time">${entry.time == null ? '—' : t('elapsedSeconds', { seconds: entry.time.toFixed(2) })}</span></li>`;
  }).join('');
}

export function eliminationMarkup(match) {
  const groups = new Map();
  for (const entry of match.eliminations) {
    if (!groups.has(entry.order)) groups.set(entry.order, []);
    groups.get(entry.order).push(entry);
  }
  return [...groups.values()].map(entries => {
    const first = entries[0];
    const names = entries.map(e => `#${String(e.fighterId + 1).padStart(2, '0')} ${match.fighters[e.fighterId].name}`).join(' · ');
    return `<li><span class="out-order">${escapeHTML(t(first.tied ? 'tiedOutOrder' : 'outOrder', { order: first.order }))}</span><div><strong>${escapeHTML(names)}</strong><small>${escapeHTML(rankLabel(first))} · ${t('elapsedSeconds', { seconds: first.time.toFixed(2) })}</small></div></li>`;
  }).join('') || `<li class="rank-empty">${escapeHTML(t('noEliminations'))}</li>`;
}
