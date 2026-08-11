import type { TrackPoint } from '../state/types'

export interface NamedTrack {
  name: string
  points: TrackPoint[]
}

export interface MergedTrack {
  points: TrackPoint[]
  /** index into `points` where each input track starts, same order as input */
  boundaries: { name: string; startIndex: number }[]
}

/**
 * Concatenates multiple per-day tracks in the given order into one ordered
 * point list, recording each source track's starting point index. Exact
 * start *distances* are derived later from the merged list's cumulative
 * distances (routeStats.ts) rather than re-approximated here, so boundaries
 * always line up with the real distance-along-route used elsewhere.
 */
export function mergeTracks(tracks: NamedTrack[]): MergedTrack {
  const points: TrackPoint[] = []
  const boundaries: { name: string; startIndex: number }[] = []

  for (const track of tracks) {
    boundaries.push({ name: track.name, startIndex: points.length })
    points.push(...track.points)
  }

  return { points, boundaries }
}
