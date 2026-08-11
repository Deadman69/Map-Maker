import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import type BaseLayer from 'ol/layer/Base'
import type { BasemapConfig } from '../state/types'
import { createIgnWmtsLayerSafe } from './ignWmts'

/**
 * Config-driven basemap list — adding/removing a basemap should only require
 * editing this array. IGN layers go through the Géoplateforme WMTS (free,
 * no personal key) except SCAN25/100/OACI, which use IGN's shared
 * *transitional* key `ign_scan_ws` — flagged as such and never the default.
 */
export const BASEMAPS: BasemapConfig[] = [
  {
    id: 'ign-plan-v2',
    label: 'IGN — Plan v2',
    type: 'wmts',
    wmtsLayer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
    wmtsFormat: 'image/png',
    attribution: 'IGN-F/Géoportail',
  },
  {
    id: 'ign-ortho',
    label: 'IGN — Orthophoto',
    type: 'wmts',
    wmtsLayer: 'ORTHOIMAGERY.ORTHOPHOTOS',
    wmtsFormat: 'image/jpeg',
    attribution: 'IGN-F/Géoportail',
  },
  {
    id: 'ign-scan25',
    label: 'IGN — SCAN 25 (clé transitoire)',
    type: 'wmts',
    wmtsLayer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
    wmtsFormat: 'image/jpeg',
    attribution: 'IGN-F/Géoportail',
    requiresKey: true,
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    type: 'osm',
    attribution: '© OpenStreetMap contributors',
  },
  {
    id: 'opentopomap',
    label: 'OpenTopoMap',
    type: 'xyz',
    url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)',
  },
]

export async function createBasemapLayer(config: BasemapConfig): Promise<BaseLayer> {
  switch (config.type) {
    case 'osm':
      return new TileLayer({ source: new OSM() })
    case 'xyz':
      return new TileLayer({
        source: new XYZ({
          url: config.url,
          attributions: config.attribution,
          // required for canvas.toDataURL()/toBlob() during PDF export to
          // not throw "tainted canvas" — the tile server does send the
          // matching Access-Control-Allow-Origin header, so this is safe.
          crossOrigin: 'anonymous',
        }),
      })
    case 'wmts': {
      if (!config.wmtsLayer) {
        throw new Error(`Basemap "${config.id}" est de type wmts mais n'a pas de wmtsLayer.`)
      }
      const source = await createIgnWmtsLayerSafe(config.wmtsLayer, {
        private: config.requiresKey,
        format: config.wmtsFormat,
      })
      if (config.attribution && source.getAttributions() === null) {
        source.setAttributions(config.attribution)
      }
      return new TileLayer({ source })
    }
  }
}

export function findBasemap(id: string): BasemapConfig {
  const found = BASEMAPS.find((b) => b.id === id)
  if (!found) throw new Error(`Fond de carte inconnu: ${id}`)
  return found
}
