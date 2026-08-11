import type { jsPDF } from 'jspdf'
import type { Translator } from '../i18n/types'

/** Real folded hiking/IGN maps use roughly 90-110mm panels. */
export const ACCORDION_TARGET_PANEL_WIDTH_MM = 100
/** Below 3 panels it's just a single valley fold, not an accordion. */
export const ACCORDION_MIN_PANELS = 3
export const ACCORDION_MAX_PANELS = 8

export function computeAccordionPanelCount(printableWidthMm: number): number {
  const raw = Math.round(printableWidthMm / ACCORDION_TARGET_PANEL_WIDTH_MM)
  return Math.min(ACCORDION_MAX_PANELS, Math.max(ACCORDION_MIN_PANELS, raw))
}

const MOUNTAIN_COLOR = [200, 80, 0] as const
const VALLEY_COLOR = [0, 90, 180] as const
const CHEVRON_SIZE_MM = 3

/**
 * Draws accordion ("military") fold guides across the full page height —
 * a fold crease is physical and must span the whole sheet, not stop at the
 * printable-area margin. Every fold line carries three redundant cues so
 * it reads unambiguously even in grayscale or to someone unfamiliar with
 * any convention: an alternating colour+dash pattern, a chevron glyph, and
 * an explicit "M"/"V" text label. Meant for the overview page only — callers
 * decide that scoping, this module just draws.
 */
export function drawAccordionFoldGuides(
  pdf: jsPDF,
  widthMm: number,
  heightMm: number,
  marginMm: number,
  t: Translator['t'],
): void {
  const printableWidthMm = widthMm - 2 * marginMm
  const panelCount = computeAccordionPanelCount(printableWidthMm)
  const panelWidth = printableWidthMm / panelCount

  for (let i = 1; i < panelCount; i++) {
    const x = marginMm + i * panelWidth
    const isMountain = i % 2 === 1
    drawFoldLine(pdf, x, heightMm, isMountain)
  }

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(0)
  for (let i = 0; i < panelCount; i++) {
    const centerX = marginMm + (i + 0.5) * panelWidth
    pdf.text(String(i + 1), centerX, marginMm - 3, { align: 'center' })
  }

  pdf.setFontSize(8)
  pdf.setTextColor(90)
  pdf.text(t('pdf.foldInstruction', { count: panelCount }), marginMm, heightMm - marginMm / 2)
}

function drawFoldLine(pdf: jsPDF, x: number, heightMm: number, isMountain: boolean): void {
  const color = isMountain ? MOUNTAIN_COLOR : VALLEY_COLOR

  // white halo so the line stays legible over dark/busy basemap imagery
  pdf.setDrawColor(255, 255, 255)
  pdf.setLineWidth(0.8)
  pdf.setLineDashPattern([], 0)
  pdf.line(x, 0, x, heightMm)

  pdf.setDrawColor(color[0], color[1], color[2])
  pdf.setLineWidth(0.4)
  pdf.setLineDashPattern(isMountain ? [4, 1] : [1, 2], 0)
  pdf.line(x, 0, x, heightMm)
  pdf.setLineDashPattern([], 0)

  drawChevron(pdf, x, CHEVRON_SIZE_MM + 1, isMountain, color)
  drawChevron(pdf, x, heightMm - CHEVRON_SIZE_MM - 1, isMountain, color)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(color[0], color[1], color[2])
  pdf.text(isMountain ? 'M' : 'V', x + 1.5, CHEVRON_SIZE_MM + 2)
}

function drawChevron(
  pdf: jsPDF,
  x: number,
  y: number,
  apexUp: boolean,
  color: readonly [number, number, number],
): void {
  const dy = apexUp ? -CHEVRON_SIZE_MM : CHEVRON_SIZE_MM
  pdf.setDrawColor(color[0], color[1], color[2])
  pdf.setLineWidth(0.4)
  pdf.line(x - CHEVRON_SIZE_MM, y, x, y + dy)
  pdf.line(x, y + dy, x + CHEVRON_SIZE_MM, y)
}
