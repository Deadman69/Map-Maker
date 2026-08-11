import { AppProvider, useAppDispatch, useAppState } from './state/AppContext'
import { LanguageProvider, useTranslation } from './i18n/LanguageContext'
import UploadView from './views/UploadView'
import MapEditorView from './views/MapEditorView'
import ExportConfigView from './views/ExportConfigView'
import PreviewGenerateView from './views/PreviewGenerateView'
import ResumeSessionPrompt from './views/ResumeSessionPrompt'
import LanguageSwitcher from './views/LanguageSwitcher'
import { clearSavedSession } from './state/persistence'
import type { Step } from './state/types'
import './App.css'

const STEP_KEYS: { id: Step; key: string }[] = [
  { id: 'upload', key: 'nav.step1' },
  { id: 'editor', key: 'nav.step2' },
  { id: 'exportConfig', key: 'nav.step3' },
  { id: 'preview', key: 'nav.step4' },
]

function StepsNav() {
  const state = useAppState()
  const { t } = useTranslation()
  const currentIndex = STEP_KEYS.findIndex((s) => s.id === state.step)
  return (
    <nav className="steps-nav">
      {STEP_KEYS.map((s, i) => (
        <span
          key={s.id}
          className={
            'step-pill' +
            (s.id === state.step ? ' active' : i < currentIndex ? ' done' : '')
          }
        >
          {t(s.key)}
        </span>
      ))}
    </nav>
  )
}

function CurrentView() {
  const state = useAppState()
  switch (state.step) {
    case 'upload':
      return <UploadView />
    case 'editor':
      return <MapEditorView />
    case 'exportConfig':
      return <ExportConfigView />
    case 'preview':
      return <PreviewGenerateView />
  }
}

function NewHikeButton() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  return (
    <button
      className="new-hike-button"
      onClick={() => {
        clearSavedSession()
        dispatch({ type: 'RESET' })
      }}
    >
      {t('nav.newHike')}
    </button>
  )
}

function AppShell() {
  const { t } = useTranslation()
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">{t('app.title')}</span>
        <StepsNav />
        <div className="app-header-actions">
          <NewHikeButton />
          <LanguageSwitcher />
        </div>
      </header>
      <ResumeSessionPrompt />
      <main className="app-main">
        <CurrentView />
      </main>
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </LanguageProvider>
  )
}

export default App
