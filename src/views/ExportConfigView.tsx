import { useMemo } from 'react'
import { useAppDispatch, useAppState } from '../state/AppContext'
import { useTranslation } from '../i18n/LanguageContext'
import type { ExportConfig } from '../state/types'
import { buildLabeledPages } from '../export/buildLabeledPages'
import './PlaceholderView.css'
import './ExportConfigView.css'

const NIVEAU_PRESETS = [20, 50, 100, 200]

export default function ExportConfigView() {
  const dispatch = useAppDispatch()
  const state = useAppState()
  const { t } = useTranslation()
  const config = state.exportConfig
  const hasMultipleEtapes = (state.hike?.etapes.length ?? 0) > 1

  function patch(p: Partial<ExportConfig>) {
    dispatch({ type: 'SET_EXPORT_CONFIG', patch: p })
  }

  // Recomputed on every relevant setting change so the preview can never
  // drift from what generateHikePdf will actually produce — both call the
  // same buildLabeledPages.
  const pageCount = useMemo(() => {
    if (!state.hike) return null
    const labeled = buildLabeledPages(state.hike, config, t)
    const overview = labeled.filter((p) => p.kind === 'overview').length
    const profile = labeled.filter((p) => p.kind === 'profile').length
    const detail = labeled.filter((p) => p.kind === 'detail').length
    let total = labeled.length
    if (config.rectoVerso && total % 2 !== 0) total += 1
    return { total, overview, profile, detail }
  }, [state.hike, config, t])

  return (
    <div className="view export-config-view">
      <div className="export-config-card">
        <h1>{t('exportConfig.title')}</h1>

        <section>
          <h2>{t('exportConfig.paperTitle')}</h2>
          <div className="button-row">
            {(['A4', 'A3'] as const).map((size) => (
              <button
                key={size}
                className={config.paperSize === size ? 'active' : ''}
                onClick={() => patch({ paperSize: size })}
              >
                {size}
              </button>
            ))}
          </div>
          <div className="button-row">
            {(['portrait', 'landscape'] as const).map((o) => (
              <button
                key={o}
                className={config.orientation === o ? 'active' : ''}
                onClick={() => patch({ orientation: o })}
              >
                {o === 'portrait' ? t('exportConfig.portrait') : t('exportConfig.landscape')}
              </button>
            ))}
          </div>
          <p className="field-hint">{t('exportConfig.orientationHint')}</p>
        </section>

        <section>
          <h2>{t('exportConfig.niveauTitle')}</h2>
          <div className="button-row">
            {NIVEAU_PRESETS.map((n) => (
              <button
                key={n}
                className={config.niveauMeters === n ? 'active' : ''}
                onClick={() => patch({ niveauMeters: n })}
              >
                {n} m
              </button>
            ))}
            <label className="custom-niveau">
              {t('exportConfig.custom')}
              <input
                type="number"
                min={5}
                step={5}
                value={config.niveauMeters}
                onChange={(e) => patch({ niveauMeters: Number(e.target.value) || 1 })}
              />
              m
            </label>
          </div>
          <p className="field-hint">
            {t('exportConfig.niveauHint', {
              niveau: config.niveauMeters,
              segments: config.segmentsTarget,
              groundWidth: config.niveauMeters * config.segmentsTarget,
            })}
          </p>
          <label className="field-row">
            {t('exportConfig.segmentsLabel', { n: config.segmentsTarget })}
            <input
              type="range"
              min={8}
              max={16}
              value={config.segmentsTarget}
              onChange={(e) => patch({ segmentsTarget: Number(e.target.value) })}
            />
          </label>
          <p className="field-hint">{t('exportConfig.segmentsHint')}</p>
          <label className="field-row">
            {t('exportConfig.overlapLabel', { percent: Math.round(config.overlapPercent * 100) })}
            <input
              type="range"
              min={0}
              max={30}
              value={Math.round(config.overlapPercent * 100)}
              onChange={(e) => patch({ overlapPercent: Number(e.target.value) / 100 })}
            />
          </label>
          <p className="field-hint">{t('exportConfig.overlapHint')}</p>
        </section>

        <section>
          <h2>{t('exportConfig.orientationModeTitle')}</h2>
          <div className="button-row">
            <button
              className={config.orientationMode === 'followRoute' ? 'active' : ''}
              onClick={() => patch({ orientationMode: 'followRoute' })}
            >
              {t('exportConfig.orientationFollow')}
            </button>
            <button
              className={config.orientationMode === 'northUp' ? 'active' : ''}
              onClick={() => patch({ orientationMode: 'northUp' })}
            >
              {t('exportConfig.orientationNorthUp')}
            </button>
          </div>
          <p className="field-hint">{t('exportConfig.orientationModeHint')}</p>
        </section>

        {hasMultipleEtapes && (
          <section>
            <h2>{t('exportConfig.scopeTitle')}</h2>
            <div className="button-row">
              <button
                className={config.scope === 'wholeRoute' ? 'active' : ''}
                onClick={() => patch({ scope: 'wholeRoute' })}
              >
                {t('exportConfig.scopeWhole')}
              </button>
              <button
                className={config.scope === 'perEtape' ? 'active' : ''}
                onClick={() => patch({ scope: 'perEtape' })}
              >
                {t('exportConfig.scopePerEtape')}
              </button>
            </div>
            <p className="field-hint">{t('exportConfig.scopeHint')}</p>
          </section>
        )}

        <section>
          <h2>{t('exportConfig.printTitle')}</h2>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={config.rectoVerso}
              onChange={(e) => patch({ rectoVerso: e.target.checked })}
            />
            {t('exportConfig.rectoVerso')}
          </label>
          <p className="field-hint">{t('exportConfig.rectoVersoHint')}</p>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={config.foldable}
              onChange={(e) => patch({ foldable: e.target.checked })}
            />
            {t('exportConfig.foldable')}
          </label>
          <p className="field-hint">{t('exportConfig.foldableHint')}</p>
          <div className="button-row">
            {[150, 300].map((dpi) => (
              <button key={dpi} className={config.dpi === dpi ? 'active' : ''} onClick={() => patch({ dpi })}>
                {dpi === 150 ? t('exportConfig.dpiPreview') : t('exportConfig.dpiQuality')}
              </button>
            ))}
          </div>
          <p className="field-hint">{t('exportConfig.dpiHint')}</p>
        </section>

        {pageCount && (
          <p className="page-count-preview">
            {t('exportConfig.pageCountPreview', {
              total: pageCount.total,
              overview: pageCount.overview,
              profile: pageCount.profile,
              detail: pageCount.detail,
            })}
          </p>
        )}

        <div className="placeholder-actions">
          <button onClick={() => dispatch({ type: 'SET_STEP', step: 'editor' })}>{t('exportConfig.back')}</button>
          <button
            className="primary"
            disabled={!state.hike}
            onClick={() => dispatch({ type: 'SET_STEP', step: 'preview' })}
          >
            {t('exportConfig.continue')}
          </button>
        </div>
      </div>
    </div>
  )
}
