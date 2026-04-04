const LEVEL = 'lexicore_pref_level';
const DAILY = 'lexicore_pref_daily_goal';
const BIO = 'lexicore_pref_bio';

export function getPrefLevel(): string {
  if (typeof window === 'undefined') return 'B1';
  return localStorage.getItem(LEVEL) || 'B1';
}

export function setPrefLevel(level: string): void {
  localStorage.setItem(LEVEL, level);
  window.dispatchEvent(new CustomEvent('lexicore-prefs-changed'));
}

export function getDailyGoal(): string {
  if (typeof window === 'undefined') return '10';
  return localStorage.getItem(DAILY) || '10';
}

export function setDailyGoal(n: string): void {
  localStorage.setItem(DAILY, n);
  window.dispatchEvent(new CustomEvent('lexicore-prefs-changed'));
}

export function getBio(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(BIO) || '';
}

export function setBio(text: string): void {
  localStorage.setItem(BIO, text);
}
