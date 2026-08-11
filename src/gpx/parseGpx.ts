import GPX from 'ol/format/GPX'
import LineString from 'ol/geom/LineString'
import MultiLineString from 'ol/geom/MultiLineString'
import type { TrackPoint } from '../state/types'

const gpxFormat = new GPX()

/**
 * Parses raw GPX text and returns the ordered points of every track/route
 * feature it contains, concatenated in document order. Waypoints are ignored.
 * Geometries are kept in EPSG:4326 (lon/lat) since no featureProjection is passed.
 */
export function parseGpx(gpxText: string): TrackPoint[] {
  const features = gpxFormat.readFeatures(gpxText)
  const points: TrackPoint[] = []

  for (const feature of features) {
    const geometry = feature.getGeometry()
    if (geometry instanceof LineString) {
      appendCoordinates(points, geometry.getCoordinates())
    } else if (geometry instanceof MultiLineString) {
      for (const line of geometry.getCoordinates()) {
        appendCoordinates(points, line)
      }
    }
  }

  if (points.length === 0) {
    throw new Error('Le fichier GPX ne contient aucune trace exploitable (trk/rte).')
  }

  return points
}

function appendCoordinates(points: TrackPoint[], coords: number[][]) {
  for (const c of coords) {
    points.push({ lon: c[0], lat: c[1], ele: c.length > 2 ? c[2] : undefined })
  }
}
