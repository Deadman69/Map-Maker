import type { Etape, ExtraSplit, Hike, SourceTrack, TrackPoint } from '../state/types'
import { mergeTracks } from './mergeTracks'
import { computeCumulativeDistancesWithBreaks } from './routeStats'

const MIN_SPLIT_SEPARATION_METERS = 5

let etapeIdCounter = 0
function nextEtapeId(): string {
  etapeIdCounter += 1
  return `sub-etape-${etapeIdCounter}`
}

/**
 * One Etape per source track, id = track.id (stable across re-derivations —
 * keeps React keys/focus stable in rename inputs even though this function
 * returns fresh objects every call).
 */
export function computeBaseEtapes(tracks: SourceTrack[]): {
  points: TrackPoint[]
  cumulativeDistances: number[]
  baseEtapes: Etape[]
} {
  const merged = mergeTracks(tracks)
  // Track-to-track transitions (every boundary after the first) must not
  // count the geographic gap between an unrelated pair of days as distance —
  // see computeCumulativeDistancesWithBreaks for why.
  const breakIndices = new Set(merged.boundaries.slice(1).map((b) => b.startIndex))
  const cumulativeDistances = computeCumulativeDistancesWithBreaks(merged.points, breakIndices)
  const total = cumulativeDistances[cumulativeDistances.length - 1] ?? 0

  const baseEtapes: Etape[] = merged.boundaries.map((boundary, i) => {
    const startDistance = cumulativeDistances[boundary.startIndex] ?? 0
    const nextBoundary = merged.boundaries[i + 1]
    const endDistance = nextBoundary ? cumulativeDistances[nextBoundary.startIndex] : total
    return { id: tracks[i].id, name: boundary.name, startDistance, endDistance }
  })

  return { points: merged.points, cumulativeDistances, baseEtapes }
}

/**
 * Subdivides each base étape at any extraSplits strictly inside it. Splits
 * are stored per-track as an offset from that track's own start (not as an
 * absolute route distance) specifically so that reordering base étapes
 * doesn't silently re-attach a split to a different track — the split
 * stays with the track it was drawn on, wherever that track now sits in
 * the merged route. A base étape with no interior split is returned
 * completely unchanged (same object reference) — this is what makes
 * "reset splits" exact: subdivideAtExtraSplits(base, []) === base for
 * every entry.
 */
export function subdivideAtExtraSplits(baseEtapes: Etape[], extraSplits: ExtraSplit[]): Etape[] {
  const result: Etape[] = []

  for (const base of baseEtapes) {
    const interior = extraSplits
      .filter((s) => s.trackId === base.id)
      .map((s) => base.startDistance + s.offset)
      .filter(
        (d) =>
          d > base.startDistance + MIN_SPLIT_SEPARATION_METERS &&
          d < base.endDistance - MIN_SPLIT_SEPARATION_METERS,
      )
      .sort((a, b) => a - b)

    if (interior.length === 0) {
      result.push(base)
      continue
    }

    const bounds = [base.startDistance, ...interior, base.endDistance]
    for (let i = 0; i < bounds.length - 1; i++) {
      result.push({
        id: nextEtapeId(),
        name: `${base.name} (${subLabel(i)})`,
        startDistance: bounds[i],
        endDistance: bounds[i + 1],
      })
    }
  }

  return result
}

function subLabel(index: number): string {
  return index < 26 ? String.fromCharCode(97 + index) : String(index + 1)
}

export function deriveHike(tracks: SourceTrack[], extraSplits: ExtraSplit[]): Hike {
  const { points, cumulativeDistances, baseEtapes } = computeBaseEtapes(tracks)
  const etapes = subdivideAtExtraSplits(baseEtapes, extraSplits)
  return { points, cumulativeDistances, etapes, baseEtapes }
}
