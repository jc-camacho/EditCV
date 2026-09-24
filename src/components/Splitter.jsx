import { useRef } from 'react'

const KEY_STEP = { ArrowLeft: -2, ArrowRight: 2 } // percent

/**
 * Vertical divider between two panes. Drag it, use the arrow keys, or
 * double-click to reset. Reports the new position as a percentage of the
 * parent's width (plus that width in px, so the caller can enforce minimums).
 */
export default function Splitter({ value, onResize }) {
  const draggingRef = useRef(false)

  const parentWidth = el => el.parentElement.getBoundingClientRect()

  function handlePointerMove(e) {
    if (!draggingRef.current) return
    const { left, width } = parentWidth(e.currentTarget)
    onResize(((e.clientX - left) / width) * 100, width)
  }

  return (
    <div
      className="splitter"
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={Math.round(value)}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onPointerDown={e => {
        if (e.button !== 0) return
        e.preventDefault() // no text selection while dragging
        e.currentTarget.setPointerCapture(e.pointerId)
        draggingRef.current = true
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => { draggingRef.current = false }}
      onPointerCancel={() => { draggingRef.current = false }}
      onDoubleClick={e => onResize(50, parentWidth(e.currentTarget).width)}
      onKeyDown={e => {
        if (!KEY_STEP[e.key]) return
        e.preventDefault()
        onResize(value + KEY_STEP[e.key], parentWidth(e.currentTarget).width)
      }}
    />
  )
}
