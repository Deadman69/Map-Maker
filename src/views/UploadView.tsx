import { useState } from 'react'
import { useAppDispatch } from '../state/AppContext'
import { useTranslation } from '../i18n/LanguageContext'
import { parseGpx } from '../gpx/parseGpx'
import { sourceTracksFromMultiple, sourceTracksFromSingle } from '../gpx/splitRoute'
import { clearSavedSession } from '../state/persistence'
import './UploadView.css'

type Mode = 'single' | 'multi'

export default function UploadView() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>('single')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setLoading(true)
    try {
      clearSavedSession() // a fresh import invalidates any previously saved session
      const fileArray = Array.from(files)
      if (mode === 'single') {
        const text = await fileArray[0].text()
        const points = parseGpx(text)
        dispatch({
          type: 'LOAD_HIKE_SOURCE',
          hikeSource: { mode: 'single', tracks: sourceTracksFromSingle(points), extraSplits: [] },
        })
      } else {
        const tracks = await Promise.all(
          fileArray.map(async (file) => ({
            name: baseName(file.name),
            points: parseGpx(await file.text()),
          })),
        )
        dispatch({
          type: 'LOAD_HIKE_SOURCE',
          hikeSource: { mode: 'multi', tracks: sourceTracksFromMultiple(tracks), extraSplits: [] },
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('upload.error.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="view upload-view">
      <div className="upload-page">
        <h1>{t('upload.title')}</h1>

        <div className="intro-block">
          <p className="intro-free">{t('upload.intro.free')}</p>
          <p>{t('upload.intro.what')}</p>
          <ol className="intro-steps">
            <li>{t('upload.intro.step1')}</li>
            <li>{t('upload.intro.step2')}</li>
            <li>{t('upload.intro.step3')}</li>
            <li>{t('upload.intro.step4')}</li>
          </ol>
          <p className="intro-privacy">
            <strong>{t('upload.intro.privacyTitle')}</strong> — {t('upload.intro.privacyBody')}
          </p>
        </div>

        <div className="upload-card">
          <p className="upload-hint">{t('upload.hint')}</p>

          <div className="mode-toggle">
            <button className={mode === 'single' ? 'active' : ''} onClick={() => setMode('single')}>
              {t('upload.mode.single.label')}
              <small>{t('upload.mode.single.hint')}</small>
            </button>
            <button className={mode === 'multi' ? 'active' : ''} onClick={() => setMode('multi')}>
              {t('upload.mode.multi.label')}
              <small>{t('upload.mode.multi.hint')}</small>
            </button>
          </div>

          <label className="dropzone">
            <input
              type="file"
              accept=".gpx"
              multiple={mode === 'multi'}
              onChange={(e) => handleFiles(e.target.files)}
            />
            {loading ? t('upload.dropzone.loading') : t('upload.dropzone.idle')}
          </label>

          {error && <p className="upload-error">{error}</p>}
        </div>
      </div>
    </div>
  )
}

function baseName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '')
}
