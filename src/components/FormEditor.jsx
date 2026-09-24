import { useState, useEffect, useRef } from 'react'
import yaml from 'js-yaml'
import { formatSectionTitle } from '../utils/yamlParser'
import { LANGUAGES, languageKey } from '../utils/languages'
import Modal from './Modal'

// ── Entry types ───────────────────────────────────────────────────────────────

/**
 * Form layout per entry type. Each item is a field, `DATES`, or an array of
 * fields shown side by side. Field types: text (default), textarea, list.
 */
const DATES = 'dates'

const ENTRY_TYPES = {
  summary: {
    label: 'Summary / Text',
    blank: { summary: '' },
  },
  education: {
    label: 'Education',
    blank: { institution: '', area: '', degree: 'BS', start_date: '', end_date: '', location: '', highlights: [] },
    fields: [
      { name: 'institution', label: 'Institution', placeholder: 'University Name' },
      [
        { name: 'area',   label: 'Field of Study', placeholder: 'Computer Science' },
        { name: 'degree', label: 'Degree',         placeholder: 'BS / MS / PhD' },
      ],
      DATES,
      { name: 'location',   label: 'Location',   placeholder: 'City, Country' },
      { name: 'highlights', label: 'Highlights', placeholder: 'Achievement, award, GPA…', type: 'list' },
    ],
  },
  experience: {
    label: 'Experience',
    blank: { company: '', position: '', start_date: '', end_date: 'present', location: '', highlights: [] },
    fields: [
      [
        { name: 'company',  label: 'Company',  placeholder: 'Company Name' },
        { name: 'position', label: 'Position', placeholder: 'Job Title' },
      ],
      DATES,
      { name: 'location',   label: 'Location',   placeholder: 'City, Country (Remote)' },
      { name: 'summary',    label: 'Summary',    placeholder: 'Brief description of role…', type: 'textarea' },
      { name: 'highlights', label: 'Highlights', placeholder: 'Key achievement or responsibility…', type: 'list' },
    ],
  },
  project: {
    label: 'Projects',
    blank: { name: '', start_date: '', end_date: '', summary: '', highlights: [] },
    fields: [
      { name: 'name', label: 'Name (markdown supported)', placeholder: '[Project Name](https://github.com/…)' },
      DATES,
      { name: 'summary',    label: 'Summary',    placeholder: 'Brief project description…', type: 'textarea' },
      { name: 'highlights', label: 'Highlights', placeholder: 'Key feature or achievement…', type: 'list' },
    ],
  },
  publication: {
    label: 'Publications',
    blank: { title: '', authors: [], doi: '', journal: '', date: '' },
    fields: [
      { name: 'title',   label: 'Title',   placeholder: 'Paper or article title' },
      { name: 'authors', label: 'Authors', placeholder: '*Your Name* or Co-author Name', type: 'list' },
      [
        { name: 'journal', label: 'Journal / Conference', placeholder: 'ICML 2024' },
        { name: 'date',    label: 'Date',                 placeholder: 'YYYY-MM', mono: true },
      ],
      [
        { name: 'doi', label: 'DOI', placeholder: '10.xxxx/…', mono: true },
        { name: 'url', label: 'URL', placeholder: 'https://…' },
      ],
    ],
  },
  skill: {
    label: 'Skills',
    blank: { label: '', details: '' },
    fields: [[
      { name: 'label',   label: 'Label',   placeholder: 'Languages' },
      { name: 'details', label: 'Details', placeholder: 'Python, TypeScript, Go' },
    ]],
  },
  honor: {
    label: 'Bullets / Honors',
    blank: { bullet: '' },
    fields: [{ name: 'bullet', label: 'Honor / Bullet', placeholder: 'Award name — Institution (Year)' }],
  },
}

const SECTION_TYPES = {
  education: 'education', experience: 'experience', projects: 'project',
  publications: 'publication', skills: 'skill', selected_honors: 'honor', summary: 'summary',
}

