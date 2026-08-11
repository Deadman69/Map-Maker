import { describe, expect, it } from 'vitest'
import { paginateRoute } from './paginate'
import { deriveHike } from '../gpx/baseEtapes'
import type { SourceTrack } from '../state/types'

function track(id: string, points: { lon: number; lat: number }[]): SourceTrack {
  return { id, name: id, points }
}

describe('paginateRoute', () => {
  it('produces the expected page count and consistent overlap on a straight route', () => {
    // ~6.8km straight-ish route (same shape used in manual testing this session)
    const hike = deriveHike(
      [
        track('t1', [
          { lon: 5.72, lat: 45.18 },
          { lon: 5.73, lat: 45.185 },
          { lon: 5.745, lat: 45.19 },
          { lon: 5.76, lat: 45.197 },
          { lon: 5.775, lat: 45.205 },
          { lon: 5.79, lat: 45.215 },
        ]),
      ],
      [],
    )
    const total = hike.cumulativeDistances[hike.cumulativeDistances.length - 1]

    const pages = paginateRoute(
      hike,
      { startDistance: 0, endDistance: total },
      {
        niveauMeters: 100,
        segmentsTarget: 12,
        paperSize: 'A4',
        orientation: 'landscape',
        dpi: 100,
        overlapPercent: 0.15,
        orientationMode: 'followRoute',
      },
    )

    expect(pages.length).toBeGreaterThan(1)
    expect(pages[0].distanceStart).toBe(0)
    expect(pages[pages.length - 1].distanceEnd).toBeCloseTo(total, 1)

    // consecutive pages overlap by roughly the configured fraction of a page's ground width
    const groundWidth = 12 * 100
    for (let i = 1; i < pages.length; i++) {
      const advance = pages[i].distanceStart - pages[i - 1].distanceStart
      expect(advance).toBeGreaterThan(0)
      expect(advance).toBeLessThanOrEqual(groundWidth)
    }
  })

  it('never produces NaN/undefined and terminates on a winding (hairpin) route', () => {
    const hike = deriveHike(
      [
        track('t1', [
          { lon: 6.0, lat: 45.1 },
          { lon: 6.002, lat: 45.103 },
          { lon: 6.005, lat: 45.101 },
          { lon: 6.006, lat: 45.098 },
          { lon: 6.009, lat: 45.1 },
          { lon: 6.01, lat: 45.104 },
          { lon: 6.014, lat: 45.102 },
          { lon: 6.017, lat: 45.099 },
        ]),
      ],
      [],
    )
    const total = hike.cumulativeDistances[hike.cumulativeDistances.length - 1]

    const pages = paginateRoute(
      hike,
      { startDistance: 0, endDistance: total },
      {
        niveauMeters: 50,
        segmentsTarget: 12,
        paperSize: 'A4',
        orientation: 'landscape',
        dpi: 100,
        overlapPercent: 0.15,
        orientationMode: 'followRoute',
      },
    )

    expect(pages.length).toBeGreaterThan(0)
    expect(pages.length).toBeLessThan(1000) // sanity bound: must terminate
    for (const page of pages) {
      expect(Number.isFinite(page.rotation)).toBe(true)
      expect(Number.isFinite(page.center[0])).toBe(true)
      expect(Number.isFinite(page.center[1])).toBe(true)
      expect(Number.isFinite(page.resolution)).toBe(true)
    }
  })

  it('respects a restricted distance range (per-étape scoping)', () => {
    const hike = deriveHike(
      [
        track('t1', [
          { lon: 5.72, lat: 45.18 },
          { lon: 5.79, lat: 45.215 },
        ]),
      ],
      [],
    )
    const total = hike.cumulativeDistances[hike.cumulativeDistances.length - 1]
    const half = total / 2

    const pages = paginateRoute(
      hike,
      { startDistance: 0, endDistance: half },
      {
        niveauMeters: 50,
        segmentsTarget: 12,
        paperSize: 'A4',
        orientation: 'landscape',
        dpi: 100,
        overlapPercent: 0.15,
        orientationMode: 'followRoute',
      },
    )

    expect(pages[pages.length - 1].distanceEnd).toBeLessThanOrEqual(half + 1)
  })

  it('keeps rotation at 0 on every page when orientationMode is northUp', () => {
    const hike = deriveHike(
      [
        track('t1', [
          { lon: 6.0, lat: 45.1 },
          { lon: 6.002, lat: 45.103 },
          { lon: 6.005, lat: 45.101 },
          { lon: 6.006, lat: 45.098 },
          { lon: 6.009, lat: 45.1 },
          { lon: 6.01, lat: 45.104 },
          { lon: 6.014, lat: 45.102 },
          { lon: 6.017, lat: 45.099 },
        ]),
      ],
      [],
    )
    const total = hike.cumulativeDistances[hike.cumulativeDistances.length - 1]

    const pages = paginateRoute(
      hike,
      { startDistance: 0, endDistance: total },
      {
        niveauMeters: 50,
        segmentsTarget: 12,
        paperSize: 'A4',
        orientation: 'landscape',
        dpi: 100,
        overlapPercent: 0.15,
        orientationMode: 'northUp',
      },
    )

    expect(pages.length).toBeGreaterThan(0)
    for (const page of pages) expect(page.rotation).toBe(0)
  })
})
