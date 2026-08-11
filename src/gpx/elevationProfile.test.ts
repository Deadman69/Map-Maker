import { describe, expect, it } from 'vitest'
import { computeElevationProfileGeometry } from './elevationProfile'
import { deriveHike } from './baseEtapes'
import type { SourceTrack } from '../state/types'

function denseTrack(id: string, name: string, startEle: number): SourceTrack {
  const points = []
  for (let i = 0; i < 30; i++) {
    points.push({ lon: 6 + i * 0.001, lat: 45 + i * 0.001, ele: startEle + i * 5 })
  }
  return { id, name, points }
}

describe('computeElevationProfileGeometry', () => {
  it('reports hasElevation=false with empty data when there is no ele at all', () => {
    const hike = deriveHike(
      [{ id: 't1', name: 'Jour 1', points: [{ lon: 0, lat: 0 }, { lon: 1, lat: 1 }] }],
      [],
    )
    const geometry = computeElevationProfileGeometry(hike)
    expect(geometry.hasElevation).toBe(false)
    expect(geometry.points).toEqual([])
    expect(geometry.boundaries).toEqual([])
  })

  it('produces one boundary per inner étape, matching hike.etapes', () => {
    const hike = deriveHike([denseTrack('t1', 'Jour 1', 1000), denseTrack('t2', 'Jour 2', 1200)], [])
    const geometry = computeElevationProfileGeometry(hike)

    expect(geometry.hasElevation).toBe(true)
    const innerEtapes = hike.etapes.filter((e) => e.startDistance > 0)
    expect(geometry.boundaries).toHaveLength(innerEtapes.length)
    expect(geometry.boundaries[0].label).toBe(innerEtapes[0].name)
    expect(geometry.boundaries[0].distance).toBeCloseTo(innerEtapes[0].startDistance, 3)
  })

  it('caps the number of sampled points regardless of raw GPX density', () => {
    const points = []
    for (let i = 0; i < 2000; i++) points.push({ lon: 6 + i * 0.0001, lat: 45, ele: 1000 + i })
    const hike = deriveHike([{ id: 't1', name: 'Jour 1', points }], [])
    const geometry = computeElevationProfileGeometry(hike)
    expect(geometry.points.length).toBeLessThanOrEqual(400)
  })
})
