import type { Etape, Hike, TrackPoint } from '../state/types'
import { indexAtDistance } from './routeStats'

export interface ElevationStats {
  gain: number
  loss: number
  /** false when no point in the input has `ele` — distinguishes "no data"
   * from a genuinely flat route (gain=loss=0). */
  hasElevation: boolean
}

const SMOOTHING_WINDOW = 5
const MIN_STEP_DELTA_METERS = 3

/**
 * Centered moving average over `ele` (window shrinks at the two ends rather
 * than padding with fake data). Missing `ele` values carry the last known
 * value forward — real GPX exports rarely have holes, but this stays
 * defensive rather than treating a gap as elevation 0.
 */
export function smoothElevations(points: TrackPoint[]): number[] {
  const raw = new Array<number>(points.length)
  let last = 0
  for (let i = 0; i < points.length; i++) {
    if (typeof points[i].ele === 'number') last = points[i].ele as number
    raw[i] = last
  }

  const halfWindow = Math.floor(SMOOTHING_WINDOW / 2)
  const smoothed = new Array<number>(raw.length)
  for (let i = 0; i < raw.length; i++) {
    const lo = Math.max(0, i - halfWindow)
    const hi = Math.min(raw.length - 1, i + halfWindow)
    let sum = 0
    for (let j = lo; j <= hi; j++) sum += raw[j]
    smoothed[i] = sum / (hi - lo + 1)
  }
  return smoothed
}

/**
 * Smoothing alone doesn't remove correlated noise (a multi-sample GPS dip),
 * and thresholding alone on raw noisy data still overcounts (one noisy jump
 * can exceed the threshold outright). Smoothing *then* accumulating each
 * same-direction run and only counting it if it clears MIN_STEP_DELTA_METERS
 * catches both. This intentionally *under*-counts D+/D- on terrain with many
 * genuine sub-3m ups/downs (staircases, boulder fields) — a deliberate bias
 * toward not overestimating, at the cost of some precision on rough terrain.
 */
export function computeElevationGainLoss(points: TrackPoint[]): ElevationStats {
  const hasElevation = points.some((p) => typeof p.ele === 'number')
  if (!hasElevation || points.length < 2) return { gain: 0, loss: 0, hasElevation }

  const smoothed = smoothElevations(points)
  let gain = 0
  let loss = 0
  let runSign = 0
  let runStart = smoothed[0]

  function flush(runEnd: number) {
    const run = runEnd - runStart
    if (Math.abs(run) < MIN_STEP_DELTA_METERS) return
    if (run > 0) gain += run
    else loss += -run
  }

  for (let i = 1; i < smoothed.length; i++) {
    const delta = smoothed[i] - smoothed[i - 1]
    const sign = delta > 0 ? 1 : delta < 0 ? -1 : 0
    if (sign === 0) continue
    if (runSign === 0) {
      runSign = sign
      runStart = smoothed[i - 1]
    } else if (sign !== runSign) {
      flush(smoothed[i - 1])
      runSign = sign
      runStart = smoothed[i - 1]
    }
  }
  if (runSign !== 0) flush(smoothed[smoothed.length - 1])

  return { gain, loss, hasElevation }
}

/**
 * Per-étape D+/D-. Note: summing these across all étapes will not exactly
 * equal computeElevationGainLoss(hike.points) run once over the whole
 * route — the threshold-accumulation resets at each slice boundary, a
 * small, unavoidable, accepted edge effect of slicing. The whole-hike
 * figure should always be computed in one continuous pass, not by summing.
 */
export function computeEtapeElevation(hike: Hike, etape: Etape): ElevationStats {
  const startIdx = indexAtDistance(hike.cumulativeDistances, etape.startDistance)
  const endIdx = indexAtDistance(hike.cumulativeDistances, etape.endDistance)
  return computeElevationGainLoss(hike.points.slice(startIdx, endIdx + 1))
}
