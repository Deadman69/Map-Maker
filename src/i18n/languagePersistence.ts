import type { Lang } from './types'

// Deliberately separate from the session storage key (mapmaker.session.v1):
// the language must be available before any hike exists and must survive
// RESET/clearSavedSession() — starting a new hike shouldn't reset language.
export const LANGUAGE_STORAGE_KEY = 'mapmaker.lang.v1'

export function loadSavedLanguage(): Lang | null {
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return raw === 'fr' || raw === 'en' ? raw : null
  } catch {
    return null
  }
}

export function saveLanguage(lang: Lang): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  } catch {
    // ignore: language just won't persist across reloads
  }
}
