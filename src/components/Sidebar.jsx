import { useState } from 'react'
import { createCV, saveCV, deleteCV } from '../utils/storage'
import Modal from './Modal'

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="7" y1="2" x2="7" y2="12" />
    <line x1="2" y1="7" x2="12" y2="7" />
  </svg>
)

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2l2 2-7 7H2v-2L9 2z" />
  </svg>
)

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,3 11,3" />
    <path d="M4 3V2h5v1" />
    <path d="M4.5 5l.5 5M8.5 5l-.5 5" />
    <rect x="3" y="3" width="7" height="8" rx="1" />
  </svg>
)

const IconArchive = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="2" width="10" height="2.2" rx="0.5" />
    <path d="M2.2 4.2v5.8a1 1 0 0 0 1 1h6.6a1 1 0 0 0 1-1V4.2" />
    <line x1="5.1" y1="7" x2="7.9" y2="7" />
  </svg>
)

const IconUnarchive = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="2" width="10" height="2.2" rx="0.5" />
    <path d="M2.2 4.2v5.8a1 1 0 0 0 1 1h6.6a1 1 0 0 0 1-1V4.2" />
    <path d="M5.1 8.3 6.5 6.9 7.9 8.3" />
    <line x1="6.5" y1="6.9" x2="6.5" y2="9.7" />
  </svg>
)

const IconStar = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
    <path d="M6.5 1.3l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6L1.3 5.1l3.6-.5z" />
  </svg>
)

// Favorites first; otherwise keeps the stored order (sort is stable)
const favoritesFirst = cvs => [...cvs].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite))

export default function Sidebar({ cvs, activeCVId, onSelect, onCVsChange }) {
  const [editingId, setEditingId]       = useState(null)
  const [editingName, setEditingName]   = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [cvToDelete, setCVToDelete]     = useState(null) // favorite CV awaiting confirmation

  const visibleCVs  = favoritesFirst(cvs.filter(cv => !cv.archived))
  const archivedCVs = favoritesFirst(cvs.filter(cv => cv.archived))

  // Open another visible CV when the active one disappears from the list
  function leave(id) {
    if (activeCVId !== id) return
    const next = cvs.find(c => c.id !== id && !c.archived) ?? cvs.find(c => c.id !== id)
    if (next) onSelect(next.id)
  }

  function handleNewCV() {
    const newCV = createCV('New CV')
    saveCV(newCV)
    onCVsChange()
    onSelect(newCV.id)
  }

  function deleteNow(id) {
    if (cvs.length === 1) return // keep at least one CV so the editor is never empty
    deleteCV(id)
    onCVsChange()
    leave(id)
  }

  // Favorites ask for confirmation first
  function handleDelete(e, cv) {
    e.stopPropagation()
    if (cv.favorite) setCVToDelete(cv)
    else deleteNow(cv.id)
  }

  function confirmDelete() {
    deleteNow(cvToDelete.id)
    setCVToDelete(null)
  }

  function handleToggleArchive(e, cv) {
    e.stopPropagation()
    saveCV({ ...cv, archived: !cv.archived })
    onCVsChange()
    if (!cv.archived) leave(cv.id)
  }

  function handleToggleFavorite(e, cv) {
    e.stopPropagation()
    saveCV({ ...cv, favorite: !cv.favorite })
    onCVsChange()
  }

  function startRenaming(e, cv) {
    e.stopPropagation()
    setEditingId(cv.id)
    setEditingName(cv.name)
  }

  function commitRename(cv) {
    saveCV({ ...cv, name: editingName.trim() || cv.name })
    onCVsChange()
    setEditingId(null)
  }

  const renderItem = cv => (
    <li key={cv.id} className={`item${cv.id === activeCVId ? ' active' : ''}`} onClick={() => onSelect(cv.id)}>
      {editingId === cv.id ? (
        <input
          className="renameInput"
          value={editingName}
          autoFocus
          onChange={e => setEditingName(e.target.value)}
          onBlur={() => commitRename(cv)}
          onKeyDown={e => e.key === 'Enter' && commitRename(cv)}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="itemName">{cv.name}</span>
          <button
            className={`btnIcon sm bare favoriteBtn${cv.favorite ? ' on' : ''}`}
            title={cv.favorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={!!cv.favorite}
            onClick={e => handleToggleFavorite(e, cv)}
          >
            <IconStar filled={cv.favorite} />
          </button>
          <span className="itemActions">
            <button className="btnIcon sm bare" title="Rename" onClick={e => startRenaming(e, cv)}><IconEdit /></button>
            <button className="btnIcon sm bare" title={cv.archived ? 'Unarchive' : 'Archive'} onClick={e => handleToggleArchive(e, cv)}>
              {cv.archived ? <IconUnarchive /> : <IconArchive />}
            </button>
            <button className="btnIcon sm bare" title="Delete" onClick={e => handleDelete(e, cv)} disabled={cvs.length === 1}><IconTrash /></button>
          </span>
        </>
      )}
    </li>
  )

  return (
    <aside className="card sidebar">
      <button className="btn btnPrimary block" onClick={handleNewCV}><IconPlus /> New CV</button>
      <ul className="list">{visibleCVs.map(renderItem)}</ul>
      {archivedCVs.length > 0 && (
        <div className="archivedSection">
          {showArchived && <ul className="list">{archivedCVs.map(renderItem)}</ul>}
          <button className="archivedToggle" onClick={() => setShowArchived(s => !s)}>
            {showArchived ? '▴' : '▸'} Archived ({archivedCVs.length})
          </button>
        </div>
      )}
      {cvToDelete && (
        <Modal title="Delete favorite CV?" subtitle={`"${cvToDelete.name}" is marked as a favorite. This can't be undone.`} onClose={() => setCVToDelete(null)}>
          <div className="modalActions">
            <button className="btn btnGhost" onClick={() => setCVToDelete(null)}>Cancel</button>
            <button className="btn btnDanger" onClick={confirmDelete} autoFocus>Delete</button>
          </div>
        </Modal>
      )}
    </aside>
  )
}
