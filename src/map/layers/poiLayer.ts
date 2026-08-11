import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Circle as CircleStyle, Fill, RegularShape, Stroke, Style, Text } from 'ol/style'
import { fromLonLat, toLonLat } from 'ol/proj'
import type { PoiType, PointOfInterest } from '../../state/types'

/** id of the OL feature carries the POI id, for drag/select handlers to
 * find the matching state entry without a separate lookup table. */
export const POI_ID_FEATURE_KEY = 'poiId'

interface PoiVisual {
  glyph: string
  color: string
}

const POI_VISUALS: Record<PoiType, PoiVisual> = {
  waterPoint: { glyph: 'W', color: '#1f6fb2' },
  shelter: { glyph: 'R', color: '#7a4b2a' },
  viewpoint: { glyph: '★', color: '#7a3fa0' },
  campsite: { glyph: 'C', color: '#2f6b4f' },
  trailhead: { glyph: 'P', color: '#3a3a3a' },
  danger: { glyph: '!', color: '#d1650f' },
  namedPoint: { glyph: '●', color: '#555555' },
}

// Falls back to namedPoint's visual for an unrecognized type rather than
// throwing — a session restored from localStorage is untrusted data (could
// be hand-edited or left over from a future app version with more POI
// types), and a bad POI shouldn't be able to crash the whole map render.
function visualFor(poi: PointOfInterest): PoiVisual {
  return POI_VISUALS[poi.type] ?? POI_VISUALS.namedPoint
}

export function poiGlyph(poi: PointOfInterest): string {
  if (poi.type === 'namedPoint' && poi.label) return poi.label.charAt(0).toUpperCase()
  return visualFor(poi).glyph
}

export function poiColor(poi: PointOfInterest): string {
  return visualFor(poi).color
}

function poiStyle(poi: PointOfInterest): Style {
  const visual = visualFor(poi)
  const glyph = poiGlyph(poi)
  // Any type can be named (not just namedPoint) — a dashed outline is a
  // quiet, constant reminder that a point is waiting for a name, until it
  // gets one and the outline turns solid.
  const stroke = new Stroke({
    color: '#ffffff',
    width: 2,
    lineDash: poi.label ? undefined : [2, 2],
  })

  if (poi.type === 'danger') {
    return new Style({
      image: new RegularShape({
        points: 3,
        radius: 11,
        fill: new Fill({ color: visual.color }),
        stroke,
      }),
      text: new Text({
        text: glyph,
        font: 'bold 11px sans-serif',
        fill: new Fill({ color: '#ffffff' }),
        offsetY: 2,
      }),
    })
  }

  return new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({ color: visual.color }),
      stroke,
    }),
    text: new Text({
      text: glyph,
      font: 'bold 11px sans-serif',
      fill: new Fill({ color: '#ffffff' }),
    }),
  })
}

function labelStyle(poi: PointOfInterest): Style | null {
  if (!poi.label) return null
  return new Style({
    text: new Text({
      text: poi.label,
      font: '12px sans-serif',
      offsetY: 16,
      fill: new Fill({ color: '#000000' }),
      stroke: new Stroke({ color: '#ffffff', width: 3 }),
    }),
  })
}

/** Mirrors trackLayer.ts: a plain VectorLayer rebuilt whenever the POI list
 * changes, so it's automatically picked up by renderPage.ts's generic
 * ".ol-layer canvas" compositing with zero changes there. */
export function createPoiLayer(pois: PointOfInterest[]): VectorLayer<VectorSource> {
  const source = new VectorSource()
  for (const poi of pois) {
    const feature = new Feature({ geometry: new Point(fromLonLat([poi.lon, poi.lat])) })
    feature.set(POI_ID_FEATURE_KEY, poi.id)
    const label = labelStyle(poi)
    feature.setStyle(label ? [poiStyle(poi), label] : [poiStyle(poi)])
    source.addFeature(feature)
  }
  return new VectorLayer({ source })
}

export function lonLatFromFeatureCoordinate(coordinate: number[]): { lon: number; lat: number } {
  const [lon, lat] = toLonLat(coordinate)
  return { lon, lat }
}
