import { useEffect, useRef, useState } from 'react'

/**
 * Modal asking the user for a filename before the PDF is generated.
 * Confirms on Enter, cancels on Escape or backdrop click.
 */
export default function ExportModal({ defaultName, onConfirm, onCancel }) {
  const [name, setName] = useState(defaultName)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <div className="modalBackdrop" onClick={onCancel}>
      <div className="modalCard" onClick={e => e.stopPropagation()}>
        <h2 className="modalTitle">Download PDF</h2>
        <p className="modalSubtitle">Choose a filename for your CV</p>
        <form onSubmit={handleSubmit}>
          <div className="modalInputWrap">
            <input
              ref={inputRef}
              className="modalInput"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="cv"
            />
            <span className="modalInputSuffix">.pdf</span>
          </div>
          <div className="modalActions">
            <button type="button" className="modalBtnGhost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="modalBtnPrimary" disabled={!name.trim()}>
              Download
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
