import { useEffect, useRef, useState } from 'react'
import { generateLatex } from './generateLatex'
import { compileLatex, onEngineProgress, preloadLatexEngine } from './engine'
import { extractLatexError } from './escape'

const COMPILE_DELAY_MS = 400

/**
 * Regenerates the .tex source whenever the CV or template changes and
 * compiles it (debounced). The last successful PDF is kept while a new
 * compilation runs or fails, so the preview never goes blank.
 *
 * status: 'idle' | 'compiling' | 'ready' | 'error'
 * engineProgress: see onEngineProgress in ./engine (null once the engine is loaded)
 */
export function useLatexPdf(cvData, templateId) {
  const [state, setState] = useState({ pdf: null, status: 'idle', error: null })
  const [engineProgress, setEngineProgress] = useState(null)
  const latestRequestRef  = useRef(0)

  useEffect(() => {
    const unsubscribe = onEngineProgress(setEngineProgress)
    preloadLatexEngine()
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!cvData) return

    let tex
    try {
      tex = generateLatex(cvData, templateId)
    } catch (e) {
      setState(s => ({ ...s, status: 'error', error: e.message }))
      return
    }

    const requestId = ++latestRequestRef.current
    const isStale   = () => requestId !== latestRequestRef.current

    const timer = setTimeout(async () => {
      setState(s => ({ ...s, status: 'compiling', error: null }))
      try {
        const result = await compileLatex(tex)
        if (isStale()) return
        if (result.ok) setState({ pdf: result.pdf, status: 'ready', error: null })
        else           setState(s => ({ ...s, status: 'error', error: extractLatexError(result.log) }))
      } catch (e) {
        if (!isStale()) setState(s => ({ ...s, status: 'error', error: e.message }))
      }
    }, COMPILE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [cvData, templateId])

  return { ...state, engineProgress }
}
