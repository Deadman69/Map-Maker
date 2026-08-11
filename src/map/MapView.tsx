import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Map from 'ol/Map'
import View from 'ol/View'
import type MapBrowserEvent from 'ol/MapBrowserEvent'
import Overlay from 'ol/Overlay'
import Translate from 'ol/interaction/Translate'
import { fromLonLat } from 'ol/proj'
import type VectorSource from 'ol/source/Vector'
import type VectorLayer from 'ol/layer/Vector'
import { boundingBox } from '../gpx/routeStats'
import { createBasemapLayer, findBasemap } from './basemaps'
import { createTrackLayer } from './layers/trackLayer'
import { attachSplitInteraction } from './layers/splitInteraction'
import { createPoiLayer, poiGlyph, POI_ID_FEATURE_KEY, lonLatFromFeatureCoordinate } from './layers/poiLayer'
import { useAppDispatch, useAppState } from '../state/AppContext'
import { useTranslation } from '../i18n/LanguageContext'
import type { PoiType, PointOfInterest } from '../state/types'
import type { Translator } from '../i18n/types'
import 'ol/ol.css'
import './MapView.css'

/** Below this, a translate gesture is treated as a click (select) rather
 * than a drag (move) — real drags cover far more than a fraction of a
 * meter, this only filters out sub-pixel jitter from a plain click. */
const CLICK_VS_DRAG_THRESHOLD_METERS = 1

