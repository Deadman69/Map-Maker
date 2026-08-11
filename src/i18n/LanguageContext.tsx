import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Lang, Translator, TranslateVars } from './types'
import { fr } from './fr'
import { en } from './en'
import { detectLanguage } from './detectLanguage'
import { loadSavedLanguage, saveLanguage } from './languagePersistence'

const DICTIONARIES = { fr, en }

const LanguageTranslatorContext = createContext<Translator | null>(null)
const SetLanguageContext = createContext<((lang: Lang) => void) | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    () => loadSavedLanguage() ?? detectLanguage(navigator.language),
  )

  useEffect(() => {
    saveLanguage(lang)
    document.documentElement.lang = lang
  }, [lang])

  const translator = useMemo<Translator>(() => {
    const dictionary = DICTIONARIES[lang]
    return {
      lang,
      t: (key: string, vars?: TranslateVars) => {
        const entry = dictionary[key]
        if (entry === undefined) return key
        return typeof entry === 'function' ? entry(vars ?? {}) : entry
      },
    }
  }, [lang])

  return (
    <LanguageTranslatorContext.Provider value={translator}>
      <SetLanguageContext.Provider value={setLang}>{children}</SetLanguageContext.Provider>
    </LanguageTranslatorContext.Provider>
  )
}

export function useTranslation(): Translator & { setLang: (lang: Lang) => void } {
  const translator = useContext(LanguageTranslatorContext)
  const setLang = useContext(SetLanguageContext)
  if (!translator || !setLang) throw new Error('useTranslation must be used within LanguageProvider')
  return { ...translator, setLang }
}
