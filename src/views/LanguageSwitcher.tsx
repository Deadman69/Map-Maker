import { useTranslation } from '../i18n/LanguageContext'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { lang, setLang } = useTranslation()

  return (
    <div className="language-switcher">
      <button
        type="button"
        className={lang === 'fr' ? 'active' : ''}
        aria-label="Français"
        onClick={() => setLang('fr')}
      >
        🇫🇷
      </button>
      <button
        type="button"
        className={lang === 'en' ? 'active' : ''}
        aria-label="English"
        onClick={() => setLang('en')}
      >
        🇬🇧
      </button>
    </div>
  )
}