/** Entry type of a section: by its name first, then by the keys of its first entry. */
function detectSectionType(sectionName, entries) {
  if (SECTION_TYPES[sectionName]) return SECTION_TYPES[sectionName]
  // Check keys, not values: a freshly added entry has empty strings and must keep its type
  const first = entries[0]
  if (!first) return 'honor'
  if (typeof first === 'string') return 'summary'
  if ('institution' in first) return 'education'
  if ('company' in first) return 'experience'
  if ('title' in first && 'authors' in first) return 'publication'
  if ('name' in first) return 'project'
  if ('label' in first) return 'skill'
  if ('summary' in first && !('bullet' in first)) return 'summary'
  return 'honor'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const toSectionKey = name => name.trim().replace(/\s+/g, '_').toLowerCase()
const replaceAt    = (list, index, value) => list.map((item, i) => (i === index ? value : item))
const removeAt     = (list, index) => list.filter((_, i) => i !== index)

/** Swaps an item with its neighbour; returns the list unchanged at the edges. */
function move(list, index, offset) {
  const target = index + offset
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

// ── Fields ────────────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="field">
      <label className="fieldLabel">{label}</label>
      {children}
    </div>
  )
}

function TextField({ label, value, onChange, placeholder, mono, type }) {
  const Tag = type === 'textarea' ? 'textarea' : 'input'
  return (
    <Field label={label}>
      <Tag
        className={`input${mono ? ' mono' : ''}`}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={type === 'textarea' ? 3 : undefined}
      />
    </Field>
  )
}

/** Editable list of plain strings (highlights, authors…). */
function ListField({ label, value, onChange, placeholder }) {
  const list = Array.isArray(value) ? value : []
  return (
    <div className="field">
      <div className="listHeader">
        <label className="fieldLabel">{label}</label>
        <button className="linkBtn" onClick={() => onChange([...list, ''])}>+ Add</button>
      </div>
      {list.map((item, i) => (
        <div key={i} className="listRow">
          <input
            className="input"
            value={typeof item === 'string' ? item : ''}
            onChange={e => onChange(replaceAt(list, i, e.target.value))}
            placeholder={placeholder}
          />
          <button className="btnIcon danger" onClick={() => onChange(removeAt(list, i))} title="Remove">×</button>
        </div>
      ))}
    </div>
  )
}

/** Start/end dates with a "Present" toggle, or a single date for point-in-time entries. */
function DateFields({ entry, update }) {
  if (entry.date && !entry.start_date) {
    return <TextField label="Date" value={entry.date} onChange={v => update('date', v)} placeholder="2023" mono />
  }
  const isPresent = entry.end_date === 'present'
  return (
    <div className="row2">
      <TextField label="Start" value={entry.start_date} onChange={v => update('start_date', v)} placeholder="YYYY-MM" mono />
      <Field label="End">
        <div className="endRow">
          <input
            className="input mono"
            value={isPresent ? '' : (entry.end_date ?? '')}
            onChange={e => update('end_date', e.target.value)}
            placeholder="YYYY-MM"
            disabled={isPresent}
          />
          <label className="checkLabel">
            <input type="checkbox" checked={isPresent} onChange={e => update('end_date', e.target.checked ? 'present' : '')} />
            Present
          </label>
        </div>
      </Field>
    </div>
  )
}

function renderField(field, entry, update) {
  if (field === DATES) return <DateFields key={DATES} entry={entry} update={update} />
  if (Array.isArray(field)) {
    return <div key={field[0].name} className="row2">{field.map(f => renderField(f, entry, update))}</div>
  }
  const Component = field.type === 'list' ? ListField : TextField
  return <Component key={field.name} {...field} value={entry[field.name]} onChange={v => update(field.name, v)} />
}

function EntryForm({ type, entry, onChange }) {
  if (type === 'summary') {
    // Free text: a plain string or { summary }
    const isString = typeof entry === 'string'
    return (
      <div className="entryFields">
        <TextField
          label="Summary"
          type="textarea"
          value={isString ? entry : (entry.summary ?? entry.bullet)}
          onChange={v => {
            if (isString) return onChange(v)
            const { bullet, ...rest } = entry
            onChange({ ...rest, summary: v })
          }}
          placeholder="Write a summary or description…"
        />
      </div>
    )
  }
  const update = (key, value) => onChange({ ...entry, [key]: value })
  return <div className="entryFields">{ENTRY_TYPES[type].fields.map(f => renderField(f, entry, update))}</div>
}

// ── Sections ──────────────────────────────────────────────────────────────────

