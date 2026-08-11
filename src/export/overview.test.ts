import { describe, expect, it } from 'vitest'
import { computeOverviewPages } from './overview'
import { deriveHike } from '../gpx/baseEtapes'
import type { SourceTrack } from '../state/types'

function track(id: string, points: { lon: number; lat: number }[]): SourceTrack {
  return { id, name: id, points }
}

describe('computeOverviewPages', () => {
  it('fits a short hike on a single page', () => {
    const hike = deriveHike(
      [
        track('t1', [
          { lon: 5.72, lat: 45.18 },
          { lon: 5.745, lat: 45.19 },
          { lon: 5.79, lat: 45.215 },
        ]),
      ],
      [],
    )
    const result = computeOverviewPages(hike, {
      paperSize: 'A4',
      orientation: 'landscape',
      dpi: 150,
      orientationMode: 'followRoute',
    })
    expect(result.mode).toBe('single')
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0].rotation).toBe(0)
  })

  it('falls back to multiple pages for a very long hike', () => {
    const points = []
    for (let i = 0; i <= 20; i++) points.push({ lon: 5.7 + i * 0.02, lat: 45 + i * 0.05 })
    const hike = deriveHike([track('t1', points)], [])

    const result = computeOverviewPages(hike, {
      paperSize: 'A4',
      orientation: 'landscape',
      dpi: 150,
      orientationMode: 'followRoute',
    })
    expect(result.mode).toBe('multi')
    expect(result.pages.length).toBeGreaterThan(1)
  })
})
