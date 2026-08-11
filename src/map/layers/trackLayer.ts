import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Point from 'ol/geom/Point'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import type { Hike } from '../../state/types'

const trackStyle = new Style({
  stroke: new Stroke({ color: '#c0392b', width: 3 }),
})

const splitPointStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: '#ffffff' }),
    stroke: new Stroke({ color: '#c0392b', width: 2 }),
  }),
})

/**
 * Builds the vector layer showing the route line and, at each étape
 * boundary (other than the very start/end), a draggable-looking split marker.
 */
export function createTrackLayer(hike: Hike): VectorLayer<VectorSource> {
  const source = new VectorSource()

  const lineCoords = hike.points.map((p) => fromLonLat([p.lon, p.lat]))
  const lineFeature = new Feature({ geometry: new LineString(lineCoords) })
  lineFeature.setStyle(trackStyle)
  source.addFeature(lineFeature)

  const total = hike.cumulativeDistances[hike.cumulativeDistances.length - 1] ?? 0
  const innerBoundaries = hike.etapes
    .map((e) => e.startDistance)
    .filter((d) => d > 0 && d < total)

  for (const distance of innerBoundaries) {
    const point = pointAtDistance(hike, distance)
    if (!point) continue
    const feature = new Feature({
      geometry: new Point(fromLonLat([point.lon, point.lat])),
      distance,
    })
    feature.setStyle(splitPointStyle)
    source.addFeature(feature)
  }

  return new VectorLayer({ source })
}

function pointAtDistance(hike: Hike, distance: number) {
  const { cumulativeDistances, points } = hike
  let lo = 0
  let hi = cumulativeDistances.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (cumulativeDistances[mid] < distance) lo = mid + 1
    else hi = mid
  }
  return points[lo]
}