function SectionPanel({ name, entries, isNameTaken, onChange, onDelete, onRename, onMoveUp, onMoveDown }) {
  const [isOpen, setIsOpen]           = useState(false)
  const [isRenaming, setIsRenaming]   = useState(false)
  const [renameValue, setRenameValue] = useState(name)

  const type         = detectSectionType(name, entries)
  const displayTitle = formatSectionTitle(name)

  const renameKey      = toSectionKey(renameValue)
  const renameConflict = renameKey !== name && isNameTaken(renameKey)

  // Enter keeps the input open on a name clash; blur just discards the rename
  function commitRename(keepOpenOnConflict = false) {
    if (renameConflict) {
      if (!keepOpenOnConflict) setIsRenaming(false)
      return
    }
    if (renameKey && renameKey !== name) onRename(renameKey)
    setIsRenaming(false)
  }

  const stop = action => e => { e.stopPropagation(); action() }

  return (
    <div className="section">
      <div className="sectionHeader">
        <button className="sectionToggle" onClick={() => !isRenaming && setIsOpen(open => !open)}>
          <span className="chevron">{isOpen ? '▾' : '▸'}</span>
          {isRenaming ? (
            <input
              className={`renameInput${renameConflict ? ' invalid' : ''}`}
              value={renameValue}
              autoFocus
              onFocus={e => e.target.select()}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={() => commitRename()}
              title={renameConflict ? 'A section with this name already exists' : undefined}
              onKeyDown={e => {
                if (e.key === 'Enter')  commitRename(true)
                if (e.key === 'Escape') setIsRenaming(false)
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="sectionName">{displayTitle}</span>
          )}
          <span className="badge">{entries.length}</span>
        </button>
        <div className="sectionActions">
          <button className="btnIcon sm" onClick={stop(onMoveUp)}   disabled={!onMoveUp}   title="Move up">↑</button>
          <button className="btnIcon sm" onClick={stop(onMoveDown)} disabled={!onMoveDown} title="Move down">↓</button>
          <button className="btnIcon sm" onClick={stop(() => { setRenameValue(name); setIsRenaming(true) })} title="Rename section">✎</button>
          <button className="btnIcon sm danger" onClick={onDelete} title="Delete section">×</button>
        </div>
      </div>

      {isOpen && (
        <div className="sectionBody">
          {entries.map((entry, i) => (
            <div key={i} className="entryCard">
              <div className="entryToolbar">
                <span className="entryIndex">#{i + 1}</span>
                <div className="toolbarGroup">
                  <button className="btnIcon sm" onClick={() => onChange(move(entries, i, -1))} disabled={i === 0} title="Move up">↑</button>
                  <button className="btnIcon sm" onClick={() => onChange(move(entries, i, 1))} disabled={i === entries.length - 1} title="Move down">↓</button>
                  <button className="btnIcon sm danger" onClick={() => onChange(removeAt(entries, i))} title="Remove">×</button>
                </div>
              </div>
              <EntryForm type={type} entry={entry} onChange={value => onChange(replaceAt(entries, i, value))} />
            </div>
          ))}
          <button className="btnDashed" onClick={() => onChange([...entries, structuredClone(ENTRY_TYPES[type].blank)])}>
            + Add {displayTitle.replace(/s$/i, '')}
          </button>
        </div>
      )}
    </div>
  )
}

function AddSectionModal({ isNameTaken, onAdd, onClose }) {
  const [sectionName, setSectionName] = useState('')
  const [type, setType]               = useState('summary')

  const key       = toSectionKey(sectionName)
  const nameTaken = !!key && isNameTaken(key)

  function handleSubmit(e) {
    e.preventDefault()
    if (key && !nameTaken) onAdd(key, type)
  }

  return (
    <Modal title="New Section" onClose={onClose}>
      <form className="modalForm" onSubmit={handleSubmit}>
        <Field label="Section Name">
          <input
            className={`input${nameTaken ? ' invalid' : ''}`}
            value={sectionName}
            onChange={e => setSectionName(e.target.value)}
            placeholder="e.g. Awards, Certifications, Volunteering"
            autoFocus
          />
          {nameTaken && <span className="errorText">A section with this name already exists</span>}
        </Field>
        <Field label="Entry Type">
          <div className="typeGrid">
            {Object.entries(ENTRY_TYPES).map(([id, { label }]) => (
              <button type="button" key={id} className={`typeBtn${type === id ? ' active' : ''}`} onClick={() => setType(id)}>
                {label}
              </button>
            ))}
          </div>
        </Field>
        <div className="modalActions">
          <button type="button" className="btn btnGhost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btnPrimary" disabled={!key || nameTaken}>Add Section</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Form editor ───────────────────────────────────────────────────────────────

export default function FormEditor({ cvData, onYamlChange }) {
  const [formData, setFormData]             = useState(cvData || {})
  const [showAddSection, setShowAddSection] = useState(false)

  // Keeps the cvData prop from overwriting a change this form just made (form → yaml → form)
  const skipNextSyncRef = useRef(false)

  useEffect(() => {
    if (skipNextSyncRef.current) { skipNextSyncRef.current = false; return }
    if (cvData) setFormData(cvData)
  }, [cvData])

  function applyUpdate(newData) {
    setFormData(newData)
    skipNextSyncRef.current = true
    onYamlChange(yaml.dump({ cv: newData }, { lineWidth: 120, noRefs: true, skipInvalid: true }))
  }

  const sections        = formData.sections || {}
  const sectionList     = Object.entries(sections)
  const networks        = formData.social_networks || []
  const setField        = (field, value) => applyUpdate({ ...formData, [field]: value })
  const setSections     = entries => setField('sections', Object.fromEntries(entries))
  const isNameTaken     = key => Object.hasOwn(sections, key)
  const updateNetwork   = (i, patch) => setField('social_networks', replaceAt(networks, i, { ...networks[i], ...patch }))

  function addSection(name, type) {
    if (isNameTaken(name)) return // would overwrite the existing section
    setSections([...sectionList, [name, [structuredClone(ENTRY_TYPES[type].blank)]]])
    setShowAddSection(false)
  }

  function renameSection(oldName, newName) {
    if (isNameTaken(newName)) return // would silently merge two sections
    setSections(sectionList.map(([key, value]) => [key === oldName ? newName : key, value]))
  }

  return (
    <div className="form">
      <div className="formGroup">
        <div className="groupTitle">Personal Info</div>
        <div className="row2">
          <TextField label="Full Name" value={formData.name} onChange={v => setField('name', v)} placeholder="Your Name" />
          <Field label="CV Language">
            <select className="input" value={languageKey(formData.lang)} onChange={e => setField('lang', e.target.value)}>
              {Object.entries(LANGUAGES).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </Field>
        </div>
        <TextField label="Headline"  value={formData.headline} onChange={v => setField('headline', v)} placeholder="Software Engineer & Researcher" />
        <div className="row2">
          <TextField label="Location" value={formData.location} onChange={v => setField('location', v)} placeholder="City, Country" />
          <TextField label="Email"    value={formData.email}    onChange={v => setField('email', v)}    placeholder="you@email.com" />
        </div>
        <div className="row2">
          <TextField label="Phone"   value={formData.phone}   onChange={v => setField('phone', v)}   placeholder="+1 555 000 0000" />
          <TextField label="Website" value={formData.website} onChange={v => setField('website', v)} placeholder="https://yoursite.com" />
        </div>
      </div>

      <div className="formGroup">
        <div className="groupTitle">Social Networks</div>
        {networks.map((network, i) => (
          <div key={i} className="networkRow">
            <input className="input strong" value={network.network || ''}  onChange={e => updateNetwork(i, { network: e.target.value })}  placeholder="LinkedIn" />
            <input className="input"        value={network.username || ''} onChange={e => updateNetwork(i, { username: e.target.value })} placeholder="username" />
            <button className="btnIcon danger" onClick={() => setField('social_networks', removeAt(networks, i))} title="Remove">×</button>
          </div>
        ))}
        <button className="btnDashed" onClick={() => setField('social_networks', [...networks, { network: '', username: '' }])}>
          + Add Network
        </button>
      </div>

      <div className="formGroup">
        <div className="groupTitle">Sections</div>
        {sectionList.map(([name, entries], i) => (
          <SectionPanel
            key={name}
            name={name}
            entries={Array.isArray(entries) ? entries : []}
            isNameTaken={isNameTaken}
            onChange={updated => setSections(replaceAt(sectionList, i, [name, updated]))}
            onDelete={() => setSections(removeAt(sectionList, i))}
            onRename={newName => renameSection(name, newName)}
            onMoveUp={i > 0 ? () => setSections(move(sectionList, i, -1)) : null}
            onMoveDown={i < sectionList.length - 1 ? () => setSections(move(sectionList, i, 1)) : null}
          />
        ))}
        <button className="btnDashed accent" onClick={() => setShowAddSection(true)}>+ New Section</button>
      </div>

      {showAddSection && (
        <AddSectionModal isNameTaken={isNameTaken} onAdd={addSection} onClose={() => setShowAddSection(false)} />
      )}
    </div>
  )
}
