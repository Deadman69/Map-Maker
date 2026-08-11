import type { HiddenPrintMap } from '../map/HiddenPrintMap'
import { drawPageOverlays, type PageOverlayInfo } from './overlays'

export interface PageViewSpec {
  widthPx: number
  heightPx: number
  center: [number, number]
  resolution: number
  rotation: number
}

/**
 * Renders one page's view on the given hidden map, then composites every
 * `.ol-layer` canvas onto a single destination canvas of exact page pixel
 * size — adapted from OpenLayers' official "export-pdf" example. A naive
 * single-canvas grab misses each layer's own CSS transform (pan/zoom offset
 * applied between the layer's internal render and the current view) and
 * opacity, so each layer canvas is composited individually using its own
 * transform matrix.
 */
export async function renderPageToCanvas(
  printMap: HiddenPrintMap,
  view: PageViewSpec,
  overlay?: { dpi: number; info: PageOverlayInfo },
): Promise<HTMLCanvasElement> {
  await printMap.renderView(view)

  const destination = document.createElement('canvas')
  destination.width = view.widthPx
  destination.height = view.heightPx
  const ctx = destination.getContext('2d')!

  const mapElement = printMap.getMap().getTargetElement() as HTMLElement
  const layerCanvases = mapElement.querySelectorAll<HTMLCanvasElement>('.ol-layer canvas')

  layerCanvases.forEach((canvas) => {
    if (canvas.width === 0 || canvas.height === 0) return

    const parent = canvas.parentElement
    const opacityStyle = (parent?.style.opacity || canvas.style.opacity || '').trim()
    ctx.globalAlpha = opacityStyle === '' ? 1 : Number(opacityStyle)

    const transform = canvas.style.transform
    const match = transform.match(/^matrix\(([^)]*)\)$/)
    if (match) {
      const matrixValues = match[1].split(',').map(Number) as [
        number,
        number,
        number,
        number,
        number,
        number,
      ]
      ctx.setTransform(...matrixValues)
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }
    ctx.drawImage(canvas, 0, 0)
  })

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1

  if (overlay) {
    drawPageOverlays(ctx, view.widthPx, view.heightPx, overlay.dpi, overlay.info)
  }

  return destination
}
