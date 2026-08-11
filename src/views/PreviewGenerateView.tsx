import { useState } from 'react'
import { useAppDispatch, useAppState } from '../state/AppContext'
import { useTranslation } from '../i18n/LanguageContext'
import { generateHikePdf, type GeneratePdfProgress } from '../export/pdfAssembly'
import { downloadBlob } from '../utils/download'
import './PlaceholderView.css'
import './PreviewGenerateView.css'

export default function PreviewGenerateView() {
  const dispatch = useAppDispatch()
  const state = useAppState()
  const { t } = useTranslation()
  const [progress, setProgress] = useState<GeneratePdfProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleGenerate() {
    if (!state.hike) return
    setError(null)
    setDone(false)
    setProgress({ current: 0, total: 1, label: t('preview.preparing') })
    try {
      const blob = await generateHikePdf(
        state.hike,
        state.pois,
        state.basemapId,
        state.exportConfig,
        t,
        setProgress,
      )
      downloadBlob(blob, 'randonnee-pack.pdf')
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('preview.errorGeneric'))
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="view placeholder-view">
      <h1>{t('preview.title')}</h1>
      <p>{t('preview.description')}</p>

      <button className="generate-button" disabled={!state.hike || !!progress} onClick={handleGenerate}>
        {progress ? t('preview.generating', { current: progress.current, total: progress.total }) : t('preview.generate')}
      </button>

      {progress && <p className="generate-status">{progress.label}</p>}
      {done && !progress && <p className="generate-success">{t('preview.success')}</p>}
      {error && <p className="upload-error">{error}</p>}

      <div className="placeholder-actions">
        <button onClick={() => dispatch({ type: 'SET_STEP', step: 'exportConfig' })}>{t('preview.back')}</button>
      </div>
    </div>
  )
}
