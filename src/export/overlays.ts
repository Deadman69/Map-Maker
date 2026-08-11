import type { Hike } from '../state/types'
import type { Translator } from '../i18n/types'
import { indexAtDistance } from '../gpx/routeStats'
import { resolutionToGroundMetersPerPixel } from './scale'

export interface PageOverlayInfo {
  resolution: number
  rotation: number
  meanLatitudeDeg: number
  niveauMeters: number
  segmentsTarget: number
  pageLabel: string
  t: Translator['t']
  /** omitted for overview pages, which don't need a "where am I" locator */
  locator?: {
    hike: Hike
    distanceStart: number
    distanceEnd: number
  }
}

const MARGIN_PX_AT_96DPI = 14

/** Scales a design constant expressed at 96dpi up to the canvas's actual DPI. */
function scaled(valueAt96Dpi: number, dpi: number): number {
  return (valueAt96Dpi * dpi) / 96
}

export function drawPageOverlays(
  ctx: CanvasRenderingContext2D,
  canvasWidthPx: number,
  canvasHeightPx: number,
  dpi: number,
  info: PageOverlayInfo,
): void {
  const margin = scaled(MARGIN_PX_AT_96DPI, dpi)
  drawScaleBar(ctx, margin, canvasHeightPx - margin, dpi, info)
  drawNorthArrow(ctx, canvasWidthPx - margin, margin, dpi, info.rotation, info.t)
  drawPageLabel(ctx, margin, margin, dpi, info.pageLabel)
  if (info.locator) {
    drawLocator(ctx, canvasWidthPx - margin, canvasHeightPx - margin, dpi, info.locator)
  }
}

function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  left: number,
  bottom: number,
  dpi: number,
  info: PageOverlayInfo,
): void {
  const groundMetersPerPixel = resolutionToGroundMetersPerPixel(info.resolution, info.meanLatitudeDeg)
  const pixelsPerSegment = info.niveauMeters / groundMetersPerPixel
  const barHeight = scaled(6, dpi)
  // The widget only ever shows a handful of segments as a compact corner
  // reference — info.segmentsTarget (e.g. 12) describes how many of these
  // segments span the *whole page*, which was used to derive the scale in
  // the first place, but drawing all of them here would make the bar as
  // wide as the page itself.
  const segments = Math.min(4, info.segmentsTarget)

  ctx.save()
  ctx.textBaseline = 'alphabetic'
  ctx.font = `${Math.round(scaled(11, dpi))}px sans-serif`
  ctx.fillStyle = '#000000'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = Math.max(1, scaled(1, dpi))

  // background plate for legibility over any basemap
  const totalWidth = pixelsPerSegment * segments
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillRect(left - 4, bottom - barHeight - scaled(16, dpi), totalWidth + 8, barHeight + scaled(20, dpi))

  for (let i = 0; i < segments; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#000000' : '#ffffff'
    ctx.fillRect(left + i * pixelsPerSegment, bottom - barHeight, pixelsPerSegment, barHeight)
  }
  ctx.strokeRect(left, bottom - barHeight, totalWidth, barHeight)

  ctx.fillStyle = '#000000'
  ctx.fillText(`0`, left, bottom - barHeight - scaled(4, dpi))
  const label = `${segments * info.niveauMeters} m`
  const labelWidth = ctx.measureText(label).width
  ctx.fillText(label, left + totalWidth - labelWidth, bottom - barHeight - scaled(4, dpi))
  ctx.fillText(
    info.t('pdf.scaleSegmentLabel', { n: info.niveauMeters }),
    left,
    bottom - barHeight - scaled(4, dpi) - scaled(14, dpi),
  )
  ctx.restore()
}

function drawNorthArrow(
  ctx: CanvasRenderingContext2D,
  right: number,
  top: number,
  dpi: number,
  rotation: number,
  t: Translator['t'],
): void {
  const size = scaled(28, dpi)
  const cx = right - size / 2
  const cy = top + size / 2 + scaled(8, dpi)

  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.75, 0, Math.PI * 2)
  ctx.fill()

  ctx.translate(cx, cy)
  // The map is rotated by `rotation`; north on screen points opposite that.
  ctx.rotate(-rotation)
  ctx.fillStyle = '#c0392b'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = Math.max(1, scaled(1, dpi))
  ctx.beginPath()
  ctx.moveTo(0, -size / 2)
  ctx.lineTo(size / 4, size / 3)
  ctx.lineTo(0, size / 5)
  ctx.lineTo(-size / 4, size / 3)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#000000'
  ctx.font = `${Math.round(scaled(11, dpi))}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(t('pdf.northLabel'), 0, size / 2 + scaled(12, dpi))
  ctx.restore()
}

function drawPageLabel(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  dpi: number,
  label: string,
): void {
  ctx.save()
  ctx.font = `bold ${Math.round(scaled(14, dpi))}px sans-serif`
  const paddingX = scaled(8, dpi)
  const paddingY = scaled(6, dpi)
  const textWidth = ctx.measureText(label).width
  const boxHeight = scaled(14, dpi) + paddingY * 2
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillRect(left, top, textWidth + paddingX * 2, boxHeight)
  ctx.fillStyle = '#000000'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, left + paddingX, top + boxHeight / 2)
  ctx.restore()
}

function drawLocator(
  ctx: CanvasRenderingContext2D,
  right: number,
  bottom: number,
  dpi: number,
  locator: { hike: Hike; distanceStart: number; distanceEnd: number },
): void {
  const w = scaled(110, dpi)
  const h = scaled(70, dpi)
  const left = right - w
  const top = bottom - h

  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  for (const p of locator.hike.points) {
    if (p.lon < minLon) minLon = p.lon
    if (p.lon > maxLon) maxLon = p.lon
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
  }
  const lonSpan = Math.max(maxLon - minLon, 1e-9)
  const latSpan = Math.max(maxLat - minLat, 1e-9)
  const pad = 0.08
  const usableW = w * (1 - 2 * pad)
  const usableH = h * (1 - 2 * pad)
  const toXY = (lon: number, lat: number): [number, number] => [
    left + w * pad + ((lon - minLon) / lonSpan) * usableW,
    top + h * pad + (1 - (lat - minLat) / latSpan) * usableH,
  ]

  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillRect(left, top, w, h)
  ctx.strokeStyle = '#888888'
  ctx.lineWidth = 1
  ctx.strokeRect(left, top, w, h)

  ctx.beginPath()
  locator.hike.points.forEach((p, i) => {
    const [x, y] = toXY(p.lon, p.lat)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.strokeStyle = '#999999'
  ctx.lineWidth = Math.max(1, scaled(1.5, dpi))
  ctx.stroke()

  const startIdx = indexAtDistance(locator.hike.cumulativeDistances, locator.distanceStart)
  const endIdx = indexAtDistance(locator.hike.cumulativeDistances, locator.distanceEnd)
  ctx.beginPath()
  for (let i = startIdx; i <= endIdx && i < locator.hike.points.length; i++) {
    const p = locator.hike.points[i]
    const [x, y] = toXY(p.lon, p.lat)
    if (i === startIdx) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.strokeStyle = '#c0392b'
  ctx.lineWidth = Math.max(2, scaled(2.5, dpi))
  ctx.stroke()
  ctx.restore()
}
