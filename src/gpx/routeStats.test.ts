import { describe, expect, it } from 'vitest'
import {
  boundingBox,
  computeCumulativeDistances,
  computeCumulativeDistancesWithBreaks,
  haversineDistance,
  indexAtDistance,
  meanLatitude,
  pointAtDistance,
  totalDistance,
} from './routeStats'

describe('haversineDistance', () => {
  it('returns ~0 for identical points', () => {
    expect(haversineDistance({ lon: 5.7, lat: 45.2 }, { lon: 5.7, lat: 45.2 })).toBeCloseTo(0, 3)
  })

  it('matches the well-known ~111.2km per degree of latitude', () => {
    const d = haversineDistance({ lon: 0, lat: 0 }, { lon: 0, lat: 1 })
    expect(d).toBeGreaterThan(111000)
    expect(d).toBeLessThan(111500)
  })
})

describe('computeCumulativeDistances', () => {
  it('is monotonically non-decreasing and starts at 0', () => {
    const points = [
      { lon: 0, lat: 0 },
      { lon: 0.001, lat: 0.001 },
      { lon: 0.002, lat: 0.0005 },
    ]
    const d = computeCumulativeDistances(points)
    expect(d[0]).toBe(0)
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeGreaterThanOrEqual(d[i - 1])
  })
})

describe('computeCumulativeDistancesWithBreaks', () => {
  it('contributes zero distance across a break index', () => {
    const points = [
      { lon: 0, lat: 0 },
      { lon: 0.001, lat: 0 },
      // large geographic jump — but index 2 is a break, so it must not count
      { lon: 10, lat: 10 },
      { lon: 10.001, lat: 10 },
    ]
    const withBreak = computeCumulativeDistancesWithBreaks(points, new Set([2]))
    const withoutBreak = computeCumulativeDistances(points)
    // same up to (and including) the point right before the break
    expect(withBreak[1]).toBeCloseTo(withoutBreak[1], 3)
    // the break contributes 0, so distance doesn't jump at index 2
    expect(withBreak[2]).toBeCloseTo(withBreak[1], 3)
    // without the break, the same step is a huge real jump
    expect(withoutBreak[2]).toBeGreaterThan(1_000_000)
  })
})

describe('totalDistance', () => {
  it('returns 0 for fewer than 2 points', () => {
    expect(totalDistance([{ lon: 0, lat: 0 }])).toBe(0)
    expect(totalDistance([])).toBe(0)
  })
})

describe('meanLatitude', () => {
  it('averages latitudes', () => {
    expect(meanLatitude([{ lon: 0, lat: 10 }, { lon: 0, lat: 20 }])).toBeCloseTo(15)
  })
})

describe('boundingBox', () => {
  it('finds min/max lon/lat', () => {
    const bbox = boundingBox([
      { lon: 5, lat: 45 },
      { lon: 6, lat: 44 },
      { lon: 4, lat: 46 },
    ])
    expect(bbox).toEqual({ minLon: 4, minLat: 44, maxLon: 6, maxLat: 46 })
  })
})

describe('indexAtDistance', () => {
  it('finds the first index whose cumulative distance is >= target', () => {
    const cumDist = [0, 10, 20, 30, 40]
    expect(indexAtDistance(cumDist, 0)).toBe(0)
    expect(indexAtDistance(cumDist, 15)).toBe(2)
    expect(indexAtDistance(cumDist, 20)).toBe(2)
    expect(indexAtDistance(cumDist, 40)).toBe(4)
  })
})

describe('pointAtDistance', () => {
  it('interpolates linearly between the two bracketing points', () => {
    const points = [
      { lon: 0, lat: 0 },
      { lon: 10, lat: 0 },
    ]
    const cumDist = [0, 100]
    const p = pointAtDistance(points, cumDist, 50)
    expect(p.lon).toBeCloseTo(5, 5)
    expect(p.lat).toBeCloseTo(0, 5)
  })

  it('clamps to the route bounds', () => {
    const points = [
      { lon: 0, lat: 0 },
      { lon: 10, lat: 0 },
    ]
    const cumDist = [0, 100]
    expect(pointAtDistance(points, cumDist, -50)).toEqual(points[0])
    expect(pointAtDistance(points, cumDist, 500)).toEqual(points[1])
  })
})
