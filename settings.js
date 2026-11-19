import { NAMES } from './fighter.js?v=20261119-fight-camera';
import { normalizeStyle } from './styles.js?v=20261119-fight-camera';

export const SETTINGS_KEY = 'stickman-auto-brawl.preferences.v1';
export const MIN_FIGHTERS = 2, MAX_FIGHTERS = 12, MAX_NAME_LENGTH = 16;
export function normalizeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(MIN_FIGHTERS, Math.min(MAX_FIGHTERS, Math.round(count))) : 8;
}
export function normalizeName(value, index) {
  const name = typeof value === 'string' ? Array.from(value.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, MAX_NAME_LENGTH).join('') : '';
  return name || NAMES[index] || `FIGHTER ${index + 1}`;
}
export function normalizePreferences(value = {}) {
  if (!value || typeof value !== 'object') value = {};
  return { count: value.count == null ? 8 : normalizeCount(value.count), language: value.language === 'ko' ? 'ko' : 'en',
    names: Array.from({ length: MAX_FIGHTERS }, (_, i) => normalizeName(Array.isArray(value.names) ? value.names[i] : '', i)),
    styles: Array.from({ length: MAX_FIGHTERS }, (_, i) => normalizeStyle(Array.isArray(value.styles) ? value.styles[i] : 'Random')) };
}
export function loadPreferences(storage) {
  try { return normalizePreferences(JSON.parse(storage.getItem(SETTINGS_KEY)) || {}); }
  catch { return normalizePreferences(); }
}
export function savePreferences(storage, value) {
  try { storage.setItem(SETTINGS_KEY, JSON.stringify(normalizePreferences(value))); return true; }
  catch { return false; }
}
export const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
