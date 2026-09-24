import { detectEntryType, formatDateRange, formatSectionTitle } from '../utils/yamlParser'
import { TEMPLATES, DEFAULT_TEMPLATE } from './templates'
import { escapeLatex, latexLink, mdToLatex } from './escape'
import { resolveLanguage } from '../utils/languages'

/**
 * Turns the parsed CV object into a complete, self-contained .tex document.
 *
 * The generator only emits content through the macro interface documented in
 * latex/templates/base.js; every visual decision lives in the template
 * preamble. The resulting file compiles with plain pdfLaTeX (e.g. Overleaf).
 */
export function generateLatex(cv, templateId = DEFAULT_TEMPLATE) {
  const template = TEMPLATES[templateId] ?? TEMPLATES[DEFAULT_TEMPLATE]
  const language = resolveLanguage(cv?.lang)
  const context  = { dateFormat: template.dateFormat, language }

  const sections = Object.entries(cv?.sections || {})
    .map(([title, entries]) => renderSection(title, entries, context))
    .filter(Boolean)

  const name = escapeLatex(cv?.name)

  return [
    template.preamble,
    `\\hypersetup{pdftitle={${name}},pdfauthor={${name}},pdflang={${language.pdfLang}}}`,
    '',
    '\\begin{document}',
    hyphenation(language),
    '',
    renderHeader(cv || {}),
    '',
    sections.join('\n\n'),
    '',
    '\\end{document}',
    '',
  ].join('\n')
}

/**
 * Switches pdfTeX to the language's hyphenation patterns. Guarded, so the .tex
 * still compiles (with the default patterns) on a TeX without them.
 */
function hyphenation({ hyphenation: h }) {
  if (!h) return ''
  return `\\ifcsname l@${h.patterns}\\endcsname\\language=\\csname l@${h.patterns}\\endcsname\\fi` +
    `\\lefthyphenmin=${h.leftMin} \\righthyphenmin=${h.rightMin}`
}

// ── Header ────────────────────────────────────────────────────────────────────

const SOCIAL_PROFILES = {
  linkedin: username => `linkedin.com/in/${username}`,
  github:   username => `github.com/${username}`,
  twitter:  username => `x.com/${username}`,
  x:        username => `x.com/${username}`,
}

