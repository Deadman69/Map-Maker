import { jsPDF } from 'jspdf'
import type { ExportConfig, Hike, PointOfInterest } from '../state/types'
import type { Translator } from '../i18n/types'
import { renderPageToCanvas } from './renderPage'
import { getPageDimensionsMm } from './scale'
import { meanLatitude } from '../gpx/routeStats'
import { drawElevationProfilePage } from './elevationProfilePage'
import { createRenderPool, disposeRenderPool, runPool, DEFAULT_RENDER_POOL_SIZE } from './renderPool'
import { drawAccordionFoldGuides } from './foldGuides'
import { buildLabeledPages, type LabeledPage } from './buildLabeledPages'

export interface GeneratePdfProgress {
  /** number of pages completed so far — completion order is not strictly
   * page order once rendering is pooled, so this counts up steadily even
   * though `label` may jump around. */
  current: number
  total: number
  label: string
}

interface RenderedPage {
  entry: LabeledPage
  dataUrl: string | null
}

/**
 * Builds the full pack (overview + elevation profile + detail pages) as one
 * multi-page PDF. Map pages render concurrently across a small pool of
 * HiddenPrintMap instances (rendering a page is dominated by WMTS tile
 * network fetches, which is highly parallelizable — reusing one instance
 * sequentially, as an earlier version of this function did, meant page N+1
 * never even started fetching tiles until page N's fully finished). Encoded
 * JPEG strings are buffered only long enough to drain into the PDF in
 * order — never more than ~pool-size pages' worth at a time — so memory
 * stays bounded regardless of how many pages a long multi-day trek produces.
 */
export async function generateHikePdf(
  hike: Hike,
  pois: PointOfInterest[],
  basemapId: string,
  config: ExportConfig,
  t: Translator['t'],
  onProgress?: (progress: GeneratePdfProgress) => void,
): Promise<Blob> {
  const meanLat = meanLatitude(hike.points)
  const { widthMm, heightMm, printableWidthMm, printableHeightMm } = getPageDimensionsMm(
    config.paperSize,
    config.orientation,
  )
  const marginMm = (widthMm - printableWidthMm) / 2
  // jsPDF still swaps an explicit [w,h] array to match `orientation` (e.g.
  // 'portrait' forces height >= width even if the array says otherwise),
  // so orientation must be derived from the actual values, not assumed —
  // otherwise a landscape page silently comes out portrait and cropped.
  const jspdfOrientation = widthMm >= heightMm ? 'landscape' : 'portrait'

  const labeledPages = buildLabeledPages(hike, config, t)
  if (config.rectoVerso && labeledPages.length % 2 !== 0) {
    labeledPages.push({ page: null, label: '', withLocator: false, kind: 'blank' })
  }

  const poolSize = Math.min(
    DEFAULT_RENDER_POOL_SIZE,
    Math.max(1, labeledPages.filter((e) => e.page).length),
  )
  const pool = await createRenderPool(basemapId, hike, pois, poolSize)

  try {
    const pdf = new jsPDF({ unit: 'mm', format: [widthMm, heightMm], orientation: jspdfOrientation })

    let completedCount = 0
    let nextToEmit = 0
    const buffered = new Map<number, RenderedPage>()

    function drain() {
      while (buffered.has(nextToEmit)) {
        const { entry, dataUrl } = buffered.get(nextToEmit)!
        buffered.delete(nextToEmit)

        if (nextToEmit > 0) pdf.addPage([widthMm, heightMm], jspdfOrientation)

        if (entry.kind === 'profile') {
          drawElevationProfilePage(pdf, marginMm, printableWidthMm, printableHeightMm, entry.geometry!, t)
        } else if (dataUrl) {
          pdf.addImage(dataUrl, 'JPEG', 0, 0, widthMm, heightMm)
          if (config.foldable && entry.kind === 'overview') {
            drawAccordionFoldGuides(pdf, widthMm, heightMm, marginMm, t)
          }
        }
        // 'blank' entries: nothing to draw, the addPage above is enough.

        nextToEmit++
      }
    }

    await runPool(
      labeledPages,
      pool,
      async (entry, printMap): Promise<RenderedPage> => {
        if (!entry.page) return { entry, dataUrl: null } // 'blank' or 'profile': skip the pool entirely
        const canvas = await renderPageToCanvas(
          printMap,
          {
            widthPx: entry.page.widthPx,
            heightPx: entry.page.heightPx,
            center: entry.page.center,
            resolution: entry.page.resolution,
            rotation: entry.page.rotation,
          },
          {
            dpi: config.dpi,
            info: {
              resolution: entry.page.resolution,
              rotation: entry.page.rotation,
              meanLatitudeDeg: meanLat,
              niveauMeters: config.niveauMeters,
              segmentsTarget: config.segmentsTarget,
              pageLabel: entry.label,
              t,
              locator: entry.withLocator
                ? { hike, distanceStart: entry.page.distanceStart, distanceEnd: entry.page.distanceEnd }
                : undefined,
            },
          },
        )
        return { entry, dataUrl: canvas.toDataURL('image/jpeg', 0.9) }
      },
      (result, index) => {
        buffered.set(index, result)
        completedCount++
        onProgress?.({
          current: completedCount,
          total: labeledPages.length,
          label: result.entry.label || t('preview.blankPageLabel'),
        })
        drain()
      },
    )

    return pdf.output('blob')
  } finally {
    disposeRenderPool(pool)
  }
}
