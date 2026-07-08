import { useState, useEffect, useRef, useCallback } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { TemplateProvider, useTemplate } from './context/TemplateContext'
import { TEMPLATES } from './templates/index'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import Editor from './components/Editor/Editor'
import CVPreview from './components/CVPreview/CVPreview'
import ExportModal from './components/ExportModal/ExportModal'
import { parseCV } from './utils/yamlParser'
import { loadCVs, saveCV, createCV, getActiveId, setActiveId } from './utils/storage'
import { exportToPDF } from './utils/pdfExport.jsx'

/**
 * AppInner is the real application shell. It lives inside ThemeProvider and
 * TemplateProvider so it can consume both contexts via their hooks.
 *
 * State flow:
 *   user edits YAML / form
 *     → yamlText changes
 *     → parsedCV is recomputed
 *     → CVPreview re-renders
 *     → auto-save fires after 600 ms of inactivity
 */
function AppInner() {
  const [cvs, setCVs]             = useState([])          // Full list of CVs stored in localStorage
  const [activeCVId, setActiveCVId] = useState(null)      // ID of the CV currently open in the editor
  const [yamlText, setYamlText]   = useState('')           // Raw YAML string in the editor
  const [parsedCV, setParsedCV]   = useState(null)         // Parsed CV data object (null when YAML is invalid)
  const [parseError, setParseError] = useState(null)       // YAML parse error message, if any
  const [exporting, setExporting] = useState(false)        // True while PDF export is in progress
  const [zoom, setZoom]           = useState(100)          // Preview zoom level (25–200)
  const [showExportModal, setShowExportModal] = useState(false) // Filename prompt before export

  const saveTimerRef    = useRef(null)      // Holds the debounce timer ID for auto-save
  const previewPaneRef  = useRef(null)      // Ref to the preview pane DOM element for ResizeObserver

  const { template, setTemplate } = useTemplate()

  // ── Responsive zoom: fit the page to the available pane width ────────────
  useEffect(() => {
    const paneEl = previewPaneRef.current
    if (!paneEl) return

    const observer = new ResizeObserver(() => {
      // 816px is the fixed width of a US Letter page at 96dpi
      const availableWidth = paneEl.clientWidth - 48 // subtract 24px padding on each side
      const fittedZoom     = Math.round((availableWidth / 816) * 100)
      setZoom(Math.max(25, Math.min(200, fittedZoom)))
    })

    observer.observe(paneEl)
    return () => observer.disconnect()
  }, [])

  // ── Bootstrap: load CVs from localStorage on first render ────────────────
  useEffect(() => {
    let storedCVs = loadCVs()

    // If there are no saved CVs yet, create a default one so the editor is never empty
    if (storedCVs.length === 0) {
      const defaultCV = createCV('My CV')
      saveCV(defaultCV)
      storedCVs = [defaultCV]
    }

    setCVs(storedCVs)

    // Restore the last active CV, falling back to the first one
    const lastActiveId = getActiveId()
    const activeCV     = storedCVs.find(c => c.id === lastActiveId)
      || storedCVs.find(c => !c.archived)
      || storedCVs[0]
    setActiveCVId(activeCV.id)
    setActiveId(activeCV.id)
    setYamlText(activeCV.yaml)
  }, [])

  // ── Live parse: re-parse YAML on every keystroke ──────────────────────────
  useEffect(() => {
    const { data, error } = parseCV(yamlText)
    setParsedCV(data)
    setParseError(error)
  }, [yamlText])

  // ── Auto-save: debounce saves so we don't hammer localStorage ────────────
  useEffect(() => {
    if (!activeCVId || !yamlText) return

    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const currentCV = cvs.find(c => c.id === activeCVId)
      if (currentCV) {
        const updatedCV = { ...currentCV, yaml: yamlText, updatedAt: new Date().toISOString() }
        saveCV(updatedCV)
        setCVs(loadCVs()) // Refresh the sidebar list after saving
      }
    }, 600)

    return () => clearTimeout(saveTimerRef.current)
  }, [yamlText, activeCVId])

  function handleSelectCV(id) {
    const cv = cvs.find(c => c.id === id)
    if (!cv) return
    setActiveCVId(id)
    setActiveId(id)
    setYamlText(cv.yaml)
  }

  // Called by Sidebar after any create/delete/rename operation
  function handleCVsChange() {
    setCVs(loadCVs())
  }

  const handleExport = useCallback(async (chosenName) => {
    if (!parsedCV || exporting) return
    setExporting(true)
    try {
      const filename = `${chosenName || parsedCV?.name || 'cv'}.pdf`
      await exportToPDF(parsedCV, filename, template)
    } finally {
      setExporting(false)
    }
  }, [parsedCV, exporting, template])

  function handleConfirmExport(chosenName) {
    setShowExportModal(false)
    handleExport(chosenName)
  }

  return (
    <div className="app">
      <Navbar />
      <div className="body">
        <Sidebar
          cvs={cvs}
          activeCVId={activeCVId}
          onSelect={handleSelectCV}
          onCVsChange={handleCVsChange}
        />
        <div className="mainCard">
          <div className="editorPane">
            <Editor value={yamlText} onChange={setYamlText} error={parseError} parsedCV={parsedCV} />
          </div>
          <div className="previewPane" ref={previewPaneRef}>
            <div className="previewToolbar">
              <span className="previewLabel">Preview — US Letter</span>
              <div className="zoomControls">
                <button className="zoomBtn" onClick={() => setZoom(z => Math.max(25, z - 10))}  title="Zoom out">−</button>
                <span className="zoomLabel">{zoom}%</span>
                <button className="zoomBtn" onClick={() => setZoom(z => Math.min(200, z + 10))} title="Zoom in">+</button>
                <button className="zoomBtn zoomReset" onClick={() => setZoom(100)} title="Reset zoom">⊙</button>
              </div>
              <select
                className="templateSelect"
                value={template}
                onChange={e => setTemplate(e.target.value)}
                title="Template"
              >
                {Object.values(TEMPLATES).map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <button
                className="exportBtn"
                onClick={() => setShowExportModal(true)}
                disabled={exporting || !!parseError || !parsedCV}
              >
                {exporting ? 'Exporting...' : '⬇ Download PDF'}
              </button>
            </div>
            <CVPreview cvData={parsedCV} zoom={zoom} />
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

export default function App() {
  return (
    <ThemeProvider>
      <TemplateProvider>
        <AppInner />
      </TemplateProvider>
    </ThemeProvider>
  )
}
