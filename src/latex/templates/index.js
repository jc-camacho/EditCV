import { harvardPreamble } from './harvard'
import { classicPreamble } from './classic'
import { modernPreamble } from './modern'

export const TEMPLATES = {
  harvard: { id: 'harvard', label: 'Harvard', dateFormat: 'month-year', preamble: harvardPreamble }, // "Oct 2022"
  classic: { id: 'classic', label: 'Classic', dateFormat: 'year',       preamble: classicPreamble }, // "2022"
  modern:  { id: 'modern',  label: 'Modern',  dateFormat: 'month-year', preamble: modernPreamble },
}

export const DEFAULT_TEMPLATE = 'harvard'
