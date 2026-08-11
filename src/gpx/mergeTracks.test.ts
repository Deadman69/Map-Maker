import { describe, expect, it } from 'vitest'
import { mergeTracks } from './mergeTracks'

describe('mergeTracks', () => {
  it('concatenates tracks in order and records each start index', () => {
    const result = mergeTracks([
      { name: 'Jour 1', points: [{ lon: 0, lat: 0 }, { lon: 1, lat: 0 }] },
      { name: 'Jour 2', points: [{ lon: 1, lat: 0 }, { lon: 2, lat: 0 }, { lon: 3, lat: 0 }] },
    ])

    expect(result.points).toHaveLength(5)
    expect(result.boundaries).toEqual([
      { name: 'Jour 1', startIndex: 0 },
      { name: 'Jour 2', startIndex: 2 },
    ])
  })

  it('handles a single track', () => {
    const result = mergeTracks([{ name: 'Solo', points: [{ lon: 0, lat: 0 }] }])
    expect(result.boundaries).toEqual([{ name: 'Solo', startIndex: 0 }])
  })

  it('handles an empty list', () => {
    const result = mergeTracks([])
    expect(result.points).toEqual([])
    expect(result.boundaries).toEqual([])
  })
})
