import { useState } from 'react'
import Modal from './Modal'

// Lowercase and without accents, so "jose" finds "José"
const normalize = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Searchable list of archived CVs; each row is drawn by the sidebar's `renderItem`. */
export default function ArchivedModal({ cvs, renderItem, onClose }) {
  const [query, setQuery] = useState('')
  const matches = cvs.filter(cv => normalize(cv.name).includes(normalize(query.trim())))

  return (
    <Modal title="Archived CVs" subtitle={`${cvs.length} archived`} onClose={onClose}>
      <input
        className="input"
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by name…"
        autoFocus
      />
      <ul className="list archivedList">
        {matches.map(renderItem)}
        {matches.length === 0 && (
          <li className="archivedEmpty">{cvs.length ? 'No CVs match your search' : 'No archived CVs'}</li>
        )}
      </ul>
    </Modal>
  )
}
