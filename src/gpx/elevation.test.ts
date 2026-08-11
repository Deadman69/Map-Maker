import { describe, expect, it } from 'vitest'
import { computeElevationGainLoss, computeEtapeElevation } from './elevation'
import { deriveHike } from './baseEtapes'
import type { SourceTrack } from '../state/types'

describe('computeElevationGainLoss', () => {
  it('reports hasElevation=false when no point has ele', () => {
    const stats = computeElevationGainLoss([{ lon: 0, lat: 0 }, { lon: 0, lat: 0 }])
    expect(stats).toEqual({ gain: 0, loss: 0, hasElevation: false })
  })

  it('filters out noise below the threshold', () => {
    const points = []
    for (let i = 0; i < 30; i++) points.push({ lon: 0, lat: 0, ele: 1000 + (i % 2 === 0 ? 2 : -2) })
    const stats = computeElevationGainLoss(points)
    expect(stats.hasElevation).toBe(true)
    expect(stats.gain).toBe(0)
    expect(stats.loss).toBe(0)
  })

  it('captures most of a real climb-then-descent on a dense, realistic profile', () => {
    const points = []
    for (let i = 0; i < 50; i++) points.push({ lon: 0, lat: 0, ele: 1000 + i * 8 + (i % 2 === 0 ? 2 : -2) })
    for (let i = 0; i < 50; i++) points.push({ lon: 0, lat: 0, ele: 1400 - i * 8 + (i % 2 === 0 ? 2 : -2) })
    const stats = computeElevationGainLoss(points)
    // true climb/descent is 400m each; the smoothing+threshold design
    // intentionally trends toward a slight underestimate, not an overestimate
    expect(stats.gain).toBeGreaterThan(350)
    expect(stats.gain).toBeLessThanOrEqual(400)
    expect(stats.loss).toBeGreaterThan(350)
    expect(stats.loss).toBeLessThanOrEqual(400)
  })
})

describe('computeEtapeElevation', () => {
  it('slices the hike to the étape range before computing stats', () => {
    const track: SourceTrack = {
      id: 't1',
      name: 'Jour 1',
      points: [
        { lon: 0, lat: 0, ele: 1000 },
        { lon: 0.001, lat: 0, ele: 1100 },
        { lon: 0.002, lat: 0, ele: 1000 },
      ],
    }
    const hike = deriveHike([track], [])
    const stats = computeEtapeElevation(hike, hike.etapes[0])
    expect(stats.hasElevation).toBe(true)
  })
})
