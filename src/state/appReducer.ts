import type { AppState, ExportConfig, HikeSource, PointOfInterest, Step } from './types'
import { deriveHike } from '../gpx/baseEtapes'

export const defaultExportConfig: ExportConfig = {
  paperSize: 'A4',
  orientation: 'landscape',
  niveauMeters: 50,
  segmentsTarget: 12,
  overlapPercent: 0.12,
  scope: 'wholeRoute',
  rectoVerso: false,
  foldable: false,
  dpi: 300,
  orientationMode: 'followRoute',
}

export const initialState: AppState = {
  step: 'upload',
  hikeSource: null,
  hike: null,
  basemapId: 'ign-plan-v2',
  exportConfig: defaultExportConfig,
  pois: [],
}

export type AppAction =
  | { type: 'LOAD_HIKE_SOURCE'; hikeSource: HikeSource }
  | { type: 'RENAME_BASE_ETAPE'; trackId: string; name: string }
  | { type: 'REORDER_BASE_ETAPES'; trackIds: string[] }
  | { type: 'ADD_SPLIT'; distance: number }
  | { type: 'REMOVE_SPLIT'; distance: number }
  | { type: 'RESET_SPLITS' }
  | {
      type: 'RESTORE_SESSION'
      hikeSource: HikeSource
      basemapId: string
      exportConfig: ExportConfig
      step: Step
      pois: PointOfInterest[]
    }
  | { type: 'SET_BASEMAP'; basemapId: string }
  | { type: 'SET_EXPORT_CONFIG'; patch: Partial<ExportConfig> }
  | { type: 'SET_STEP'; step: Step }
  | { type: 'ADD_POI'; poi: PointOfInterest }
  | { type: 'MOVE_POI'; id: string; lon: number; lat: number }
  | { type: 'DELETE_POI'; id: string }
  | { type: 'RENAME_POI'; id: string; label: string }
  | { type: 'RESET' }

function withDerivedHike(hikeSource: HikeSource): { hikeSource: HikeSource; hike: ReturnType<typeof deriveHike> } {
  return { hikeSource, hike: deriveHike(hikeSource.tracks, hikeSource.extraSplits) }
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_HIKE_SOURCE':
      // a newly imported track makes any previous POIs geographically stale
      return { ...state, ...withDerivedHike(action.hikeSource), step: 'editor', pois: [] }

    case 'RENAME_BASE_ETAPE': {
      if (!state.hikeSource) return state
      const tracks = state.hikeSource.tracks.map((t) =>
        t.id === action.trackId ? { ...t, name: action.name } : t,
      )
      return { ...state, ...withDerivedHike({ ...state.hikeSource, tracks }) }
    }

    case 'REORDER_BASE_ETAPES': {
      if (!state.hikeSource || state.hikeSource.mode !== 'multi') return state
      const byId = new Map(state.hikeSource.tracks.map((t) => [t.id, t]))
      const reordered = action.trackIds.map((id) => byId.get(id)).filter((t) => t !== undefined)
      if (reordered.length !== state.hikeSource.tracks.length) return state
      return { ...state, ...withDerivedHike({ ...state.hikeSource, tracks: reordered }) }
    }

    case 'ADD_SPLIT': {
      if (!state.hikeSource || !state.hike) return state
      // The click gives an absolute route distance; store it as an offset
      // from the containing base étape's own start so it stays attached to
      // that track (and the right spot on it) even if tracks get reordered.
      const containing = state.hike.baseEtapes.find(
        (b) => action.distance >= b.startDistance && action.distance <= b.endDistance,
      )
      if (!containing) return state
      const extraSplits = [
        ...state.hikeSource.extraSplits,
        { trackId: containing.id, offset: action.distance - containing.startDistance },
      ]
      return { ...state, ...withDerivedHike({ ...state.hikeSource, extraSplits }) }
    }

    case 'REMOVE_SPLIT': {
      if (!state.hikeSource || !state.hike) return state
      const TOLERANCE_METERS = 30
      const baseById = new Map(state.hike.baseEtapes.map((b) => [b.id, b]))
      const extraSplits = state.hikeSource.extraSplits.filter((s) => {
        const base = baseById.get(s.trackId)
        const absolute = (base?.startDistance ?? 0) + s.offset
        return Math.abs(absolute - action.distance) > TOLERANCE_METERS
      })
      if (extraSplits.length === state.hikeSource.extraSplits.length) return state // not a manual split: ignore
      return { ...state, ...withDerivedHike({ ...state.hikeSource, extraSplits }) }
    }

    case 'RESET_SPLITS': {
      if (!state.hikeSource) return state
      return { ...state, ...withDerivedHike({ ...state.hikeSource, extraSplits: [] }) }
    }

    case 'RESTORE_SESSION':
      return {
        ...state,
        ...withDerivedHike(action.hikeSource),
        basemapId: action.basemapId,
        exportConfig: action.exportConfig,
        step: action.step,
        pois: action.pois,
      }

    case 'SET_BASEMAP':
      return { ...state, basemapId: action.basemapId }
    case 'SET_EXPORT_CONFIG':
      return {
        ...state,
        exportConfig: { ...state.exportConfig, ...action.patch },
      }
    case 'SET_STEP':
      return { ...state, step: action.step }

    case 'ADD_POI':
      return { ...state, pois: [...state.pois, action.poi] }
    case 'MOVE_POI':
      return {
        ...state,
        pois: state.pois.map((p) => (p.id === action.id ? { ...p, lon: action.lon, lat: action.lat } : p)),
      }
    case 'DELETE_POI':
      return { ...state, pois: state.pois.filter((p) => p.id !== action.id) }
    case 'RENAME_POI':
      return {
        ...state,
        pois: state.pois.map((p) => (p.id === action.id ? { ...p, label: action.label } : p)),
      }

    case 'RESET':
      return initialState
    default:
      return state
  }
}
