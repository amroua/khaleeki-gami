export type AppTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'khaleeki_app_theme';
export const NOTIFICATIONS_STORAGE_KEY = 'khaleeki_notifications_enabled';
export const THEME_CHANGED_EVENT = 'khaleeki_theme_changed';
export const NOTIFICATIONS_PREF_CHANGED_EVENT = 'khaleeki_notifications_pref_changed';

export function getSavedTheme(): AppTheme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to read theme from localStorage:', e);
  }
  return 'dark'; // Default theme is dark
}

export function setAppTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyThemeToDOM(theme);
    window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: theme }));
  } catch (e) {
    console.error('Failed to set theme in localStorage:', e);
  }
}

export function applyThemeToDOM(theme: AppTheme): void {
  const isLight = theme === 'light';
  if (isLight) {
    document.documentElement.classList.add('light-mode');
    document.body.classList.add('light-mode');
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.classList.remove('light-mode');
    document.body.classList.remove('light-mode');
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

export function initAppTheme(): AppTheme {
  const current = getSavedTheme();
  applyThemeToDOM(current);
  return current;
}

export function getSavedNotificationsEnabled(): boolean {
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
  } catch (e) {
    console.warn('Failed to read notifications preference:', e);
  }
  return true; // Default enabled
}

export function setSavedNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_PREF_CHANGED_EVENT, { detail: enabled }));
  } catch (e) {
    console.error('Failed to save notifications preference:', e);
  }
}
