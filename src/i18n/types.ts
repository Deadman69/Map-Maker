export type Lang = 'fr' | 'en'

export type TranslateVars = Record<string, string | number>

export type Dictionary = Record<string, string | ((vars: TranslateVars) => string)>

export interface Translator {
  lang: Lang
  /** Looks up `key` in the current dictionary. If the value is a function,
   * calls it with `vars`; otherwise returns the string as-is. Every call
   * site uses this same `t(key, vars)` shape whether or not the key needs
   * interpolation, so views never need to know which keys are dynamic. */
  t: (key: string, vars?: TranslateVars) => string
}
