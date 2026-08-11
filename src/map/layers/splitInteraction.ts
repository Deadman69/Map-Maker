import type Map from 'ol/Map'
import type MapBrowserEvent from 'ol/MapBrowserEvent'
import { fromLonLat } from 'ol/proj'
import type { Hike } from '../../state/types'

const CLICK_TOLERANCE_PX = 12
const REMOVE_TOLERANCE_METERS = 30

/**
 * Attaches a click handler that toggles a split point on the route: clicking
 * near an existing split removes it, clicking near the line elsewhere adds
 * one at the closest point on the track (by linear interpolation between the
 * two nearest vertices — precise enough given real GPX tracks are densely
 * sampled). Clicks far from the line are ignored.
 */
export function attachSplitInteraction(
  map: Map,
  hike: Hike,
  onToggleSplit: (distance: number, action: 'add' | 'remove') => void,
): () => void {
  const projected = hike.points.map((p) => fromLonLat([p.lon, p.lat]))
  const existingSplits = hike.etapes
    .map((e) => e.startDistance)
    .filter((d) => d > 0)

  function handleClick(evt: MapBrowserEvent) {
    const resolution = map.getView().getResolution() ?? 1
    const toleranceMeters = CLICK_TOLERANCE_PX * resolution
    const click = evt.coordinate

    let best = { distMeters: Infinity, routeDistance: 0 }
    for (let i = 0; i < projected.length - 1; i++) {
      const a = projected[i]
      const b = projected[i + 1]
      const { point, t } = closestPointOnSegment(click, a, b)
      const d = Math.hypot(point[0] - click[0], point[1] - click[1])
      if (d < best.distMeters) {
        const segStart = hike.cumulativeDistances[i]
        const segEnd = hike.cumulativeDistances[i + 1]
        best = { distMeters: d, routeDistance: segStart + t * (segEnd - segStart) }
      }
    }

    if (best.distMeters > toleranceMeters) return // click too far from the track

    const nearExisting = existingSplits.find(
      (d) => Math.abs(d - best.routeDistance) < REMOVE_TOLERANCE_METERS,
    )
    if (nearExisting !== undefined) {
      onToggleSplit(nearExisting, 'remove')
    } else {
      onToggleSplit(best.routeDistance, 'add')
    }
  }

  map.on('click', handleClick)
  return () => map.un('click', handleClick)
}

function closestPointOnSegment(
  p: number[],
  a: number[],
  b: number[],
): { point: number[]; t: number } {
  const abx = b[0] - a[0]
  const aby = b[1] - a[1]
  const lengthSq = abx * abx + aby * aby
  if (lengthSq === 0) return { point: a, t: 0 }
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / lengthSq))
  return { point: [a[0] + t * abx, a[1] + t * aby], t }
}
