import yaml from 'js-yaml'
import { isPresent } from './languages'

/** Parses the editor's YAML. Returns { data: the `cv` object, error: message or null }. */
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

/** Entry type, detected from the fields the entry has (see README → "Automatic Entry Type Detection"). */
export function detectEntryType(entry) {
  if (!entry || typeof entry !== 'object') return 'text'
  if ('institution' in entry) return 'education'
  if ('company' in entry) return 'experience'
  if ('title' in entry && 'authors' in entry) return 'publication'
  if ('name' in entry && ('start_date' in entry || 'date' in entry || 'highlights' in entry)) return 'project'
  if ('label' in entry && 'details' in entry) return 'skill'
  if ('bullet' in entry) return 'bullet'
  if ('reversed_number' in entry || 'number' in entry) return 'numbered'
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

/** "2022-10" → "Oct 2022" (in the CV's language); a bare year is returned as is. */
function formatMonthYear(value, language) {
  const [year, month] = String(value).split('-')
  if (month === undefined) return String(value)
  const monthName = language.months[parseInt(month, 10) - 1]
  return monthName ? `${monthName} ${year}` : year
}

/** "2022-10" → "2022" */
const formatYear = value => String(value).split('-')[0]

/**
 * Date column text. A single `date` is printed verbatim; otherwise
 * "start – end", with "present" translated to the CV's language.
 * dateFormat: 'month-year' | 'year' (set by the template).
 */
export function formatDateRange(startDate, endDate, date, dateFormat, language) {
  if (date) return String(date)
  const format = dateFormat === 'year' ? formatYear : value => formatMonthYear(value, language)
  const start  = startDate ? format(startDate) : ''
  const end    = !endDate ? '' : isPresent(endDate) ? language.present : format(endDate)
  return [start, end].filter(Boolean).join(' – ')
}
