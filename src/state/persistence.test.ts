import { beforeEach, describe, expect, it } from 'vitest'
import { clearSavedSession, loadSavedSession, saveSession, SESSION_STORAGE_KEY } from './persistence'
import type { ExportConfig, HikeSource } from './types'
import { defaultExportConfig } from './appReducer'

// Node's test environment has no localStorage — a minimal in-memory stub is
// enough since persistence.ts only ever calls getItem/setItem/removeItem.
class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
}

beforeEach(() => {
  ;(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage()
})

const hikeSource: HikeSource = {
  mode: 'single',
  tracks: [{ id: 't1', name: 'Étape 1', points: [{ lon: 0, lat: 0 }] }],
  extraSplits: [],
}

function session(config: ExportConfig = defaultExportConfig) {
  return { hikeSource, basemapId: 'ign-plan-v2', exportConfig: config, step: 'editor' as const, pois: [] }
}

describe('saveSession / loadSavedSession', () => {
  it('round-trips a session through localStorage', () => {
    saveSession(session())
    const loaded = loadSavedSession()
    expect(loaded?.hikeSource).toEqual(hikeSource)
    expect(loaded?.basemapId).toBe('ign-plan-v2')
    expect(loaded?.step).toBe('editor')
    expect(typeof loaded?.savedAt).toBe('number')
  })

  it('returns null when nothing is saved', () => {
    expect(loadSavedSession()).toBeNull()
  })

  it('normalizes a pre-POI session (no pois field) to an empty array instead of rejecting it', () => {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        hikeSource,
        basemapId: 'ign-plan-v2',
        exportConfig: defaultExportConfig,
        step: 'editor',
        savedAt: 0,
      }),
    )
    expect(loadSavedSession()?.pois).toEqual([])
  })

  it('returns null (not a throw) on corrupt JSON', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, '{not valid json')
    expect(loadSavedSession()).toBeNull()
  })

  it('returns null on a version mismatch', () => {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ version: 999, hikeSource, basemapId: 'x', exportConfig: defaultExportConfig, step: 'editor', savedAt: 0 }),
    )
    expect(loadSavedSession()).toBeNull()
  })

  it('returns null on a structurally invalid payload', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ version: 1, hikeSource: { tracks: 'not-an-array' } }))
    expect(loadSavedSession()).toBeNull()
  })
})

describe('clearSavedSession', () => {
  it('removes the saved session', () => {
    saveSession(session())
    clearSavedSession()
    expect(loadSavedSession()).toBeNull()
  })
})
