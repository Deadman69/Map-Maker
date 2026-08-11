import { describe, expect, it } from 'vitest'
import { appReducer, initialState } from './appReducer'
import type { HikeSource } from './types'

function multiHikeSource(): HikeSource {
  return {
    mode: 'multi',
    tracks: [
      { id: 't1', name: 'Jour 1', points: [{ lon: 6.0, lat: 45.1 }, { lon: 6.01, lat: 45.11 }, { lon: 6.02, lat: 45.12 }] },
      { id: 't2', name: 'Jour 2', points: [{ lon: 6.02, lat: 45.12 }, { lon: 6.03, lat: 45.13 }, { lon: 6.04, lat: 45.14 }] },
    ],
    extraSplits: [],
  }
}

function singleHikeSource(): HikeSource {
  return {
    mode: 'single',
    tracks: [{ id: 't1', name: 'Étape 1', points: [{ lon: 6.0, lat: 45.1 }, { lon: 6.04, lat: 45.14 }] }],
    extraSplits: [],
  }
}

describe('LOAD_HIKE_SOURCE', () => {
  it('derives hike and moves to the editor step', () => {
    const state = appReducer(initialState, { type: 'LOAD_HIKE_SOURCE', hikeSource: multiHikeSource() })
    expect(state.step).toBe('editor')
    expect(state.hike?.baseEtapes).toHaveLength(2)
  })
})

describe('RENAME_BASE_ETAPE', () => {
  it('renames only the targeted track', () => {
    let state = appReducer(initialState, { type: 'LOAD_HIKE_SOURCE', hikeSource: multiHikeSource() })
    state = appReducer(state, { type: 'RENAME_BASE_ETAPE', trackId: 't2', name: 'Refuge' })
    expect(state.hike?.baseEtapes.map((b) => b.name)).toEqual(['Jour 1', 'Refuge'])
  })
})

describe('REORDER_BASE_ETAPES', () => {
  it('reorders tracks and re-derives distances', () => {
    let state = appReducer(initialState, { type: 'LOAD_HIKE_SOURCE', hikeSource: multiHikeSource() })
    state = appReducer(state, { type: 'REORDER_BASE_ETAPES', trackIds: ['t2', 't1'] })
    expect(state.hike?.baseEtapes.map((b) => b.id)).toEqual(['t2', 't1'])
  })

  it('no-ops in single mode', () => {
    let state = appReducer(initialState, { type: 'LOAD_HIKE_SOURCE', hikeSource: singleHikeSource() })
    const before = state.hike
    state = appReducer(state, { type: 'REORDER_BASE_ETAPES', trackIds: ['t1'] })
    expect(state.hike).toBe(before)
  })

  it('no-ops if the given track id list does not match the current tracks', () => {
    let state = appReducer(initialState, { type: 'LOAD_HIKE_SOURCE', hikeSource: multiHikeSource() })
    const before = state.hike
    state = appReducer(state, { type: 'REORDER_BASE_ETAPES', trackIds: ['t2', 'unknown'] })
    expect(state.hike).toBe(before)
  })
})

