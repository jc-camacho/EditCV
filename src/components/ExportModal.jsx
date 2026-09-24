import { useState } from 'react'
import Modal from './Modal'

/** Asks for a filename before the PDF is downloaded. */
export default function ExportModal({ defaultName, onConfirm, onCancel }) {
  const [name, setName] = useState(defaultName)
  const trimmed = name.trim()

  function handleSubmit(e) {
    e.preventDefault()
    if (trimmed) onConfirm(trimmed)
  }

  return (
    <Modal title="Download PDF" subtitle="Choose a filename for your CV" onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        <div className="inputWithSuffix">
          <input
            className="input bare"
            value={name}
            onChange={e => setName(e.target.value)}
            onFocus={e => e.target.select()}
            placeholder="cv"
            autoFocus
          />
          <span>.pdf</span>
        </div>
        <div className="modalActions">
          <button type="button" className="btn btnGhost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btnPrimary" disabled={!trimmed}>Download</button>
        </div>
      </form>
    </Modal>
  )
}
