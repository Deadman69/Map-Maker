import type { ExportConfig, PaperSize } from '../state/types'

export const MM_PER_INCH = 25.4

/** Paper dimensions in mm, portrait orientation (width, height). */
const PAPER_SIZES_MM: Record<PaperSize, [number, number]> = {
  A4: [210, 297],
  A3: [297, 420],
}

const PAGE_MARGIN_MM = 10

export interface PageDimensionsMm {
  widthMm: number
  heightMm: number
  printableWidthMm: number
  printableHeightMm: number
}

export function getPageDimensionsMm(
  paperSize: PaperSize,
  orientation: ExportConfig['orientation'],
): PageDimensionsMm {
  const [portraitWidth, portraitHeight] = PAPER_SIZES_MM[paperSize]
  const [widthMm, heightMm] =
    orientation === 'landscape' ? [portraitHeight, portraitWidth] : [portraitWidth, portraitHeight]
  return {
    widthMm,
    heightMm,
    printableWidthMm: widthMm - 2 * PAGE_MARGIN_MM,
    printableHeightMm: heightMm - 2 * PAGE_MARGIN_MM,
  }
}

export function mmToPixels(mm: number, dpi: number): number {
  return (mm * dpi) / MM_PER_INCH
}

/**
 * Computes the OL view resolution (EPSG:3857 projected units per pixel)
 * needed so the printed scale bar shows `niveauMeters`-long segments, with
 * about `segmentsTarget` of them spanning the page's printable width.
 *
 * Web Mercator (EPSG:3857) inflates east-west/north-south distances by
 * 1/cos(latitude) relative to true ground distance. The standard "meters per
 * pixel" formula for slippy-map tiles is:
 *   groundMetersPerPixel = projectedUnitsPerPixel * cos(latitude)
 * so to hit a target ground-distance-per-page-width at a given latitude we
 * must divide by cos(latitude), not multiply — getting this backwards would
 * make every printed scale bar wrong by a factor of ~1.4-1.6x at French
 * latitudes (a bug worth flagging loudly since it's easy to get the sign
 * wrong here).
 */
export function computeResolutionForNiveau(params: {
  niveauMeters: number
  segmentsTarget: number
  printableWidthMm: number
  dpi: number
  meanLatitudeDeg: number
}): number {
  const { niveauMeters, segmentsTarget, printableWidthMm, dpi, meanLatitudeDeg } = params
  const printableWidthPx = mmToPixels(printableWidthMm, dpi)
  const groundWidthMeters = segmentsTarget * niveauMeters
  const resolutionGround = groundWidthMeters / printableWidthPx
  const latitudeRad = (meanLatitudeDeg * Math.PI) / 180
  return resolutionGround / Math.cos(latitudeRad)
}

/** Inverse of computeResolutionForNiveau: what ground distance (m) does one pixel represent, at a given latitude. */
export function resolutionToGroundMetersPerPixel(
  resolutionProjected: number,
  meanLatitudeDeg: number,
): number {
  const latitudeRad = (meanLatitudeDeg * Math.PI) / 180
  return resolutionProjected * Math.cos(latitudeRad)
}
