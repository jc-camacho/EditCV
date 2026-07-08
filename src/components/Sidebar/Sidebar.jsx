import { useState } from 'react'
import { createCV, saveCV, deleteCV } from '../../utils/storage'

// Defined outside the component so React doesn't recreate these on every render
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

export default function Sidebar({ cvs, activeCVId, onSelect, onCVsChange }) {
  const [editingId, setEditingId]       = useState(null)
  const [editingName, setEditingName]   = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const visibleCVs  = cvs.filter(cv => !cv.archived)
  const archivedCVs = cvs.filter(cv => cv.archived)

  function handleNewCV() {
    const newCV = createCV('New CV')
    saveCV(newCV)
    onCVsChange()
    onSelect(newCV.id)
  }

  function handleDeleteCV(e, id) {
    e.stopPropagation()
    // Always keep at least one CV so the editor is never empty
    if (cvs.length === 1) return
    deleteCV(id)
    onCVsChange()
    if (activeCVId === id) {
      const remaining = cvs.filter(c => c.id !== id)
      if (remaining.length) onSelect(remaining[0].id)
    }
  }

  function handleToggleArchive(e, cv) {
    e.stopPropagation()
    const wasActive = !cv.archived
    saveCV({ ...cv, archived: !cv.archived })
    onCVsChange()
    // If we just archived the CV currently open in the editor, switch to another visible one
    if (wasActive && activeCVId === cv.id) {
      const remaining = cvs.filter(c => c.id !== cv.id && !c.archived)
      if (remaining.length) onSelect(remaining[0].id)
    }
  }

  function startRenaming(e, cv) {
    e.stopPropagation()
    setEditingId(cv.id)
    setEditingName(cv.name)
  }

  function commitRename(cv) {
    const updatedCV = { ...cv, name: editingName.trim() || cv.name }
    saveCV(updatedCV)
    onCVsChange()
    setEditingId(null)
  }

  function renderItem(cv) {
    return (
      <li
        key={cv.id}
        className={`item ${cv.id === activeCVId ? 'active' : ''}`}
        onClick={() => onSelect(cv.id)}
      >
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
            <span className="sidebarItemName">{cv.name}</span>
            <span className="actions">
              <button
                className="iconBtn"
                title="Rename"
                onClick={e => startRenaming(e, cv)}
              >
                <IconEdit />
              </button>
              <button
                className="iconBtn"
                title={cv.archived ? 'Unarchive' : 'Archive'}
                onClick={e => handleToggleArchive(e, cv)}
              >
                {cv.archived ? <IconUnarchive /> : <IconArchive />}
              </button>
              <button
                className="iconBtn"
                title="Delete"
                onClick={e => handleDeleteCV(e, cv.id)}
                disabled={cvs.length === 1}
              >
                <IconTrash />
              </button>
            </span>
          </>
        )}
      </li>
    )
  }

  return (
    <aside className="sidebar">
      <button className="newBtn" onClick={handleNewCV}>
        <IconPlus /> New CV
      </button>
      <ul className="list">
        {visibleCVs.map(renderItem)}
      </ul>
      {archivedCVs.length > 0 && (
        <div className="archivedSection">
          {showArchived && (
            <ul className="list">
              {archivedCVs.map(renderItem)}
            </ul>
          )}
          <button className="archivedToggle" onClick={() => setShowArchived(s => !s)}>
            <span>{showArchived ? '▴' : '▸'} Archived ({archivedCVs.length})</span>
          </button>
        </div>
      )}
    </aside>
  )
}
