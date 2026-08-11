import { describe, expect, it } from 'vitest'
import { detectLanguage } from './detectLanguage'

describe('detectLanguage', () => {
  it('detects French from any fr-* locale, case-insensitively', () => {
    expect(detectLanguage('fr-FR')).toBe('fr')
    expect(detectLanguage('fr')).toBe('fr')
    expect(detectLanguage('FR-BE')).toBe('fr')
  })

  it('falls back to English for anything else, including undefined (only fr/en are supported)', () => {
    expect(detectLanguage('en-US')).toBe('en')
    expect(detectLanguage('de-DE')).toBe('en')
    expect(detectLanguage(undefined)).toBe('en')
  })
})
