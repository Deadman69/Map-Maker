import { fromLonLat } from 'ol/proj'
import type { Hike, Orientation, OrientationMode, PaperSize } from '../state/types'
import { boundingBox, meanLatitude } from '../gpx/routeStats'
import { getPageDimensionsMm, mmToPixels } from './scale'
import { paginateRoute, type PageDescriptor } from './paginate'

export interface OverviewOptions {
  paperSize: PaperSize
  orientation: Orientation
  dpi: number
  orientationMode: OrientationMode
}

export interface OverviewResult {
  mode: 'single' | 'multi'
  pages: PageDescriptor[]
}

/** Below this, a scale bar segment would represent so much ground that the
 * route becomes a nearly-featureless line — not a useful "vue d'ensemble". */
const LEGIBILITY_FLOOR_METERS_PER_SEGMENT = 2000
const OVERVIEW_SEGMENTS_TARGET = 12
const OVERVIEW_NIVEAU_METERS = 500
const OVERVIEW_OVERLAP = 0.05
/** Keeps the track from touching the page edges. */
const BBOX_PADDING_FACTOR = 1.1

/**
 * Decides whether the whole hike fits legibly on one overview sheet; if not,
 * falls back to paginate.ts with coarse, overview-appropriate parameters
 * rather than inventing a second bbox-splitting algorithm.
 */
export function computeOverviewPages(hike: Hike, options: OverviewOptions): OverviewResult {
  const total = hike.cumulativeDistances[hike.cumulativeDistances.length - 1] ?? 0
  const bbox = boundingBox(hike.points)
  const meanLat = meanLatitude(hike.points)
  const { printableWidthMm, printableHeightMm } = getPageDimensionsMm(
    options.paperSize,
    options.orientation,
  )
  const widthPx = Math.round(mmToPixels(printableWidthMm, options.dpi))
  const heightPx = Math.round(mmToPixels(printableHeightMm, options.dpi))

  const corner1 = fromLonLat([bbox.minLon, bbox.minLat])
  const corner2 = fromLonLat([bbox.maxLon, bbox.maxLat])
  const projectedWidth = Math.abs(corner2[0] - corner1[0])
  const projectedHeight = Math.abs(corner2[1] - corner1[1])

  const resolutionForWidth = (projectedWidth * BBOX_PADDING_FACTOR) / widthPx
  const resolutionForHeight = (projectedHeight * BBOX_PADDING_FACTOR) / heightPx
  const resolution = Math.max(resolutionForWidth, resolutionForHeight)

  const groundWidthMeters = resolution * widthPx * Math.cos((meanLat * Math.PI) / 180)
  const metersPerSegment = groundWidthMeters / OVERVIEW_SEGMENTS_TARGET

  if (metersPerSegment <= LEGIBILITY_FLOOR_METERS_PER_SEGMENT) {
    const center: [number, number] = [
      (corner1[0] + corner2[0]) / 2,
      (corner1[1] + corner2[1]) / 2,
    ]
    return {
      mode: 'single',
      pages: [
        {
          index: 0,
          distanceStart: 0,
          distanceEnd: total,
          center,
          resolution,
          rotation: 0,
          widthPx,
          heightPx,
        },
      ],
    }
  }

  const pages = paginateRoute(
    hike,
    { startDistance: 0, endDistance: total },
    {
      niveauMeters: OVERVIEW_NIVEAU_METERS,
      segmentsTarget: OVERVIEW_SEGMENTS_TARGET,
      paperSize: options.paperSize,
      orientation: options.orientation,
      dpi: options.dpi,
      overlapPercent: OVERVIEW_OVERLAP,
      orientationMode: options.orientationMode,
    },
  )
  return { mode: 'multi', pages }
}