function renderHeader(cv) {
  const contacts = []

  if (cv.location) contacts.push(mdToLatex(cv.location))
  if (cv.email)    contacts.push(latexLink(`mailto:${cv.email}`, escapeLatex(cv.email)))
  if (cv.phone) {
    // Opens a WhatsApp chat; wa.me takes the international number as digits only
    const digits = String(cv.phone).replace(/\D/g, '')
    contacts.push(digits ? latexLink(`https://wa.me/${digits}`, escapeLatex(cv.phone)) : escapeLatex(cv.phone))
  }
  if (cv.website) {
    const website = String(cv.website)
    const href    = /^[a-z]+:\/\//i.test(website) ? website : `https://${website}`
    const display = website.replace(/^https?:\/\//i, '').replace(/\/$/, '')
    contacts.push(latexLink(href, escapeLatex(display)))
  }

  for (const social of cv.social_networks || []) {
    if (!social?.username) continue
    const profile = SOCIAL_PROFILES[String(social.network || '').toLowerCase()]
    const display = profile ? profile(social.username) : String(social.username)
    const href    = social.url || (profile ? `https://${display}` : null)
    contacts.push(href ? latexLink(href, escapeLatex(display)) : escapeLatex(display))
  }

  for (const custom of cv.custom_connections || []) {
    if (custom) contacts.push(mdToLatex(custom))
  }

  // \mbox keeps each contact item on one line; breaks only happen at separators
  const contactLine = contacts.map(item => `\\mbox{${item}}`).join(' \\cvsep ')
  return macro('cvheader', escapeLatex(cv.name), mdToLatex(cv.headline), contactLine)
}

// ── Sections ──────────────────────────────────────────────────────────────────

function renderSection(title, entries, context) {
  const list = Array.isArray(entries) ? entries : []
  const blocks = []
  let pendingBullets = []

  // Consecutive bullet entries are grouped into a single list
  const flushBullets = () => {
    if (pendingBullets.length) blocks.push(environment('cvbullets', pendingBullets))
    pendingBullets = []
  }

  for (const entry of list) {
    const type = detectEntryType(entry)
    if (type === 'bullet' || type === 'numbered') {
      const text = entry?.bullet ?? entry?.reversed_number ?? entry?.number
      if (text != null && text !== '') pendingBullets.push(`\\item{} ${mdToLatex(text)}`)
      continue
    }
    flushBullets()
    const rendered = renderEntry(entry, type, context)
    if (rendered) blocks.push(rendered)
  }
  flushBullets()

  if (!blocks.length) return null
  return [macro('cvsection', escapeLatex(formatSectionTitle(title))), ...blocks].join('\n')
}

function renderEntry(entry, type, { dateFormat, language }) {
  const date = formatDateRange(entry?.start_date, entry?.end_date, entry?.date, dateFormat, language)

  switch (type) {
    case 'education':
      return macro('cveducation',
        mdToLatex(entry.degree),
        mdToLatex(entry.institution),
        mdToLatex(entry.area),
        mdToLatex(entry.location),
        escapeLatex(date),
        mdToLatex(entry.summary),
        renderHighlights(entry.highlights),
      )

    case 'experience':
      return macro('cventry',
        mdToLatex(entry.company),
        mdToLatex(entry.position),
        mdToLatex(entry.location),
        escapeLatex(date),
        mdToLatex(entry.summary),
        renderHighlights(entry.highlights),
      )

    case 'project': {
      // `url` is an alternative to writing the name as a markdown link
      const nameHasLink = String(entry.name ?? '').includes('](')
      const title = entry.url && !nameHasLink
        ? latexLink(entry.url, mdToLatex(entry.name))
        : mdToLatex(entry.name)
      return macro('cventry',
        title,
        '',
        mdToLatex(entry.location),
        escapeLatex(date),
        mdToLatex(entry.summary),
        renderHighlights(entry.highlights),
      )
    }

    case 'publication': {
      const title   = entry.url ? latexLink(entry.url, escapeLatex(entry.title)) : escapeLatex(entry.title)
      const authors = (Array.isArray(entry.authors) ? entry.authors : [entry.authors])
        .filter(Boolean)
        .map(author => mdToLatex(author))
        .join(', ')
      const doi = entry.doi
        ? latexLink(`https://doi.org/${entry.doi}`, escapeLatex(entry.doi))
        : ''
      return macro('cvpublication',
        title,
        escapeLatex(formatDateRange(entry.date, null, null, dateFormat, language)),
        authors,
        doi,
        mdToLatex(entry.journal),
      )
    }

    case 'skill':
      return macro('cvskill', mdToLatex(entry.label), mdToLatex(entry.details))

    default: {
      // Plain strings and { summary } entries are free text
      const text = typeof entry === 'string' ? entry : entry?.summary
      if (text == null || String(text).trim() === '') return null
      return macro('cvtext', renderParagraphs(text))
    }
  }
}

function renderHighlights(highlights) {
  const items = (Array.isArray(highlights) ? highlights : [])
    .map(renderHighlight)
    .filter(Boolean)
  return items.length ? environment('cvhighlights', items) : ''
}

function renderHighlight(highlight) {
  if (highlight == null || highlight === '') return null
  if (typeof highlight !== 'object') return `\\item{} ${mdToLatex(highlight)}`

  // { "Heading": ["sub item", …] } → item with a nested list
  const [first] = Object.entries(highlight)
  if (!first) return null
  const [heading, value] = first
  if (!Array.isArray(value)) return `\\item{} ${mdToLatex(value)}`

  const subItems = value.filter(sub => sub != null && sub !== '').map(sub => `\\item{} ${mdToLatex(sub)}`)
  const nested   = subItems.length ? '\n' + environment('itemize', subItems) : ''
  return `\\item{} ${mdToLatex(heading)}${nested}`
}

// ── Small emit helpers ────────────────────────────────────────────────────────

function renderParagraphs(text) {
  return String(text)
    .split(/\n\s*\n/)
    .map(paragraph => mdToLatex(paragraph))
    .filter(Boolean)
    .join('\\par ')
}

function macro(name, ...args) {
  return `\\${name}` + args.map(arg => `{${arg ?? ''}}`).join('')
}

function environment(name, items) {
  return `\\begin{${name}}\n${items.join('\n')}\n\\end{${name}}`
}
