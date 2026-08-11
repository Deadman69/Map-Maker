import { fromLonLat } from 'ol/proj'
import type { Hike, Orientation, OrientationMode, PaperSize } from '../state/types'
import { meanLatitude, pointAtDistance } from '../gpx/routeStats'
import { computeResolutionForNiveau, getPageDimensionsMm, mmToPixels } from './scale'

export interface PageDescriptor {
  index: number
  distanceStart: number
  distanceEnd: number
  /** projected (EPSG:3857) center of the page */
  center: [number, number]
  resolution: number
  rotation: number
  widthPx: number
  heightPx: number
}

export interface PaginateOptions {
  niveauMeters: number
  segmentsTarget: number
  paperSize: PaperSize
  orientation: Orientation
  dpi: number
  /** fraction (0-1) of the page's ground-width shared with the next page */
  overlapPercent: number
  /** 'followRoute' (default) rotates each page so the trail runs
   * left-to-right; 'northUp' keeps rotation at 0 on every page. */
  orientationMode: OrientationMode
}

const MIN_ADVANCE_FRACTION = 0.2

/**
 * Paginates a distance range of the route into a sequence of strip-map
 * pages at a fixed scale (derived from niveau/segmentsTarget), each rotated
 * so the trail runs left-to-right. The same function serves both per-étape
 * and whole-route detail sets, and overview.ts reuses it for the multi-page
 * overview fallback — callers just pick the range and overlap.
 */
export function paginateRoute(
  hike: Hike,
  range: { startDistance: number; endDistance: number },
  options: PaginateOptions,
): PageDescriptor[] {
  const { printableWidthMm, printableHeightMm } = getPageDimensionsMm(
    options.paperSize,
    options.orientation,
  )
  const meanLat = meanLatitude(hike.points)
  const resolution = computeResolutionForNiveau({
    niveauMeters: options.niveauMeters,
    segmentsTarget: options.segmentsTarget,
    printableWidthMm,
    dpi: options.dpi,
    meanLatitudeDeg: meanLat,
  })
  const widthPx = Math.round(mmToPixels(printableWidthMm, options.dpi))
  const heightPx = Math.round(mmToPixels(printableHeightMm, options.dpi))

  // By construction of computeResolutionForNiveau, a page's width covers
  // exactly this many true ground meters — reused here to walk the route.
  const groundWidthMeters = options.segmentsTarget * options.niveauMeters
  const advanceMeters = groundWidthMeters * (1 - options.overlapPercent)
  const minAdvanceMeters = groundWidthMeters * MIN_ADVANCE_FRACTION
  const lookSpan = groundWidthMeters / 4

  const totalRouteDistance = hike.cumulativeDistances[hike.cumulativeDistances.length - 1] ?? 0
  const rangeEnd = Math.min(range.endDistance, totalRouteDistance)

  const pages: PageDescriptor[] = []
  let cursor = range.startDistance
  let index = 0

  while (cursor < rangeEnd) {
    const pageEnd = Math.min(cursor + groundWidthMeters, rangeEnd)
    const centerDistance = (cursor + pageEnd) / 2

    const centerPoint = pointAtDistance(hike.points, hike.cumulativeDistances, centerDistance)
    const center = fromLonLat([centerPoint.lon, centerPoint.lat]) as [number, number]

    let rotation = 0
    if (options.orientationMode !== 'northUp') {
      const behind = pointAtDistance(
        hike.points,
        hike.cumulativeDistances,
        centerDistance - lookSpan,
      )
      const ahead = pointAtDistance(hike.points, hike.cumulativeDistances, centerDistance + lookSpan)
      const pBehind = fromLonLat([behind.lon, behind.lat])
      const pAhead = fromLonLat([ahead.lon, ahead.lat])
      rotation = Math.atan2(pAhead[1] - pBehind[1], pAhead[0] - pBehind[0])
    }

    pages.push({ index, distanceStart: cursor, distanceEnd: pageEnd, center, resolution, rotation, widthPx, heightPx })

    if (pageEnd >= rangeEnd) break
    index++
    cursor += Math.max(advanceMeters, minAdvanceMeters)
  }

  return pages
}
