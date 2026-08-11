import { useState } from 'react'
import { useAppDispatch } from '../state/AppContext'
import { useTranslation } from '../i18n/LanguageContext'
import { clearSavedSession, loadSavedSession } from '../state/persistence'
import './ResumeSessionPrompt.css'

export default function ResumeSessionPrompt() {
  const dispatch = useAppDispatch()
  const { t, lang } = useTranslation()
  const [session, setSession] = useState(() => loadSavedSession())

  if (!session) return null

  const savedAtLabel = new Date(session.savedAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className="resume-session-banner">
      <span>{t('resume.bannerText', { date: savedAtLabel })}</span>
      <div className="resume-session-actions">
        <button
          className="primary"
          onClick={() => {
            dispatch({
              type: 'RESTORE_SESSION',
              hikeSource: session.hikeSource,
              basemapId: session.basemapId,
              exportConfig: session.exportConfig,
              step: session.step,
              pois: session.pois,
            })
            setSession(null)
          }}
        >
          {t('resume.continue')}
        </button>
        <button
          onClick={() => {
            clearSavedSession()
            setSession(null)
          }}
        >
          {t('resume.newHike')}
        </button>
      </div>
    </div>
  )
}
