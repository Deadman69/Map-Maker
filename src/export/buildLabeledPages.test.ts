import { describe, expect, it } from 'vitest'
import { buildLabeledPages } from './buildLabeledPages'
import { deriveHike } from '../gpx/baseEtapes'
import { defaultExportConfig } from '../state/appReducer'
import { fr } from '../i18n/fr'
import type { TranslateVars } from '../i18n/types'
import type { SourceTrack } from '../state/types'

function t(key: string, vars: TranslateVars = {}): string {
  const entry = fr[key as keyof typeof fr]
  if (entry === undefined) return key
  return typeof entry === 'function' ? entry(vars) : entry
}

function track(id: string, points: { lon: number; lat: number }[]): SourceTrack {
  return { id, name: id, points }
}

describe('buildLabeledPages', () => {
  it('produces an overview entry and detail entries covering the whole route by default', () => {
    const hike = deriveHike(
      [track('t1', [{ lon: 5.72, lat: 45.18 }, { lon: 5.745, lat: 45.19 }, { lon: 5.79, lat: 45.215 }])],
      [],
    )
    const labeled = buildLabeledPages(hike, defaultExportConfig, t)
    expect(labeled.filter((p) => p.kind === 'overview').length).toBeGreaterThanOrEqual(1)
    expect(labeled.filter((p) => p.kind === 'detail').length).toBeGreaterThan(0)
    // padding to an even page count is generateHikePdf's job, not this function's
    expect(labeled.every((p) => p.kind !== 'blank')).toBe(true)
  })

  it('groups detail pages per étape, named after the étape, when scope is perEtape', () => {
    const hike = deriveHike(
      [
        track('t1', [{ lon: 6.0, lat: 45.1 }, { lon: 6.01, lat: 45.11 }, { lon: 6.02, lat: 45.12 }]),
        track('t2', [{ lon: 6.02, lat: 45.12 }, { lon: 6.03, lat: 45.13 }, { lon: 6.04, lat: 45.14 }]),
      ],
      [],
    )
    const labeled = buildLabeledPages(hike, { ...defaultExportConfig, scope: 'perEtape' }, t)
    const detailLabels = labeled.filter((p) => p.kind === 'detail').map((p) => p.label)
    expect(detailLabels.some((l) => l.startsWith('t1'))).toBe(true)
    expect(detailLabels.some((l) => l.startsWith('t2'))).toBe(true)
  })

  it('omits the elevation profile entry when the GPX has no elevation data', () => {
    const hike = deriveHike([track('t1', [{ lon: 0, lat: 0 }, { lon: 1, lat: 1 }])], [])
    const labeled = buildLabeledPages(hike, defaultExportConfig, t)
    expect(labeled.some((p) => p.kind === 'profile')).toBe(false)
  })
})
