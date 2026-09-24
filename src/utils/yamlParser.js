import yaml from 'js-yaml'
import { LANGUAGES, DEFAULT_LANGUAGE, isPresent } from './languages'

export function parseCV(yamlString) {
  try {
    // CORE_SCHEMA keeps dates like 2020-01-15 as strings instead of Date objects
    const raw = yaml.load(yamlString, { schema: yaml.CORE_SCHEMA })
    if (!raw || !raw.cv) throw new Error('YAML must have a root "cv" key')
    return { data: raw.cv, error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

// Detects entry type by its fields
export function detectEntryType(entry) {
  if (!entry || typeof entry !== 'object') return 'text'
  if ('institution' in entry) return 'education'
  if ('company' in entry) return 'experience'
  if ('title' in entry && 'authors' in entry) return 'publication'
  if ('name' in entry && ('start_date' in entry || 'date' in entry || 'highlights' in entry)) return 'project'
  if ('label' in entry && 'details' in entry) return 'skill'
  if ('bullet' in entry) return 'bullet'
  if ('reversed_number' in entry) return 'numbered'
  if ('number' in entry) return 'numbered'
  if ('summary' in entry && !('name' in entry)) return 'summary'
  return 'text'
}

/**
 * Converts a snake_case section key to a human-readable Title Case label.
 * e.g. "selected_honors" → "Selected Honors"
 */
export function formatSectionTitle(snakeKey) {
  return String(snakeKey)
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function parseMonthYear(str, language) {
  const parts = String(str).split('-')
  if (parts.length >= 2) {
    const month = language.months[parseInt(parts[1], 10) - 1]
    return month ? `${month} ${parts[0]}` : parts[0]
  }
  return String(str)
}

function parseYear(str) {
  return String(str).split('-')[0]
}

export function formatDateRange(startDate, endDate, date, dateFormat = 'month-year', language = LANGUAGES[DEFAULT_LANGUAGE]) {
  if (date) return String(date)
  const parse = dateFormat === 'year' ? parseYear : str => parseMonthYear(str, language)
  const start = startDate ? parse(startDate) : ''
  const end = endDate
    ? isPresent(endDate) ? language.present : parse(endDate)
    : ''
  if (start && end) return `${start} – ${end}`
  if (start) return start
  if (end) return end
  return ''
}
