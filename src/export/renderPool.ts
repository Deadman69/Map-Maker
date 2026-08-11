import type { Hike, PointOfInterest } from '../state/types'
import { HiddenPrintMap } from '../map/HiddenPrintMap'

export const DEFAULT_RENDER_POOL_SIZE = 4

/**
 * Creates `size` independent HiddenPrintMap instances sharing the same
 * basemap + track, so up to `size` pages can render (and fetch tiles)
 * concurrently. The first instance is awaited alone before the rest are
 * created in parallel: HiddenPrintMap.create() -> createBasemapLayer() ->
 * createIgnWmtsLayerSafe() hits a GetCapabilities fetch that's cached in
 * localStorage — awaiting one instance first warms that cache so the
 * remaining instances don't race each other into duplicate fetches on a
 * cold cache.
 */
export async function createRenderPool(
  basemapId: string,
  hike: Hike,
  pois: PointOfInterest[],
  size: number,
): Promise<HiddenPrintMap[]> {
  const first = await HiddenPrintMap.create(basemapId, hike, pois)
  if (size <= 1) return [first]
  const rest = await Promise.all(
    Array.from({ length: size - 1 }, () => HiddenPrintMap.create(basemapId, hike, pois)),
  )
  return [first, ...rest]
}

export function disposeRenderPool(pool: HiddenPrintMap[]): void {
  pool.forEach((p) => p.dispose())
}

/**
 * Runs `worker` over `items` with bounded concurrency = pool.length. Each
 * pool instance acts as a serial "lane": as soon as it finishes an item it
 * grabs the next undispatched index (a plain incrementing counter — safe
 * without locks since JS only interleaves between `await`s), so completion
 * order need not match input order. `onResult` fires as each item
 * completes, carrying its original index, for callers that need to react to
 * out-of-order completions (e.g. draining into a strictly-ordered document).
 */
export async function runPool<T, R>(
  items: T[],
  pool: HiddenPrintMap[],
  worker: (item: T, printMap: HiddenPrintMap, itemIndex: number) => Promise<R>,
  onResult?: (result: R, itemIndex: number) => void,
): Promise<R[]> {
  let nextIndex = 0
  const results: R[] = new Array(items.length)

  async function lane(printMap: HiddenPrintMap): Promise<void> {
    for (;;) {
      const i = nextIndex++
      if (i >= items.length) return
      const result = await worker(items[i], printMap, i)
      results[i] = result
      onResult?.(result, i)
    }
  }

  await Promise.all(pool.map(lane))
  return results
}
