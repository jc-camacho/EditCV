import { useEffect } from 'react'

/** Dialog shell shared by every modal: closes on Escape or backdrop click. */
export default function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const handleKeyDown = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-label={title} onClick={e => e.stopPropagation()}>
        <h2 className="modalTitle">{title}</h2>
        {subtitle && <p className="modalSubtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
