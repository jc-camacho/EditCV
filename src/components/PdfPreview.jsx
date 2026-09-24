import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

// PDF units are points (72/in); the zoom level is relative to 96dpi CSS pixels
const CSS_PX_PER_PT = 96 / 72
// Same cap as pdf.js: bigger canvases exhaust memory (and Safari refuses to draw them)
const MAX_CANVAS_PIXELS = 2 ** 25

/** window.devicePixelRatio, updated when it changes (browser zoom, moving to another screen). */
function useDevicePixelRatio() {
  const [ratio, setRatio] = useState(() => window.devicePixelRatio || 1)
  useEffect(() => {
    const query = matchMedia(`(resolution: ${ratio}dppx)`)
    const update = () => setRatio(window.devicePixelRatio || 1)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [ratio])
  return ratio
}

/**
 * Renders one PDF page. It draws into an off-screen canvas first and only then
 * copies the result to the visible one, so recompiling doesn't flicker.
 */
function PdfPage({ doc, pageNumber, zoom }) {
  const canvasRef = useRef(null)
  const ratio     = useDevicePixelRatio()

  useEffect(() => {
    let cancelled  = false
    let renderTask = null

    doc.getPage(pageNumber).then(page => {
      if (cancelled) return
      // Render straight at device-pixel resolution, then size the element so that
      // one canvas pixel is exactly one screen pixel. Any mismatch between the two
      // makes the browser resample the bitmap, which blurs the text. At very high
      // zoom the resolution is capped and the browser upscales instead.
      const cssScale  = (zoom / 100) * CSS_PX_PER_PT
      const { width, height } = page.getViewport({ scale: cssScale })
      const scale     = Math.min(ratio, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)))
      const viewport  = page.getViewport({ scale: cssScale * scale })

      const offscreen  = document.createElement('canvas')
      offscreen.width  = Math.round(viewport.width)
      offscreen.height = Math.round(viewport.height)

      renderTask = page.render({ canvasContext: offscreen.getContext('2d'), viewport })

      return renderTask.promise.then(() => {
        const canvas = canvasRef.current
        if (cancelled || !canvas) return
        canvas.width        = offscreen.width
        canvas.height       = offscreen.height
        canvas.style.width  = `${offscreen.width / scale}px`
        canvas.style.height = `${offscreen.height / scale}px`
        canvas.getContext('2d').drawImage(offscreen, 0, 0)
      })
    }).catch(() => { /* cancelled or document replaced */ })

    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [doc, pageNumber, zoom, ratio])

  return <canvas ref={canvasRef} className="pdfPage" />
}

const canScroll = el => el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight

/** Lets the user drag the preview with the mouse to scroll it, like a hand tool. */
function useDragToScroll() {
  const ref = useRef(null)
  const [pannable, setPannable] = useState(false)
  const [panning, setPanning]   = useState(false)

  function onPointerDown(e) {
    const el = ref.current
    // Left button only; leave the scrollbars and the error text (selectable) alone
    if (e.button !== 0 || !canScroll(el) || e.target.closest('.errorBox')) return
    if (e.target === el && (e.nativeEvent.offsetX >= el.clientWidth || e.nativeEvent.offsetY >= el.clientHeight)) return

    const start = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
    const move  = ev => {
      el.scrollLeft = start.left - (ev.clientX - start.x)
      el.scrollTop  = start.top  - (ev.clientY - start.y)
    }
    const end = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', end)
      el.removeEventListener('pointercancel', end)
      setPanning(false)
    }
    el.setPointerCapture(e.pointerId)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
    setPanning(true)
  }

  const className = panning ? ' panning' : pannable ? ' pannable' : ''
  return { ref, className, onPointerDown, onPointerOver: () => setPannable(canScroll(ref.current)) }
}

export default function PdfPreview({ pdf, zoom = 100, status, error }) {
  const [doc, setDoc] = useState(null)
  const { className: panClass, ...panHandlers } = useDragToScroll()

  // Load a new document whenever a fresh PDF is compiled
  useEffect(() => {
    if (!pdf) return
    let cancelled = false
    // pdf.js transfers the buffer to its worker, so hand it a copy
    pdfjsLib.getDocument({ data: pdf.slice() }).promise
      .then(loaded => {
        if (cancelled) loaded.destroy()
        else setDoc(loaded)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [pdf])

  // Release the previous document once it has been replaced
  useEffect(() => () => { doc?.destroy() }, [doc])

  return (
    <div className={`previewWrapper${panClass}`} {...panHandlers}>
      {error && <div className="errorBox">{error}</div>}

      {doc ? (
        Array.from({ length: doc.numPages }, (_, i) => (
          <PdfPage key={i} doc={doc} pageNumber={i + 1} zoom={zoom} />
        ))
      ) : (
        !error && (
          <div className="emptyState">
            {status === 'compiling' ? 'Compiling LaTeX…' : 'Loading LaTeX engine…'}
          </div>
        )
      )}
    </div>
  )
}
