import { useEffect } from 'react'
import type { AppState } from './types'
import { saveSession } from './persistence'

const DEBOUNCE_MS = 600

/** Debounced autosave of the current session to localStorage. No-ops while
 * there's no hike loaded yet — nothing worth persisting before that. */
export function usePersistSession(state: AppState): void {
  const { hikeSource, basemapId, exportConfig, step, pois } = state

  useEffect(() => {
    if (!hikeSource) return
    const timer = setTimeout(() => {
      saveSession({ hikeSource, basemapId, exportConfig, step, pois })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [hikeSource, basemapId, exportConfig, step, pois])
}
