import type Tile from 'ol/Tile'
import TileState from 'ol/TileState'

/** Downscaled to a tiny canvas before sampling — decoding a full-size tile
 * just to check for a uniform black block would be wasteful; a 6x6 average
 * is enough to distinguish "uniformly black" from real cartography. */
const SAMPLE_GRID = 6
const BLACK_CHANNEL_MAX = 18
const BLACK_TILE_MIN_RATIO = 0.95
/** Blob URLs are only needed long enough for the <img> to start loading. */
const BLOB_URL_REVOKE_DELAY_MS = 5000

let sampleCanvas: HTMLCanvasElement | null = null
function sampleContext(): CanvasRenderingContext2D {
  if (!sampleCanvas) {
    sampleCanvas = document.createElement('canvas')
    sampleCanvas.width = SAMPLE_GRID
    sampleCanvas.height = SAMPLE_GRID
  }
  return sampleCanvas.getContext('2d', { willReadFrequently: true })!
}

function isSuspectBlackImageData(data: Uint8ClampedArray): boolean {
  let blackCount = 0
  let opaqueCount = 0
  const pixelCount = data.length / 4
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] <= 200) continue // ignore transparent samples
    opaqueCount++
    if (data[i] <= BLACK_CHANNEL_MAX && data[i + 1] <= BLACK_CHANNEL_MAX && data[i + 2] <= BLACK_CHANNEL_MAX) {
      blackCount++
    }
  }
  if (opaqueCount === 0) return false // fully transparent tile isn't this bug
  return blackCount / pixelCount >= BLACK_TILE_MIN_RATIO
}

function isSuspectBlackTile(bitmap: ImageBitmap): boolean {
  const ctx = sampleContext()
  ctx.clearRect(0, 0, SAMPLE_GRID, SAMPLE_GRID)
  ctx.drawImage(bitmap, 0, 0, SAMPLE_GRID, SAMPLE_GRID)
  return isSuspectBlackImageData(ctx.getImageData(0, 0, SAMPLE_GRID, SAMPLE_GRID).data)
}

/**
 * Wraps OL's default tile loading with a validation pass. IGN's
 * Géoplateforme WMTS can answer a bad request (expired/invalid transitional
 * apikey, unsupported zoom/matrix from the static fallback grid) with
 * HTTP 200 and an opaque black placeholder image — OL's default pipeline
 * has no way to see anything wrong with that, so it paints the black pixels
 * verbatim. This fetches the tile bytes itself, decodes them off the DOM,
 * and rejects a near-uniform black result.
 *
 * Marks a suspect tile ERROR rather than EMPTY: OL's built-in interim-tile
 * backfill (`useInterimTilesOnError`, on by default) then substitutes a
 * cached tile from a nearby zoom level instead of leaving a black square or
 * a transparent hole — usually invisible to the user rather than merely
 * "less bad". A genuine fetch/decode failure also becomes ERROR, matching
 * OL's own documented tileLoadFunction convention (see ImageTile#load()).
 */
export function createBlackTileGuardLoadFunction(): (tile: Tile, src: string) => void {
  return function tileLoadFunction(tile, src) {
    const image = (tile as unknown as { getImage(): HTMLImageElement }).getImage()
    fetch(src, { mode: 'cors', credentials: 'omit' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then(async (blob) => {
        const bitmap = await createImageBitmap(blob)
        const suspect = isSuspectBlackTile(bitmap)
        bitmap.close()
        if (suspect) {
          tile.setState(TileState.ERROR)
          return
        }
        // Blob URLs are same-origin and never taint a canvas export,
        // regardless of the source's crossOrigin setting (already applied
        // by OL to `image` before this function runs) — no interaction with
        // the existing crossOrigin:'anonymous' requirement for PDF export.
        const imageUrl = URL.createObjectURL(blob)
        image.src = imageUrl
        setTimeout(() => URL.revokeObjectURL(imageUrl), BLOB_URL_REVOKE_DELAY_MS)
      })
      .catch(() => {
        tile.setState(TileState.ERROR)
      })
  }
}
