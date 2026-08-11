import type { TrackPoint } from '../state/types'

const EARTH_RADIUS_M = 6371008.8

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance between two lon/lat points, in meters. */
export function haversineDistance(a: TrackPoint, b: TrackPoint): number {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** cumulativeDistances[i] = distance from points[0] to points[i], in meters. */
export function computeCumulativeDistances(points: TrackPoint[]): number[] {
  const distances = new Array<number>(points.length)
  distances[0] = 0
  for (let i = 1; i < points.length; i++) {
    distances[i] = distances[i - 1] + haversineDistance(points[i - 1], points[i])
  }
  return distances
}

/**
 * Like computeCumulativeDistances, but the step into any index listed in
 * `breakIndices` contributes zero distance instead of the real haversine
 * gap. Used when merging independently-recorded day tracks: reordering days
 * can make two tracks that used to be geographically contiguous (day N
 * ending where day N+1 starts) suddenly adjacent to unrelated tracks, and
 * without this the haversine "teleport" between them would get silently
 * added to the preceding day's reported length and thrown into pagination.
 */
export function computeCumulativeDistancesWithBreaks(
  points: TrackPoint[],
  breakIndices: ReadonlySet<number>,
): number[] {
  const distances = new Array<number>(points.length)
  distances[0] = 0
  for (let i = 1; i < points.length; i++) {
    const step = breakIndices.has(i) ? 0 : haversineDistance(points[i - 1], points[i])
    distances[i] = distances[i - 1] + step
  }
  return distances
}

export function totalDistance(points: TrackPoint[]): number {
  if (points.length < 2) return 0
  return computeCumulativeDistances(points)[points.length - 1]
}

/** Mean latitude in degrees, used for the Mercator scale-factor correction. */
export function meanLatitude(points: TrackPoint[]): number {
  if (points.length === 0) return 0
  let sum = 0
  for (const p of points) sum += p.lat
  return sum / points.length
}

export function boundingBox(points: TrackPoint[]): {
  minLon: number
  minLat: number
  maxLon: number
  maxLat: number
} {
  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity
  for (const p of points) {
    if (p.lon < minLon) minLon = p.lon
    if (p.lon > maxLon) maxLon = p.lon
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
  }
  return { minLon, minLat, maxLon, maxLat }
}

/**
 * Finds the point index whose cumulative distance is closest to `distance`.
 * cumulativeDistances must be sorted ascending (true by construction).
 */
export function indexAtDistance(cumulativeDistances: number[], distance: number): number {
  let lo = 0
  let hi = cumulativeDistances.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (cumulativeDistances[mid] < distance) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * Interpolates a lon/lat position at an arbitrary distance along the route.
 * Real GPX tracks are already densely sampled (points every few meters to a
 * few tens of meters), so linear interpolation between the two bracketing
 * vertices is precise enough for pagination — no separate fixed-step
 * resampling pass is needed.
 */
export function pointAtDistance(
  points: TrackPoint[],
  cumulativeDistances: number[],
  distance: number,
): TrackPoint {
  const total = cumulativeDistances[cumulativeDistances.length - 1] ?? 0
  const d = Math.max(0, Math.min(distance, total))
  const idx = indexAtDistance(cumulativeDistances, d)
  if (idx === 0) return points[0]
  const prevIdx = idx - 1
  const segStart = cumulativeDistances[prevIdx]
  const segEnd = cumulativeDistances[idx]
  const t = segEnd > segStart ? (d - segStart) / (segEnd - segStart) : 0
  const a = points[prevIdx]
  const b = points[idx]
  return { lon: a.lon + t * (b.lon - a.lon), lat: a.lat + t * (b.lat - a.lat) }
}
