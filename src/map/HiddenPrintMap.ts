import Map from 'ol/Map'
import View from 'ol/View'
import type BaseLayer from 'ol/layer/Base'
import type VectorLayer from 'ol/layer/Vector'
import type VectorSource from 'ol/source/Vector'
import { createBasemapLayer, findBasemap } from './basemaps'
import { createTrackLayer } from './layers/trackLayer'
import { createPoiLayer } from './layers/poiLayer'
import type { Hike, PointOfInterest } from '../state/types'

/**
 * An off-screen OL map used only for high-resolution print capture. It is
 * genuinely laid out (not display:none) so OL can compute real pixel sizes
 * and rasterize tiles at full print resolution, just positioned far outside
 * the viewport so it's invisible to the user. Reused across pages — callers
 * just change size/view between renders — to avoid re-creating a WebGL/2D
 * context and re-fetching the basemap layer for every single page.
 */
export class HiddenPrintMap {
  private container: HTMLDivElement
  private map: Map
  private trackLayer: VectorLayer<VectorSource> | null = null

  private constructor(map: Map, container: HTMLDivElement) {
    this.map = map
    this.container = container
  }

  static async create(basemapId: string, hike: Hike, pois: PointOfInterest[]): Promise<HiddenPrintMap> {
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-99999px'
    container.style.top = '0'
    document.body.appendChild(container)

    const map = new Map({ target: container, view: new View({ center: [0, 0], zoom: 0 }) })

    const instance = new HiddenPrintMap(map, container)
    const basemapLayer = await createBasemapLayer(findBasemap(basemapId))
    map.addLayer(basemapLayer)

    const trackLayer = createTrackLayer(hike)
    instance.trackLayer = trackLayer
    map.addLayer(trackLayer)

    map.addLayer(createPoiLayer(pois))

    return instance
  }

  getMap(): Map {
    return this.map
  }

  getLayers(): BaseLayer[] {
    return this.map.getLayers().getArray()
  }

  getTrackLayer(): VectorLayer<VectorSource> | null {
    return this.trackLayer
  }

  /**
   * Sets the pixel size + view for one page and waits for a fully rendered
   * frame (rendercomplete fires once all tiles for this view are loaded).
   */
  async renderView(options: {
    widthPx: number
    heightPx: number
    center: [number, number]
    resolution: number
    rotation: number
  }): Promise<void> {
    const { widthPx, heightPx, center, resolution, rotation } = options
    this.container.style.width = `${widthPx}px`
    this.container.style.height = `${heightPx}px`
    this.map.updateSize()

    const view = this.map.getView()
    view.setCenter(center)
    view.setResolution(resolution)
    view.setRotation(rotation)

    await new Promise<void>((resolve) => {
      this.map.once('rendercomplete', () => {
        clearInterval(pumpTimer)
        resolve()
      })
      // Backstop: OL's own re-render (which picks up newly-loaded tiles and
      // eventually fires rendercomplete) is scheduled via requestAnimationFrame,
      // which browsers throttle or skip entirely for backgrounded/inactive
      // tabs and never fires at all in some headless/automated contexts. This
      // timer forces progress either way; it's a no-op once rendercomplete
      // has already fired since the interval is cleared immediately after.
      const pumpTimer = setInterval(() => {
        try {
          this.map.renderSync()
        } catch {
          /* ignore */
        }
      }, 50)
      // renderSync() must run after the listener is registered: it can
      // resolve synchronously (e.g. tiles already cached), and once() would
      // miss an emission that happened before it was attached.
      this.map.renderSync()
    })
  }

  dispose(): void {
    this.map.setTarget(undefined)
    this.container.remove()
  }
}
