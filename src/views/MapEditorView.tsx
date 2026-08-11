import { useEffect, useState } from 'react'
import MapView from '../map/MapView'
import { BASEMAPS } from '../map/basemaps'
import { useAppDispatch, useAppState } from '../state/AppContext'
import { useTranslation } from '../i18n/LanguageContext'
import type { Etape, Hike, PoiType } from '../state/types'
import type { Translator } from '../i18n/types'
import { computeElevationGainLoss, computeEtapeElevation } from '../gpx/elevation'
import ElevationProfileChart from './ElevationProfileChart'
import './MapEditorView.css'

const POI_TYPES: PoiType[] = ['waterPoint', 'shelter', 'viewpoint', 'campsite', 'trailhead', 'danger', 'namedPoint']

export default function MapEditorView() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const { t, lang } = useTranslation()
  const hike = state.hike
  const hikeSource = state.hikeSource
  const canReorder = hikeSource?.mode === 'multi' && (hike?.baseEtapes.length ?? 0) > 1
  const hasExtraSplits = (hikeSource?.extraSplits.length ?? 0) > 0
  const [showProfile, setShowProfile] = useState(false)
  const [placingType, setPlacingType] = useState<PoiType | null>(null)

  useEffect(() => {
    if (!placingType) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setPlacingType(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [placingType])

  function moveTrack(index: number, direction: -1 | 1) {
    if (!hike) return
    const ids = hike.baseEtapes.map((b) => b.id)
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    dispatch({ type: 'REORDER_BASE_ETAPES', trackIds: ids })
  }

  return (
    <div className="view editor-view">
      <aside className="editor-sidebar">
        <h2>{t('editor.basemapTitle')}</h2>
        <div className="basemap-list">
          {BASEMAPS.map((b) => (
            <button
              key={b.id}
              className={b.id === state.basemapId ? 'active' : ''}
              onClick={() => dispatch({ type: 'SET_BASEMAP', basemapId: b.id })}
            >
              {b.label}
            </button>
          ))}
        </div>

        <h2>{t('editor.daysTitle')}</h2>
        {canReorder ? (
          <ul className="base-etape-list">
            {hike?.baseEtapes.map((base, i) => (
              <BaseEtapeRow
                key={base.id}
                base={base}
                t={t}
                onRename={(name) => dispatch({ type: 'RENAME_BASE_ETAPE', trackId: base.id, name })}
                onMoveUp={i > 0 ? () => moveTrack(i, -1) : undefined}
                onMoveDown={i < (hike?.baseEtapes.length ?? 0) - 1 ? () => moveTrack(i, 1) : undefined}
              />
            ))}
          </ul>
        ) : (
          <>
            <ul className="base-etape-list">
              {hike?.baseEtapes.map((base) => (
                <BaseEtapeRow
                  key={base.id}
                  base={base}
                  t={t}
                  onRename={(name) => dispatch({ type: 'RENAME_BASE_ETAPE', trackId: base.id, name })}
                />
              ))}
            </ul>
            {hikeSource?.mode === 'single' && <p className="split-hint">{t('editor.singleModeHint')}</p>}
          </>
        )}

        <h2>{t('editor.etapesTitle')}</h2>
        <p className="split-hint">{t('editor.splitHint')}</p>
        <ul className="etape-list">
          {hike?.etapes.map((etape) => (
            <li key={etape.id}>
              <div className="etape-row-main">
                <strong>{etape.name}</strong>
                <span>{formatKm(etape.endDistance - etape.startDistance, lang)}</span>
              </div>
              <ElevationBadge hike={hike} etape={etape} t={t} />
            </li>
          ))}
        </ul>
        <button
          className="reset-splits-button"
          disabled={!hasExtraSplits}
          onClick={() => dispatch({ type: 'RESET_SPLITS' })}
        >
          {t('editor.resetSplits')}
        </button>

        {hike && <WholeHikeElevation hike={hike} t={t} />}
        {hike && (
          <button className="toggle-profile-button" onClick={() => setShowProfile((v) => !v)}>
            {showProfile ? t('editor.toggleProfileHide') : t('editor.toggleProfileShow')}
          </button>
        )}

        <h2>{t('editor.poi.title')}</h2>
        <div className="poi-type-list">
          {POI_TYPES.map((poiType) => (
            <button
              key={poiType}
              className={placingType === poiType ? 'active' : ''}
              disabled={!hike}
              onClick={() => setPlacingType((current) => (current === poiType ? null : poiType))}
            >
              {t(`editor.poi.${poiType}`)}
            </button>
          ))}
        </div>
        {placingType && (
          <p className="split-hint">
            {t('editor.poi.placingHint')}{' '}
            <button type="button" className="poi-cancel-placement" onClick={() => setPlacingType(null)}>
              {t('editor.poi.cancelPlacement')}
            </button>
          </p>
        )}

        <button
          className="continue-button"
          disabled={!hike}
          onClick={() => dispatch({ type: 'SET_STEP', step: 'exportConfig' })}
        >
          {t('editor.continueToExport')}
        </button>
      </aside>
      <div className="editor-map">
        <MapView placingType={placingType} onPlaced={() => setPlacingType(null)} />
        {showProfile && hike && <ElevationProfileChart hike={hike} />}
      </div>
    </div>
  )
}

function BaseEtapeRow({
  base,
  onRename,
  onMoveUp,
  onMoveDown,
  t,
}: {
  base: Etape
  onRename: (name: string) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  t: Translator['t']
}) {
  const [name, setName] = useState(base.name)

  function commit() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== base.name) onRename(trimmed)
    else setName(base.name)
  }

  return (
    <li className="base-etape-row">
      <input
        className="base-etape-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
        }}
      />
      {(onMoveUp || onMoveDown) && (
        <div className="reorder-buttons">
          <button type="button" aria-label={t('editor.moveUp')} disabled={!onMoveUp} onClick={onMoveUp}>
            ↑
          </button>
          <button type="button" aria-label={t('editor.moveDown')} disabled={!onMoveDown} onClick={onMoveDown}>
            ↓
          </button>
        </div>
      )}
    </li>
  )
}

function formatKm(meters: number, lang: 'fr' | 'en'): string {
  const km = (meters / 1000).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return `${km} km`
}

function ElevationBadge({ hike, etape, t }: { hike: Hike; etape: Etape; t: Translator['t'] }) {
  const stats = computeEtapeElevation(hike, etape)
  if (!stats.hasElevation) return null
  return (
    <span className="elevation-badge">
      {t('common.elevationBadge', { gain: Math.round(stats.gain), loss: Math.round(stats.loss) })}
    </span>
  )
}

function WholeHikeElevation({ hike, t }: { hike: Hike; t: Translator['t'] }) {
  const stats = computeElevationGainLoss(hike.points)
  if (!stats.hasElevation) return null
  return (
    <p className="whole-hike-elevation">
      {t('common.elevationSummary', { gain: Math.round(stats.gain), loss: Math.round(stats.loss) })}
    </p>
  )
}