export default function MapView({
  placingType,
  onPlaced,
}: {
  placingType: PoiType | null
  onPlaced: () => void
}) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  // Created once, outside React's render tree: ol/Overlay reparents whatever
  // element it's given into its own overlay container as soon as it's added
  // to the map, which corrupts React's DOM bookkeeping if the element is
  // also part of React's own returned JSX. Rendering into it via a portal
  // instead lets React manage its *contents* without ever touching its
  // position among siblings, which stays entirely under OL's control.
  const [popupContainer] = useState(() => {
    const el = document.createElement('div')
    el.className = 'poi-popup'
    return el
  })
  const mapRef = useRef<Map | null>(null)
  const overlayRef = useRef<Overlay | null>(null)
  const trackLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const poiLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const [basemapError, setBasemapError] = useState<string | null>(null)
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const map = new Map({
      target: containerRef.current,
      view: new View({ center: fromLonLat([2.5, 46.6]), zoom: 6 }),
    })
    mapRef.current = map
    const overlay = new Overlay({
      element: popupContainer,
      positioning: 'bottom-center',
      offset: [0, -16],
      stopEvent: true,
    })
    overlayRef.current = overlay
    map.addOverlay(overlay)
    ;(window as unknown as { __mmDebugMap?: Map }).__mmDebugMap = map
    return () => {
      map.setTarget(undefined)
    }
  }, [popupContainer])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let cancelled = false
    let insertedLayer: Awaited<ReturnType<typeof createBasemapLayer>> | null = null
    setBasemapError(null)

    createBasemapLayer(findBasemap(state.basemapId))
      .then((layer) => {
        if (cancelled) return
        map.getLayers().insertAt(0, layer)
        insertedLayer = layer
      })
      .catch((err) => {
        console.error('[MapView] Impossible de charger le fond de carte:', err)
        if (!cancelled) setBasemapError(t('map.basemapError'))
      })

    return () => {
      cancelled = true
      if (insertedLayer) map.removeLayer(insertedLayer)
    }
  }, [state.basemapId, t])

  useEffect(() => {
    const map = mapRef.current
    const hike = state.hike
    if (!map || !hike) return

    if (trackLayerRef.current) map.removeLayer(trackLayerRef.current)
    const trackLayer = createTrackLayer(hike)
    trackLayerRef.current = trackLayer
    map.addLayer(trackLayer)

    const bbox = boundingBox(hike.points)
    const extent = [
      ...fromLonLat([bbox.minLon, bbox.minLat]),
      ...fromLonLat([bbox.maxLon, bbox.maxLat]),
    ] as [number, number, number, number]
    map.getView().fit(extent, { padding: [40, 40, 40, 40], maxZoom: 17 })
  }, [state.hike])

  // Split-point clicks are disabled while a POI placement is armed — only
  // one click handler should react to the next click on the map.
  useEffect(() => {
    const map = mapRef.current
    const hike = state.hike
    if (!map || !hike || placingType) return

    const detach = attachSplitInteraction(map, hike, (distance, action) => {
      dispatch(
        action === 'add' ? { type: 'ADD_SPLIT', distance } : { type: 'REMOVE_SPLIT', distance },
      )
    })
    return detach
  }, [state.hike, dispatch, placingType])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !placingType) return
    function handleClick(evt: MapBrowserEvent) {
      const { lon, lat } = lonLatFromFeatureCoordinate(evt.coordinate)
      dispatch({
        type: 'ADD_POI',
        poi: { id: crypto.randomUUID(), type: placingType!, lon, lat },
      })
      onPlaced()
    }
    map.on('click', handleClick)
    return () => map.un('click', handleClick)
  }, [placingType, dispatch, onPlaced])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (poiLayerRef.current) map.removeLayer(poiLayerRef.current)
    const poiLayer = createPoiLayer(state.pois)
    poiLayerRef.current = poiLayer
    map.addLayer(poiLayer)
  }, [state.pois])

  useEffect(() => {
    const map = mapRef.current
    const poiLayer = poiLayerRef.current
    if (!map || !poiLayer) return

    const translate = new Translate({ layers: [poiLayer] })
    let startCoordinate: number[] | null = null

    translate.on('translatestart', (evt) => {
      startCoordinate = evt.coordinate
    })
    translate.on('translateend', (evt) => {
      const id = evt.features.item(0)?.get(POI_ID_FEATURE_KEY) as string | undefined
      if (!id) return
      const movedMeters = startCoordinate
        ? Math.hypot(evt.coordinate[0] - startCoordinate[0], evt.coordinate[1] - startCoordinate[1])
        : 0
      if (movedMeters > CLICK_VS_DRAG_THRESHOLD_METERS) {
        const { lon, lat } = lonLatFromFeatureCoordinate(evt.coordinate)
        dispatch({ type: 'MOVE_POI', id, lon, lat })
      } else {
        setSelectedPoiId(id)
      }
    })

    map.addInteraction(translate)
    return () => {
      map.removeInteraction(translate)
    }
  }, [state.pois, dispatch])

  const selectedPoi = state.pois.find((p) => p.id === selectedPoiId) ?? null

  useEffect(() => {
    overlayRef.current?.setPosition(selectedPoi ? fromLonLat([selectedPoi.lon, selectedPoi.lat]) : undefined)
  }, [selectedPoi])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {basemapError && <div className="basemap-error-banner">{basemapError}</div>}
      {placingType && <div className="poi-placing-banner">{t('editor.poi.placingHint')}</div>}
      {createPortal(
        selectedPoi && (
          <PoiPopupContent
            poi={selectedPoi}
            t={t}
            onRename={(label) => dispatch({ type: 'RENAME_POI', id: selectedPoi.id, label })}
            onDelete={() => {
              dispatch({ type: 'DELETE_POI', id: selectedPoi.id })
              setSelectedPoiId(null)
            }}
            onClose={() => setSelectedPoiId(null)}
          />
        ),
        popupContainer,
      )}
    </div>
  )
}

function PoiPopupContent({
  poi,
  t,
  onRename,
  onDelete,
  onClose,
}: {
  poi: PointOfInterest
  t: Translator['t']
  onRename: (label: string) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [label, setLabel] = useState(poi.label ?? '')

  function commit() {
    if (label !== (poi.label ?? '')) onRename(label)
  }

  return (
    <div className="poi-popup-content">
      <button type="button" className="poi-popup-close" onClick={onClose} aria-label={t('exportConfig.back')}>
        ×
      </button>
      <span className="poi-popup-glyph">{poiGlyph(poi)}</span>
      <input
        className="poi-popup-label"
        value={label}
        maxLength={40}
        placeholder={t('editor.poi.labelPlaceholder')}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
        }}
      />
      <button type="button" className="poi-popup-delete" onClick={onDelete}>
        {t('editor.poi.delete')}
      </button>
    </div>
  )
}
