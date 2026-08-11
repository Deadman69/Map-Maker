import { describe, expect, it } from 'vitest'
import {
  computeResolutionForNiveau,
  getPageDimensionsMm,
  mmToPixels,
  resolutionToGroundMetersPerPixel,
} from './scale'

describe('getPageDimensionsMm', () => {
  it('A4 portrait is 210x297 with 10mm margins', () => {
    const d = getPageDimensionsMm('A4', 'portrait')
    expect(d.widthMm).toBe(210)
    expect(d.heightMm).toBe(297)
    expect(d.printableWidthMm).toBe(190)
    expect(d.printableHeightMm).toBe(277)
  })

  it('A4 landscape swaps width/height', () => {
    const d = getPageDimensionsMm('A4', 'landscape')
    expect(d.widthMm).toBe(297)
    expect(d.heightMm).toBe(210)
  })

  it('A3 portrait is 297x420', () => {
    const d = getPageDimensionsMm('A3', 'portrait')
    expect(d.widthMm).toBe(297)
    expect(d.heightMm).toBe(420)
  })
})

describe('mmToPixels', () => {
  it('converts using dpi/25.4', () => {
    expect(mmToPixels(25.4, 300)).toBeCloseTo(300, 5)
  })
})

describe('computeResolutionForNiveau', () => {
  // Hand-verified regression case from manual testing this session:
  // A4 landscape, niveau=50m, 12 segments, 300dpi, mean latitude 45°.
  it('matches the hand-verified reference value at 45° latitude', () => {
    const resolution = computeResolutionForNiveau({
      niveauMeters: 50,
      segmentsTarget: 12,
      printableWidthMm: 277,
      dpi: 300,
      meanLatitudeDeg: 45,
    })
    expect(resolution).toBeCloseTo(0.2593, 3)
  })

  it('is unaffected by latitude at the equator (cos(0)=1)', () => {
    const resolution = computeResolutionForNiveau({
      niveauMeters: 50,
      segmentsTarget: 12,
      printableWidthMm: 277,
      dpi: 300,
      meanLatitudeDeg: 0,
    })
    // groundWidthMeters / printableWidthPx, no correction needed
    const printableWidthPx = mmToPixels(277, 300)
    expect(resolution).toBeCloseTo((12 * 50) / printableWidthPx, 6)
  })

  it('grows with latitude (Mercator inflation)', () => {
    const at0 = computeResolutionForNiveau({
      niveauMeters: 50,
      segmentsTarget: 12,
      printableWidthMm: 277,
      dpi: 300,
      meanLatitudeDeg: 0,
    })
    const at60 = computeResolutionForNiveau({
      niveauMeters: 50,
      segmentsTarget: 12,
      printableWidthMm: 277,
      dpi: 300,
      meanLatitudeDeg: 60,
    })
    expect(at60).toBeGreaterThan(at0)
  })
})

describe('resolutionToGroundMetersPerPixel', () => {
  it('is the inverse of the cos(latitude) correction applied by computeResolutionForNiveau', () => {
    const printableWidthMm = 277
    const dpi = 300
    const resolution = computeResolutionForNiveau({
      niveauMeters: 50,
      segmentsTarget: 12,
      printableWidthMm,
      dpi,
      meanLatitudeDeg: 45,
    })
    const groundMetersPerPixel = resolutionToGroundMetersPerPixel(resolution, 45)
    const printableWidthPx = mmToPixels(printableWidthMm, dpi)
    expect(groundMetersPerPixel * printableWidthPx).toBeCloseTo(12 * 50, 1)
  })
})
