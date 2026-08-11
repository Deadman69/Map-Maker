export type Step = 'upload' | 'editor' | 'exportConfig' | 'preview'

export interface TrackPoint {
  lon: number
  lat: number
  ele?: number
}

export interface Etape {
  id: string
  name: string
  /** distance in meters from the start of the merged route */
  startDistance: number
  endDistance: number
}

/** 'single': one continuous GPX track, split manually by clicking on the map.
 *  'multi': one source track per imported day — reorderable, each independently named. */
export type HikeMode = 'single' | 'multi'

export interface SourceTrack {
  id: string
  name: string
  points: TrackPoint[]
}

/** A manual click-split, stored as an offset from the *start of its own
 * source track* rather than an absolute route distance — so it stays
 * attached to the right track (and the right physical spot on it) even
 * after the tracks get reordered. */
export interface ExtraSplit {
  trackId: string
  offset: number
}

/** The persisted/authoritative source of a hike: source tracks (in display
 * order) + any manual click-splits layered on top. `Hike` below is always
 * re-derived from this — never edited directly. */
export interface HikeSource {
  mode: HikeMode
  tracks: SourceTrack[]
  extraSplits: ExtraSplit[]
}

export interface Hike {
  /** ordered points of the merged route, in EPSG:4326 (lon/lat) */
  points: TrackPoint[]
  /** cumulative distance in meters, same length as points, points[0] => 0 */
  cumulativeDistances: number[]
  /** final, derived list — base étapes subdivided by any extraSplits inside them */
  etapes: Etape[]
  /** named/orderable boundaries (one per source track) — rename/reorder operate on this */
  baseEtapes: Etape[]
}

export type BasemapType = 'osm' | 'xyz' | 'wmts'

export interface BasemapConfig {
  id: string
  label: string
  type: BasemapType
  /** for xyz: url template */
  url?: string
  /** for wmts: the ows:Identifier of the IGN layer */
  wmtsLayer?: string
  wmtsFormat?: string
  attribution?: string
  /** true for layers behind IGN's shared transitional SCAN key */
  requiresKey?: boolean
}

export type ExportScope = 'wholeRoute' | 'perEtape'
export type PaperSize = 'A4' | 'A3'
export type Orientation = 'portrait' | 'landscape'
/** 'followRoute': each detail page rotates so the trail runs left-to-right
 *  (default, existing behaviour). 'northUp': no rotation, north always up. */
export type OrientationMode = 'followRoute' | 'northUp'

export interface ExportConfig {
  paperSize: PaperSize
  orientation: Orientation
  /** length in meters of one scale-bar segment */
  niveauMeters: number
  /** target number of scale-bar segments spanning the printable page width */
  segmentsTarget: number
  /** fraction (0-1) of page ground-width to overlap between consecutive detail pages */
  overlapPercent: number
  scope: ExportScope
  rectoVerso: boolean
  foldable: boolean
  dpi: number
  orientationMode: OrientationMode
}

export type PoiType =
  | 'waterPoint'
  | 'shelter'
  | 'viewpoint'
  | 'campsite'
  | 'trailhead'
  | 'danger'
  | 'namedPoint'

/** A manually-placed point of interest. Absolute lon/lat, independent of
 * HikeSource — a POI is a place, not a position relative to the track, so
 * it isn't affected by reordering/splitting the route. */
export interface PointOfInterest {
  id: string
  type: PoiType
  lon: number
  lat: number
  label?: string
}

export interface AppState {
  step: Step
  /** source of truth for the current hike — persisted to localStorage */
  hikeSource: HikeSource | null
  /** derived from hikeSource; never set directly outside the reducer */
  hike: Hike | null
  basemapId: string
  exportConfig: ExportConfig
  pois: PointOfInterest[]
}
