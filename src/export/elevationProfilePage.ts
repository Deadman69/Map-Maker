import type { jsPDF } from 'jspdf'
import type { ElevationProfileGeometry } from '../gpx/elevationProfile'
import type { Translator } from '../i18n/types'

const TITLE_HEIGHT_MM = 10
const AXIS_LABEL_HEIGHT_MM = 8
const BOUNDARY_LABEL_HEIGHT_MM = 10

/**
 * Draws the elevation profile as a dedicated PDF page, using only jsPDF's
 * own vector drawing calls (line/text) — no canvas/raster — so it stays
 * crisp at any print size. Pure geometry in, no OL/canvas involved.
 */
export function drawElevationProfilePage(
  pdf: jsPDF,
  marginMm: number,
  printableWidthMm: number,
  printableHeightMm: number,
  geometry: ElevationProfileGeometry,
  t: Translator['t'],
): void {
  const left = marginMm
  const top = marginMm
  const width = printableWidthMm

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.setTextColor(0)
  pdf.text(t('pdf.profileLabel'), left, top + TITLE_HEIGHT_MM * 0.6)

  if (!geometry.hasElevation) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.text(t('pdf.profileEmpty'), left, top + TITLE_HEIGHT_MM + 10)
    return
  }

  const chartTop = top + TITLE_HEIGHT_MM + BOUNDARY_LABEL_HEIGHT_MM
  const chartHeight =
    printableHeightMm - TITLE_HEIGHT_MM - BOUNDARY_LABEL_HEIGHT_MM - AXIS_LABEL_HEIGHT_MM * 2
  const chartBottom = chartTop + chartHeight
  const elevRange = Math.max(1, geometry.maxElevation - geometry.minElevation)

  const toX = (distance: number) => left + (distance / geometry.totalDistance) * width
  const toY = (elevation: number) =>
    chartBottom - ((elevation - geometry.minElevation) / elevRange) * chartHeight

  // axes
  pdf.setDrawColor(150)
  pdf.setLineWidth(0.2)
  pdf.line(left, chartTop, left, chartBottom)
  pdf.line(left, chartBottom, left + width, chartBottom)

  // profile polyline
  pdf.setDrawColor(47, 107, 79) // matches --accent
  pdf.setLineWidth(0.4)
  for (let i = 1; i < geometry.points.length; i++) {
    const a = geometry.points[i - 1]
    const b = geometry.points[i]
    pdf.line(toX(a.distance), toY(a.elevation), toX(b.distance), toY(b.elevation))
  }

  // étape boundaries
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  for (const boundary of geometry.boundaries) {
    const x = toX(boundary.distance)
    pdf.setDrawColor(150)
    pdf.setLineWidth(0.15)
    pdf.setLineDashPattern([1, 1], 0)
    pdf.line(x, chartTop, x, chartBottom)
    pdf.setLineDashPattern([], 0)

    pdf.setTextColor(90)
    pdf.text(boundary.label, x, chartTop - 2, { align: 'center', maxWidth: 40 })
    pdf.text(
      `+${Math.round(boundary.gain)}/-${Math.round(boundary.loss)}m`,
      x,
      chartBottom + AXIS_LABEL_HEIGHT_MM - 2,
      { align: 'center' },
    )
  }

  // elevation min/max labels
  pdf.setTextColor(90)
  pdf.text(`${Math.round(geometry.maxElevation)} m`, left - 2, chartTop + 2, { align: 'right' })
  pdf.text(`${Math.round(geometry.minElevation)} m`, left - 2, chartBottom, { align: 'right' })

  // whole-hike summary
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(0)
  pdf.text(
    t('common.elevationSummary', { gain: Math.round(geometry.totalGain), loss: Math.round(geometry.totalLoss) }),
    left,
    chartBottom + AXIS_LABEL_HEIGHT_MM * 2,
  )
}
