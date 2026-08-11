import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS'
import type { Options as WMTSOptions } from 'ol/source/WMTS'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { getTopLeft, getWidth } from 'ol/extent'
import { get as getProjection } from 'ol/proj'

const FREE_CAPABILITIES_URL = 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0'
const SCAN_CAPABILITIES_URL =
  'https://data.geopf.fr/private/wmts?apikey=ign_scan_ws&SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0'

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const parser = new WMTSCapabilities()

interface CachedCapabilities {
  fetchedAt: number
  xml: string
}

function cacheKey(url: string): string {
  return `mapmaker:wmts-capabilities:${url}`
}

async function fetchCapabilitiesXml(url: string): Promise<string> {
  const key = cacheKey(url)
  const cachedRaw = localStorage.getItem(key)
  if (cachedRaw) {
    try {
      const cached: CachedCapabilities = JSON.parse(cachedRaw)
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.xml
      }
    } catch {
      // ignore malformed cache entry, refetch below
    }
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`GetCapabilities a échoué (${response.status}) pour ${url}`)
  }
  const xml = await response.text()
  try {
    localStorage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), xml }))
  } catch {
    // localStorage full/unavailable: not fatal, just skip caching
  }
  return xml
}

/**
 * IGN's Géoservices → Géoplateforme migration means exact WMTS layer
 * identifiers should be confirmed against a live GetCapabilities fetch
 * rather than assumed. This throws a clear error (rather than silently
 * falling back) when a requested identifier isn't present, so callers can
 * decide whether to fall back to a static config or another basemap.
 */
export async function createIgnWmtsLayer(
  layerIdentifier: string,
  options: { private?: boolean; format?: string } = {},
): Promise<WMTS> {
  const capabilitiesUrl = options.private ? SCAN_CAPABILITIES_URL : FREE_CAPABILITIES_URL
  const xml = await fetchCapabilitiesXml(capabilitiesUrl)
  const capabilities = parser.read(xml)

  const layerExists = (capabilities?.Contents?.Layer ?? []).some(
    (layer: { Identifier?: string }) => layer.Identifier === layerIdentifier,
  )
  if (!layerExists) {
    throw new Error(
      `La couche WMTS "${layerIdentifier}" n'existe pas dans les capacités IGN actuelles.`,
    )
  }

  // No matrixSet is passed: IGN layers on data.geopf.fr each expose a single
  // Web-Mercator TileMatrixSetLink (named e.g. "PM_0_19", "PM_0_21"...) and OL
  // auto-selects it when there's only one link, so hardcoding a name here
  // would be both unnecessary and liable to break as those names vary by layer.
  const sourceOptions = optionsFromCapabilities(capabilities, {
    layer: layerIdentifier,
    format: options.format,
  }) as WMTSOptions | null

  if (!sourceOptions) {
    throw new Error(`Impossible de construire la source WMTS pour "${layerIdentifier}".`)
  }

  if (options.private) {
    sourceOptions.urls = sourceOptions.urls?.map((u) =>
      u.includes('apikey=') ? u : `${u}${u.includes('?') ? '&' : '?'}apikey=ign_scan_ws`,
    )
  }

  // Required for canvas.toDataURL()/toBlob() during PDF export to not throw
  // "tainted canvas" — data.geopf.fr sends a matching
  // Access-Control-Allow-Origin header, so this is safe.
  sourceOptions.crossOrigin = 'anonymous'

  return new WMTS(sourceOptions)
}

/**
 * Static fallback used when GetCapabilities can't be fetched/parsed (e.g.
 * offline, endpoint change). Builds the standard Web Mercator "PM" WMTS grid
 * (21 zoom levels, 256px tiles) that data.geopf.fr layers conventionally use,
 * and points the WMTS source's URL template directly at the KVP endpoint.
 */
function createIgnWmtsLayerStatic(
  layerIdentifier: string,
  options: { private?: boolean; format?: string } = {},
): WMTS {
  const projection = getProjection('EPSG:3857')!
  const projectionExtent = projection.getExtent()
  const size = getWidth(projectionExtent) / 256
  const resolutions = new Array(21)
  const matrixIds = new Array(21)
  for (let z = 0; z < 21; z++) {
    resolutions[z] = size / Math.pow(2, z)
    matrixIds[z] = String(z)
  }

  const base = options.private ? SCAN_CAPABILITIES_URL.split('?')[0] : FREE_CAPABILITIES_URL.split('?')[0]
  const apikeyParam = options.private ? '&apikey=ign_scan_ws' : ''

  return new WMTS({
    url: `${base}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0${apikeyParam}`,
    layer: layerIdentifier,
    matrixSet: 'PM',
    format: options.format ?? 'image/png',
    projection,
    tileGrid: new WMTSTileGrid({
      origin: getTopLeft(projectionExtent),
      resolutions,
      matrixIds,
    }),
    style: 'normal',
    crossOrigin: 'anonymous',
  })
}

/**
 * Tries the capabilities-driven construction first (accurate, self-updating);
 * falls back to the static grid if that fails for any reason, logging a
 * warning so a broken IGN endpoint is visible without crashing the app.
 */
export async function createIgnWmtsLayerSafe(
  layerIdentifier: string,
  options: { private?: boolean; format?: string } = {},
): Promise<WMTS> {
  try {
    return await createIgnWmtsLayer(layerIdentifier, options)
  } catch (err) {
    console.warn(
      `[ignWmts] Repli sur la config statique pour "${layerIdentifier}":`,
      err,
    )
    return createIgnWmtsLayerStatic(layerIdentifier, options)
  }
}
