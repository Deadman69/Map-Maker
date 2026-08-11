import { describe, expect, it } from 'vitest'
import { computeBaseEtapes, deriveHike, subdivideAtExtraSplits } from './baseEtapes'
import type { SourceTrack } from '../state/types'

function track(id: string, name: string, points: { lon: number; lat: number }[]): SourceTrack {
  return { id, name, points }
}

const day1 = track('t1', 'Jour 1', [
  { lon: 6.0, lat: 45.1 },
  { lon: 6.01, lat: 45.11 },
  { lon: 6.02, lat: 45.12 },
])
const day2 = track('t2', 'Jour 2', [
  { lon: 6.02, lat: 45.12 }, // geographically contiguous with day1's end
  { lon: 6.03, lat: 45.13 },
  { lon: 6.04, lat: 45.14 },
])

describe('computeBaseEtapes', () => {
  it('produces one étape per track, named and id-matched to the source track', () => {
    const { baseEtapes } = computeBaseEtapes([day1, day2])
    expect(baseEtapes).toHaveLength(2)
    expect(baseEtapes[0]).toMatchObject({ id: 't1', name: 'Jour 1', startDistance: 0 })
    expect(baseEtapes[1].id).toBe('t2')
    expect(baseEtapes[1].startDistance).toBeCloseTo(baseEtapes[0].endDistance, 3)
  })

  it('does not attribute the geographic gap between reordered, non-contiguous tracks to either track (regression)', () => {
    // day2 is now first, day1 second — they are NOT geographically contiguous
    // in this order (day2 ends far from day1's start), which used to inflate
    // whichever track came first with the teleport distance between them.
    const { baseEtapes: originalOrder } = computeBaseEtapes([day1, day2])
    const { baseEtapes: reordered } = computeBaseEtapes([day2, day1])

    const day1LengthOriginal = originalOrder[0].endDistance - originalOrder[0].startDistance
    const day1LengthReordered = reordered[1].endDistance - reordered[1].startDistance
    expect(day1LengthReordered).toBeCloseTo(day1LengthOriginal, 1)

    const day2LengthOriginal = originalOrder[1].endDistance - originalOrder[1].startDistance
    const day2LengthReordered = reordered[0].endDistance - reordered[0].startDistance
    expect(day2LengthReordered).toBeCloseTo(day2LengthOriginal, 1)
  })
})

describe('subdivideAtExtraSplits', () => {
  it('returns base étapes completely unchanged when there are no splits', () => {
    const { baseEtapes } = computeBaseEtapes([day1, day2])
    const result = subdivideAtExtraSplits(baseEtapes, [])
    expect(result).toEqual(baseEtapes)
  })

  it('subdivides only the targeted track, naming parts (a)/(b), leaving the other untouched', () => {
    const { baseEtapes } = computeBaseEtapes([day1, day2])
    const mid = baseEtapes[0].endDistance / 2
    const result = subdivideAtExtraSplits(baseEtapes, [
      { trackId: 't1', offset: mid },
    ])
    const names = result.map((e) => e.name)
    expect(names).toEqual(['Jour 1 (a)', 'Jour 1 (b)', 'Jour 2'])
  })

  it('ignores a split too close to a boundary (min separation)', () => {
    const { baseEtapes } = computeBaseEtapes([day1, day2])
    const result = subdivideAtExtraSplits(baseEtapes, [{ trackId: 't1', offset: 0.001 }])
    expect(result.map((e) => e.name)).toEqual(['Jour 1', 'Jour 2'])
  })
})

describe('deriveHike', () => {
  it('combines computeBaseEtapes and subdivideAtExtraSplits into a full Hike', () => {
    const hike = deriveHike([day1, day2], [])
    expect(hike.baseEtapes).toHaveLength(2)
    expect(hike.etapes).toEqual(hike.baseEtapes)
    expect(hike.points.length).toBe(day1.points.length + day2.points.length)
  })
})
