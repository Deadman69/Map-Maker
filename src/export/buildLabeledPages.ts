import type { ExportConfig, Hike } from '../state/types'
import type { Translator } from '../i18n/types'
import { paginateRoute, type PageDescriptor } from './paginate'
import { computeOverviewPages } from './overview'
import { computeElevationProfileGeometry, type ElevationProfileGeometry } from '../gpx/elevationProfile'

export interface LabeledPage {
  page: PageDescriptor | null // null for 'blank' and 'profile' entries
  label: string
  withLocator: boolean
  kind: 'overview' | 'detail' | 'blank' | 'profile'
  geometry?: ElevationProfileGeometry // only for kind === 'profile'
}

/**
 * Builds the ordered list of pages a full pack would contain — overview,
 * elevation profile (if any), then detail pages — without rendering any of
 * them. Shared by generateHikePdf (which renders each entry) and the
 * export-settings screen's live page-count preview (which only counts them),
 * so the two can never disagree about how many pages a given config produces.
 */
export function buildLabeledPages(hike: Hike, config: ExportConfig, t: Translator['t']): LabeledPage[] {
  const labeled: LabeledPage[] = []

  const overview = computeOverviewPages(hike, {
    paperSize: config.paperSize,
    orientation: config.orientation,
    dpi: config.dpi,
    orientationMode: config.orientationMode,
  })
  overview.pages.forEach((page, i) => {
    labeled.push({
      page,
      label:
        overview.pages.length > 1
          ? t('pdf.overviewLabelPaged', { i: i + 1, total: overview.pages.length })
          : t('pdf.overviewLabel'),
      withLocator: false,
      kind: 'overview',
    })
  })

  const profileGeometry = computeElevationProfileGeometry(hike)
  if (profileGeometry.hasElevation) {
    labeled.push({
      page: null,
      label: t('pdf.profileLabel'),
      withLocator: false,
      kind: 'profile',
      geometry: profileGeometry,
    })
  }

  const total = hike.cumulativeDistances[hike.cumulativeDistances.length - 1] ?? 0
  const detailRanges =
    config.scope === 'perEtape'
      ? hike.etapes.map((e) => ({ startDistance: e.startDistance, endDistance: e.endDistance, name: e.name }))
      : [{ startDistance: 0, endDistance: total, name: null as string | null }]

  for (const range of detailRanges) {
    const pages = paginateRoute(
      hike,
      { startDistance: range.startDistance, endDistance: range.endDistance },
      {
        niveauMeters: config.niveauMeters,
        segmentsTarget: config.segmentsTarget,
        paperSize: config.paperSize,
        orientation: config.orientation,
        dpi: config.dpi,
        overlapPercent: config.overlapPercent,
        orientationMode: config.orientationMode,
      },
    )
    pages.forEach((page, i) => {
      const label = range.name
        ? t('pdf.detailLabelNamed', { name: range.name, i: i + 1, total: pages.length })
        : t('pdf.detailLabel', { i: i + 1, total: pages.length })
      labeled.push({ page, label, withLocator: true, kind: 'detail' })
    })
  }

  return labeled
}
