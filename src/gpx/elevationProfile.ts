import type { Hike } from '../state/types'
import { computeElevationGainLoss, computeEtapeElevation, smoothElevations } from './elevation'
import { indexAtDistance } from './routeStats'

export interface ElevationProfilePoint {
  distance: number
  elevation: number
}

export interface ElevationProfileBoundary {
  distance: number
  label: string
  gain: number
  loss: number
}

export interface ElevationProfileGeometry {
  hasElevation: boolean
  points: ElevationProfilePoint[]
  boundaries: ElevationProfileBoundary[]
  minElevation: number
  maxElevation: number
  totalDistance: number
  totalGain: number
  totalLoss: number
}

const MAX_PROFILE_SAMPLES = 400

const EMPTY_GEOMETRY: ElevationProfileGeometry = {
  hasElevation: false,
  points: [],
  boundaries: [],
  minElevation: 0,
  maxElevation: 0,
  totalDistance: 0,
  totalGain: 0,
  totalLoss: 0,
}

/**
 * Resamples the route's (smoothed) elevation at evenly-spaced distances,
 * capped at MAX_PROFILE_SAMPLES — decouples chart complexity from raw GPX
 * point density (some devices log a point every second). Pure geometry data;
 * both the on-screen SVG and the PDF vector page render from this.
 */
export function computeElevationProfileGeometry(hike: Hike): ElevationProfileGeometry {
  const totalDistance = hike.cumulativeDistances[hike.cumulativeDistances.length - 1] ?? 0
  const whole = computeElevationGainLoss(hike.points)
  if (!whole.hasElevation || totalDistance <= 0) return EMPTY_GEOMETRY

  const smoothed = smoothElevations(hike.points)
  const sampleCount = Math.min(MAX_PROFILE_SAMPLES, hike.points.length)
  const points: ElevationProfilePoint[] = []
  let minElevation = Infinity
  let maxElevation = -Infinity

  for (let i = 0; i < sampleCount; i++) {
    const distance = (i / (sampleCount - 1)) * totalDistance
    const elevation = elevationAtDistance(hike.cumulativeDistances, smoothed, distance)
    points.push({ distance, elevation })
    if (elevation < minElevation) minElevation = elevation
    if (elevation > maxElevation) maxElevation = elevation
  }

  const boundaries: ElevationProfileBoundary[] = hike.etapes
    .filter((e) => e.startDistance > 0)
    .map((e) => {
      const stats = computeEtapeElevation(hike, e)
      return { distance: e.startDistance, label: e.name, gain: stats.gain, loss: stats.loss }
    })

  return {
    hasElevation: true,
    points,
    boundaries,
    minElevation,
    maxElevation,
    totalDistance,
    totalGain: whole.gain,
    totalLoss: whole.loss,
  }
}

function elevationAtDistance(
  cumulativeDistances: number[],
  smoothedElevations: number[],
  distance: number,
): number {
  const total = cumulativeDistances[cumulativeDistances.length - 1] ?? 0
  const d = Math.max(0, Math.min(distance, total))
  const idx = indexAtDistance(cumulativeDistances, d)
  if (idx === 0) return smoothedElevations[0]
  const prevIdx = idx - 1
  const segStart = cumulativeDistances[prevIdx]
  const segEnd = cumulativeDistances[idx]
  const t = segEnd > segStart ? (d - segStart) / (segEnd - segStart) : 0
  return smoothedElevations[prevIdx] + t * (smoothedElevations[idx] - smoothedElevations[prevIdx])
}
