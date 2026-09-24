import { useState, useEffect, useMemo, useRef } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import PdfPreview, { downloadPercent } from './components/PdfPreview'
import ExportModal from './components/ExportModal'
import Splitter from './components/Splitter'
import { TEMPLATES, DEFAULT_TEMPLATE } from './latex/templates'
import { useLatexPdf } from './latex/useLatexPdf'
import { parseCV } from './utils/yamlParser'
import { loadCVs, saveCV, createCV, getActiveId, setActiveId, loadTheme, saveTheme, loadEditorWidth, saveEditorWidth } from './utils/storage'

const AUTOSAVE_DELAY_MS = 600
const PAGE_WIDTH_PX     = 816 // US Letter at 96dpi
const MIN_ZOOM = 25
const MAX_ZOOM = 250
const MIN_PANE_PX = 280

const clampZoom = zoom => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))

/** Triggers a browser download for in-memory content. */
function downloadFile(content, filename, mimeType) {
  const url  = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/**
 * State flow:
 *   user edits YAML / form
 *     → yamlText changes → parsed CV is recomputed
 *     → LaTeX is regenerated and compiled (debounced) → PdfPreview re-renders
 *     → auto-save fires after 600 ms of inactivity
 */
export default function App() {
  const [theme, setTheme]           = useState(loadTheme)
  const [template, setTemplate]     = useState(DEFAULT_TEMPLATE)
  const [cvs, setCVs]               = useState([])   // Every CV stored in localStorage
  const [activeCVId, setActiveCVId] = useState(null)
  const [yamlText, setYamlText]     = useState('')
  const [zoom, setZoom]             = useState(100)
  const [editorWidth, setEditorWidth] = useState(loadEditorWidth) // % of the main card
  const [showExportModal, setShowExportModal] = useState(false)

  const saveTimerRef   = useRef(null)
  const pendingSaveRef = useRef(null) // { id, yaml } not yet written to localStorage
  const activeCVIdRef  = useRef(null) // Always-current active ID for editor callbacks
  const previewPaneRef = useRef(null)

  const { data: parsedCV, error: parseError } = useMemo(() => parseCV(yamlText), [yamlText])
  const latex = useLatexPdf(parsedCV, template)

  useEffect(() => saveEditorWidth(editorWidth), [editorWidth])

  // Keeps both panes at least MIN_PANE_PX wide
  function resizeEditor(percent, totalWidth) {
    const min = Math.min(50, (MIN_PANE_PX / totalWidth) * 100)
    setEditorWidth(Math.max(min, Math.min(100 - min, percent)))
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    saveTheme(theme)
  }, [theme])

  // Zoom that makes the page fill the preview pane's width
  function fitToWidth() {
    const availableWidth = previewPaneRef.current.clientWidth - 48 // 24px padding on each side
    setZoom(clampZoom(Math.round((availableWidth / PAGE_WIDTH_PX) * 100)))
  }

  useEffect(() => {
    const observer = new ResizeObserver(fitToWidth)
    observer.observe(previewPaneRef.current)
    return () => observer.disconnect()
  }, [])

  // Load CVs on first render, creating one so the editor is never empty
  useEffect(() => {
    let storedCVs = loadCVs()
    if (storedCVs.length === 0) {
      const defaultCV = createCV('My CV')
      saveCV(defaultCV)
      storedCVs = [defaultCV]
    }
    setCVs(storedCVs)

    const lastActiveId = getActiveId()
    openCV(storedCVs.find(c => c.id === lastActiveId) || storedCVs.find(c => !c.archived) || storedCVs[0])
  }, [])

  // Writes the pending YAML into the *current* stored copy of the CV, so
  // renames/archives made from the sidebar in the meantime are preserved.
  function flushPendingSave() {
    clearTimeout(saveTimerRef.current)
    const pending = pendingSaveRef.current
    if (!pending) return
    pendingSaveRef.current = null

    const storedCV = loadCVs().find(c => c.id === pending.id)
    if (storedCV) {
      saveCV({ ...storedCV, yaml: pending.yaml, updatedAt: new Date().toISOString() })
      setCVs(loadCVs())
    }
  }

  // Don't lose the last keystrokes when the tab is closed within the debounce window
  useEffect(() => {
    window.addEventListener('pagehide', flushPendingSave)
    return () => window.removeEventListener('pagehide', flushPendingSave)
  }, [])

  function handleYamlChange(newYaml) {
    setYamlText(newYaml)
    if (!activeCVIdRef.current) return
    pendingSaveRef.current = { id: activeCVIdRef.current, yaml: newYaml }
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flushPendingSave, AUTOSAVE_DELAY_MS)
  }

  function openCV(cv) {
    activeCVIdRef.current = cv.id
    setActiveCVId(cv.id)
    setActiveId(cv.id)
    setYamlText(cv.yaml)
  }

  function handleSelectCV(id) {
    // Save the CV we're leaving first, then read from storage rather than
    // state so CVs created a moment ago (not yet in `cvs`) can be opened too
    flushPendingSave()
    const cv = loadCVs().find(c => c.id === id)
    if (cv) openCV(cv)
  }

  function handleConfirmExport(chosenName) {
    setShowExportModal(false)
    if (latex.pdf) downloadFile(latex.pdf, `${chosenName}.pdf`, 'application/pdf')
  }

  // The PDF on screen must match the current YAML before it can be downloaded
  const pdfIsCurrent = latex.status === 'ready' && !parseError && !!parsedCV

  const enginePercent = downloadPercent(latex.engineProgress)
  const busyLabel = latex.engineProgress
    ? `loading engine${enginePercent != null ? ` ${enginePercent}%` : '…'}`
    : latex.status === 'compiling' ? 'compiling…' : null

  return (
    <div className="app">
      <Navbar theme={theme} onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} />
      <div className="body">
        <Sidebar cvs={cvs} activeCVId={activeCVId} onSelect={handleSelectCV} onCVsChange={() => setCVs(loadCVs())} />
        <div className="card mainCard">
          <div className="pane" style={{ flex: `0 0 ${editorWidth}%` }}>
            <Editor value={yamlText} onChange={handleYamlChange} error={parseError} parsedCV={parsedCV} theme={theme} />
          </div>
          <Splitter value={editorWidth} onResize={resizeEditor} />
          <div className="pane preview" ref={previewPaneRef}>
            <div className="paneHeader">
              <span className="paneLabel">
                Preview — US Letter
                {busyLabel && (
                  <span className="compileStatus">
                    <span className="spinner sm" aria-hidden="true" />
                    {busyLabel}
                  </span>
                )}
              </span>
              <div className="toolbarGroup">
                <button className="btnIcon filled" onClick={() => setZoom(z => clampZoom(z - 10))} title="Zoom out">−</button>
                <span className="zoomLabel">{zoom}%</span>
                <button className="btnIcon filled" onClick={() => setZoom(z => clampZoom(z + 10))} title="Zoom in">+</button>
                <button className="btnIcon filled" onClick={fitToWidth} title="Fit to width">⊙</button>
              </div>
              <select className="templateSelect" value={template} onChange={e => setTemplate(e.target.value)} title="Template">
                {Object.values(TEMPLATES).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <button className="btn btnPrimary" onClick={() => setShowExportModal(true)} disabled={!pdfIsCurrent}>
                ⬇ Download PDF
              </button>
            </div>
            <PdfPreview pdf={latex.pdf} zoom={zoom} status={latex.status} error={latex.error} engineProgress={latex.engineProgress} />
          </div>
        </div>
      </div>
      {showExportModal && (
        <ExportModal
          defaultName={parsedCV?.name || 'cv'}
          onConfirm={handleConfirmExport}
          onCancel={() => setShowExportModal(false)}
        />
      )}
    </div>
  )
}
