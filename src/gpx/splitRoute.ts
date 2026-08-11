import type { SourceTrack, TrackPoint } from '../state/types'

let trackIdCounter = 0
function nextTrackId(): string {
  trackIdCounter += 1
  return `track-${trackIdCounter}`
}

/** Single continuous GPX track — one SourceTrack, split manually later. */
export function sourceTracksFromSingle(points: TrackPoint[], name = 'Étape 1'): SourceTrack[] {
  return [{ id: nextTrackId(), name, points }]
}

/** One GPX file per day/étape — one SourceTrack per file, in import order. */
export function sourceTracksFromMultiple(
  tracks: { name: string; points: TrackPoint[] }[],
): SourceTrack[] {
  return tracks.map((t) => ({ id: nextTrackId(), name: t.name, points: t.points }))
}
