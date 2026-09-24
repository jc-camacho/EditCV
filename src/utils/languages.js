/**
 * Languages a CV can be written in, picked with `lang` at the top of the YAML
 * (`lang: es`). They control the date labels and how pdfTeX hyphenates the
 * text; everything the user types is printed as is.
 *
 * `hyphenation` is the pattern set baked into the LaTeX format (see
 * scripts/texlive-extra/language.dat); null keeps the format's default, US English.
 */
export const LANGUAGES = {
  en: {
    label:       'English',
    months:      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    present:     'Present',
    hyphenation: null,
    pdfLang:     'en-US',
  },
  es: {
    label:       'Español',
    months:      ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    present:     'Actualidad',
    hyphenation: { patterns: 'spanish', leftMin: 2, rightMin: 2 },
    pdfLang:     'es-419', // Latin American Spanish
  },
}

export const DEFAULT_LANGUAGE = 'en'

/** Key in LANGUAGES for `es`, `ES`, `es-419`, `es_BO`…; anything unknown is English. */
export function languageKey(code) {
  const base = String(code ?? '').toLowerCase().split(/[-_]/)[0]
  return Object.hasOwn(LANGUAGES, base) ? base : DEFAULT_LANGUAGE
}

export const resolveLanguage = code => LANGUAGES[languageKey(code)]

// Words accepted as an end date meaning "ongoing", in any supported language
const PRESENT_WORDS = new Set(['present', 'presente', 'actualidad', 'actual'])
export const isPresent = value => PRESENT_WORDS.has(String(value ?? '').trim().toLowerCase())
