import type { ExportConfig, HikeSource, PointOfInterest, Step } from './types'

export const SESSION_STORAGE_KEY = 'mapmaker.session.v1'
export const SESSION_SCHEMA_VERSION = 1

export interface PersistedSession {
  version: number
  hikeSource: HikeSource
  basemapId: string
  exportConfig: ExportConfig
  step: Step
  savedAt: number
  /** added after v1 shipped; absent on older saved sessions, normalized to [] */
  pois: PointOfInterest[]
}

/** Loads and structurally validates a saved session. Never throws — any
 * parse failure, shape mismatch, or version mismatch returns null so an
 * old/corrupt saved session can never crash the app on startup. */
export function loadSavedSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isValidSession(parsed)) return null
    // pois was added after v1 shipped: normalize a session saved before that
    // to an empty array instead of rejecting it outright.
    if (!Array.isArray(parsed.pois)) parsed.pois = []
    return parsed
  } catch {
    return null
  }
}

function isValidSession(value: unknown): value is PersistedSession {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (v.version !== SESSION_SCHEMA_VERSION) return false
  if (!v.hikeSource || typeof v.hikeSource !== 'object') return false
  const hikeSource = v.hikeSource as Record<string, unknown>
  if (!Array.isArray(hikeSource.tracks) || !Array.isArray(hikeSource.extraSplits)) return false
  if (typeof v.basemapId !== 'string') return false
  if (!v.exportConfig || typeof v.exportConfig !== 'object') return false
  if (typeof v.step !== 'string') return false
  return true
}

/** Best-effort: swallows QuotaExceededError and any other storage failure —
 * autosave must never break the primary editing flow. */
export function saveSession(session: {
  hikeSource: HikeSource
  basemapId: string
  exportConfig: ExportConfig
  step: Step
  pois: PointOfInterest[]
}): void {
  const payload: PersistedSession = { ...session, version: SESSION_SCHEMA_VERSION, savedAt: Date.now() }
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // storage full/unavailable: not fatal, session just won't be restorable
  }
}

export function clearSavedSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // ignore
  }
}
