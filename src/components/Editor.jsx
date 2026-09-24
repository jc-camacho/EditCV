import { lazy, Suspense, useState } from 'react'
import FormEditor from './FormEditor'

// Only downloaded when the YAML tab is opened
const MonacoEditor = lazy(() => import('@monaco-editor/react'))

// Stable reference so Monaco doesn't re-apply options on every render
const MONACO_OPTIONS = {
  fontSize: 13,
  fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  foldingStrategy: 'indentation',
  showFoldingControls: 'always',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  scrollbar: { vertical: 'visible', horizontal: 'visible', verticalScrollbarSize: 6, horizontalScrollbarSize: 6, useShadows: false },
  overviewRulerLanes: 0,
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  tabSize: 2,
  renderLineHighlight: 'all',
  cursorBlinking: 'smooth',
  smoothScrolling: true,
  bracketPairColorization: { enabled: true },
  guides: { indentation: true, bracketPairs: true },
  renderWhitespace: 'selection',
  padding: { top: 8, bottom: 8 },
}

const MODES = [['form', 'Form'], ['yaml', 'YAML']]

export default function Editor({ value, onChange, error, parsedCV, theme }) {
  const [mode, setMode] = useState('form')

  return (
    <>
      <div className="paneHeader">
        <span className="paneLabel">{mode === 'yaml' ? 'YAML Editor' : 'Form Editor'}</span>
        <div className="toolbarGroup">
          {error && mode === 'yaml' && <span className="errorBadge">Syntax Error</span>}
          <div className="segmented">
            {MODES.map(([id, label]) => (
              <button key={id} className={mode === id ? 'active' : ''} onClick={() => setMode(id)}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'yaml' ? (
        <>
          <div className="monacoContainer">
            <Suspense fallback={null}>
              <MonacoEditor
                language="yaml"
                theme={theme === 'light' ? 'vs' : 'vs-dark'}
                value={value}
                onChange={val => onChange(val ?? '')}
                options={MONACO_OPTIONS}
              />
            </Suspense>
          </div>
          {error && <div className="errorBox flat">{error}</div>}
        </>
      ) : (
        <FormEditor cvData={parsedCV} onYamlChange={onChange} />
      )}
    </>
  )
}