describe('ADD_SPLIT / REMOVE_SPLIT / RESET_SPLITS', () => {
  it('adds a split that subdivides the containing base étape', () => {
    let state = appReducer(initialState, { type: 'LOAD_HIKE_SOURCE', hikeSource: multiHikeSource() })
    const mid = (state.hike!.baseEtapes[0].startDistance + state.hike!.baseEtapes[0].endDistance) / 2
    state = appReducer(state, { type: 'ADD_SPLIT', distance: mid })
    expect(state.hike?.etapes.map((e) => e.name)).toEqual(['Jour 1 (a)', 'Jour 1 (b)', 'Jour 2'])
    expect(state.hikeSource?.extraSplits).toHaveLength(1)
  })

  it('removes a split near the clicked distance', () => {
    let state = appReducer(initialState, { type: 'LOAD_HIKE_SOURCE', hikeSource: multiHikeSource() })
    const mid = (state.hike!.baseEtapes[0].startDistance + state.hike!.baseEtapes[0].endDistance) / 2
    state = appReducer(state, { type: 'ADD_SPLIT', distance: mid })
    state = appReducer(state, { type: 'REMOVE_SPLIT', distance: mid })
    expect(state.hike?.etapes.map((e) => e.name)).toEqual(['Jour 1', 'Jour 2'])
    expect(state.hikeSource?.extraSplits).toHaveLength(0)
  })

  it('ignores a REMOVE_SPLIT far from any existing split', () => {
    let state = appReducer(initialState, { type: 'LOAD_HIKE_SOURCE', hikeSource: multiHikeSource() })
    const mid = (state.hike!.baseEtapes[0].startDistance + state.hike!.baseEtapes[0].endDistance) / 2
    state = appReducer(state, { type: 'ADD_SPLIT', distance: mid })
    const before = state.hikeSource
    state = appReducer(state, { type: 'REMOVE_SPLIT', distance: mid + 10_000 })
    expect(state.hikeSource).toBe(before)
  })

  it('a split survives reordering, staying attached to its own track (regression)', () => {
    let state = appReducer(initialState, { type: 'LOAD_HIKE_SOURCE', hikeSource: multiHikeSource() })
    const mid = (state.hike!.baseEtapes[0].startDistance + state.hike!.baseEtapes[0].endDistance) / 2
    state = appReducer(state, { type: 'ADD_SPLIT', distance: mid }) // splits Jour 1
    state = appReducer(state, { type: 'REORDER_BASE_ETAPES', trackIds: ['t2', 't1'] })
    expect(state.hike?.etapes.map((e) => e.name)).toEqual(['Jour 2', 'Jour 1 (a)', 'Jour 1 (b)'])
  })

  it('RESET_SPLITS clears extraSplits and restores base étape names/order exactly', () => {
    let state = appReducer(initialState, { type: 'LOAD_HIKE_SOURCE', hikeSource: multiHikeSource() })
    const mid = (state.hike!.baseEtapes[0].startDistance + state.hike!.baseEtapes[0].endDistance) / 2
    state = appReducer(state, { type: 'ADD_SPLIT', distance: mid })
    state = appReducer(state, { type: 'RESET_SPLITS' })
    expect(state.hike?.etapes).toEqual(state.hike?.baseEtapes)
    expect(state.hikeSource?.extraSplits).toEqual([])
  })
})

describe('POI actions', () => {
  function poiState() {
    return appReducer(initialState, { type: 'LOAD_HIKE_SOURCE', hikeSource: multiHikeSource() })
  }

  it('ADD_POI appends a point of interest', () => {
    const state = appReducer(poiState(), {
      type: 'ADD_POI',
      poi: { id: 'p1', type: 'waterPoint', lon: 6.01, lat: 45.11 },
    })
    expect(state.pois).toHaveLength(1)
    expect(state.pois[0]).toMatchObject({ id: 'p1', type: 'waterPoint' })
  })

  it('MOVE_POI updates only the targeted point', () => {
    let state = appReducer(poiState(), {
      type: 'ADD_POI',
      poi: { id: 'p1', type: 'shelter', lon: 6.01, lat: 45.11 },
    })
    state = appReducer(state, { type: 'MOVE_POI', id: 'p1', lon: 6.02, lat: 45.12 })
    expect(state.pois[0]).toMatchObject({ lon: 6.02, lat: 45.12 })
  })

  it('RENAME_POI sets the label', () => {
    let state = appReducer(poiState(), {
      type: 'ADD_POI',
      poi: { id: 'p1', type: 'namedPoint', lon: 6.01, lat: 45.11 },
    })
    state = appReducer(state, { type: 'RENAME_POI', id: 'p1', label: 'Source' })
    expect(state.pois[0].label).toBe('Source')
  })

  it('DELETE_POI removes the targeted point', () => {
    let state = appReducer(poiState(), {
      type: 'ADD_POI',
      poi: { id: 'p1', type: 'danger', lon: 6.01, lat: 45.11 },
    })
    state = appReducer(state, { type: 'DELETE_POI', id: 'p1' })
    expect(state.pois).toHaveLength(0)
  })

  it('LOAD_HIKE_SOURCE clears previously placed pois (stale after a new import)', () => {
    let state = appReducer(poiState(), {
      type: 'ADD_POI',
      poi: { id: 'p1', type: 'viewpoint', lon: 6.01, lat: 45.11 },
    })
    state = appReducer(state, { type: 'LOAD_HIKE_SOURCE', hikeSource: singleHikeSource() })
    expect(state.pois).toEqual([])
  })
})

describe('RESET', () => {
  it('returns to initialState', () => {
    let state = appReducer(initialState, { type: 'LOAD_HIKE_SOURCE', hikeSource: multiHikeSource() })
    state = appReducer(state, { type: 'RESET' })
    expect(state).toEqual(initialState)
  })
})
