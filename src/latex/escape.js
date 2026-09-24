/**
 * Text → LaTeX helpers.
 *
 * Everything the user types goes through here before it lands in the .tex
 * source, so a stray `&`, `%` or emoji can never break the compilation.
 *
 * Supported inline markdown:
 *   **bold**      → \textbf{}
 *   *italic*      → \emph{}   (upright inside italic text, e.g. lead author)
 *   [text](url)   → \href{}{} (only http, https, mailto and tel URLs)
 */

const LATEX_SPECIALS = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  '$': '\\$',
  '&': '\\&',
  '#': '\\#',
  '^': '\\textasciicircum{}',
  '_': '\\_',
  '~': '\\textasciitilde{}',
  '%': '\\%',
  ' ': '~', // non-breaking space
}

// Characters beyond Latin-1 / Latin Extended-A that pdfLaTeX's utf8 input
// encoding knows how to typeset. Anything else (emoji, CJK, …) would abort the
// whole compilation, so it is dropped instead.
const EXTRA_SUPPORTED = new Set('–—‘’‚“”„†‡•…‰‹›€™')
// Latin Extended-A letters the utf8/T1 setup does not define
const UNSUPPORTED = new Set('ĦħĸĿŀŉŦŧſ')

function isSupportedChar(ch) {
  const code = ch.codePointAt(0)
  return (code >= 0x20 && code <= 0x7e)
    || (code >= 0xa0 && code <= 0x17f && !UNSUPPORTED.has(ch))
    || EXTRA_SUPPORTED.has(ch)
}

function sanitize(raw) {
  return Array.from(String(raw).normalize('NFC'))
    .map(ch => (/\s/.test(ch) && ch !== ' ' ? ' ' : ch))
    .filter(isSupportedChar)
    .join('')
    .replace(/ {2,}/g, ' ')
}

/** Escapes plain text so it typesets literally. */
export function escapeLatex(raw) {
  if (raw == null) return ''
  return sanitize(raw).replace(/[\\{}$&#^_~% ]/g, ch => LATEX_SPECIALS[ch])
}

/** Only these protocols end up as clickable links in the PDF. */
export function isSafeUrl(url) {
  try {
    const { protocol } = new URL(url)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(protocol)
  } catch {
    return false
  }
}

/**
 * Makes a URL safe inside \href{...} when it is itself inside another macro's
 * argument (catcodes are already frozen there): characters TeX would
 * interpret are percent-encoded, and `%` / `#` are backslash-escaped.
 */
export function escapeUrl(url) {
  return sanitize(url)
    .replace(/[\\{}^~ ]/g, ch => '%' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
    .replace(/[%#]/g, ch => '\\' + ch)
}

/** \href when the URL is allowed, plain label otherwise. */
export function latexLink(url, label) {
  return isSafeUrl(url) ? `\\href{${escapeUrl(url)}}{${label}}` : label
}

const INLINE_MARKDOWN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g

/** Converts inline markdown to LaTeX, escaping all literal text. */
export function mdToLatex(text) {
  if (text == null) return ''
  const source = String(text)
  const pattern = new RegExp(INLINE_MARKDOWN) // fresh lastIndex for recursive calls
  let out = ''
  let last = 0
  let match

  while ((match = pattern.exec(source))) {
    const [, linkLabel, linkUrl, bold, italic] = match
    out += escapeLatex(source.slice(last, match.index))
    if (linkLabel !== undefined) out += latexLink(linkUrl, mdToLatex(linkLabel))
    else if (bold !== undefined)  out += `\\textbf{${mdToLatex(bold)}}`
    else                          out += `\\emph{${mdToLatex(italic)}}`
    last = pattern.lastIndex
  }

  return out + escapeLatex(source.slice(last))
}

/**
 * Pulls the first error ("! ..." line plus a bit of context) out of a TeX log
 * so the UI can show something readable instead of the whole log.
 */
export function extractLatexError(log) {
  if (!log) return 'LaTeX compilation failed.'
  const lines = log.split('\n')
  const start = lines.findIndex(line => line.startsWith('!'))
  if (start === -1) return 'LaTeX compilation failed. Download the .tex file to inspect it.'
  return lines.slice(start, start + 4).join('\n').trim()
}
