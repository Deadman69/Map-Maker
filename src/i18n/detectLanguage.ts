import type { Lang } from './types'

/** Only fr/en are supported, so anything that isn't French falls back to
 * English rather than guessing at a third option. */
export function detectLanguage(navigatorLanguage: string | undefined): Lang {
  return navigatorLanguage?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}
