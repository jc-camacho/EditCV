/**
 * In-browser pdfLaTeX, powered by SwiftLaTeX's WebAssembly build of pdfTeX.
 *
 * The engine files are not on npm, so they are served from
 * public/swiftlatex/ (see README → "LaTeX engine setup"):
 *   swiftlatexpdftex.js    – Web Worker wrapping the WASM binary
 *   swiftlatexpdftex.wasm
 *
 * We talk to the worker directly (same message protocol as SwiftLaTeX's
 * PdfTeXEngine.js) so the worker URL is under our control.
 *
 * Every TeX file the templates need (format, packages, fonts) is packed into
 * public/swiftlatex/pdftex/bundle.<hash>.gz by scripts/build-texlive-bundle.mjs, so
 * nothing is requested from outside the app's own origin. The whole archive is
 * downloaded once, in parallel with the engine, and handed to the worker before
 * the first compile: left alone, the worker would fetch each file with its own
 * synchronous request, one round trip after another. index.html preloads the
 * manifest and the archive (see vite.config.js), so the download starts with
 * the page instead of after React mounts; plain fetch() calls reuse them. The worker is also patched
 * to only request files listed in the manifest (see public/swiftlatex/README.md).
 */

const ENGINE_DIR = `${import.meta.env.BASE_URL}swiftlatex/`
const ENGINE_URL = `${ENGINE_DIR}swiftlatexpdftex.js`
const BUNDLE_URL = `${ENGINE_DIR}pdftex/`
const MAIN_FILE  = 'main.tex'

let worker       = null
let readyPromise = null
let queue        = Promise.resolve() // pdfTeX can only run one compilation at a time

/**
 * Engine start-up progress, for the UI. pdfTeX reports nothing while it
 * compiles, but downloading the TeX bundle (the slow part on a first visit)
 * can be measured:
 *   { phase: 'download', loaded, total }  bytes so far; total is 0 when unknown
 *   { phase: 'prepare' }                  unpacking the bundle, booting the worker
 *   null                                  not loading (ready, or not started)
 */
let loadProgress = null
const progressListeners = new Set()

function reportProgress(progress) {
  loadProgress = progress
  for (const listener of progressListeners) listener(progress)
}

/** Calls `listener` with the current progress now and on every change; returns an unsubscribe function. */
export function onEngineProgress(listener) {
  progressListeners.add(listener)
  listener(loadProgress)
  return () => progressListeners.delete(listener)
}

async function fetchBundleFile(path) {
  const response = await fetch(BUNDLE_URL + path)
  if (!response.ok) throw new Error(`Could not load ${BUNDLE_URL}${path} (HTTP ${response.status}).`)
  return response
}

/** Reads the whole body, reporting each chunk as download progress. */
async function download(response) {
  // Content-Length is the size on the wire: when the server compresses on the
  // fly the body yields more bytes than that, so the total is unknown
  const total  = response.headers.get('content-encoding') ? 0 : Number(response.headers.get('content-length')) || 0
  const reader = response.body.getReader()
  const chunks = []
  let loaded   = 0
  reportProgress({ phase: 'download', loaded, total })
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    reportProgress({ phase: 'download', loaded, total })
  }
  const data = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length }
  return data
}

async function inflate(data) {
  // The server may already have removed the gzip layer (Content-Encoding)
  if (data[0] !== 0x1f || data[1] !== 0x8b) return data.buffer
  return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
}

/** The manifest plus every file in the archive, ready to hand to the worker. */
async function loadBundle() {
  const manifest = await (await fetchBundleFile('manifest.json')).json()
  const packed   = await download(await fetchBundleFile(manifest.bundle))
  reportProgress({ phase: 'prepare' })
  const archive  = await inflate(packed)
  const preload  = manifest.entries.map(([key, offset, length]) => ({
    key,
    name: key.split('/').pop(),
    src:  archive.slice(offset, offset + length), // own buffer, so it can be transferred
  }))
  return { files: manifest.files, preload }
}

function startEngine() {
  if (readyPromise) return readyPromise

  const bundle = loadBundle()
  const booted = new Promise((resolve, reject) => {
    worker = new Worker(ENGINE_URL)
    worker.onmessage = event => {
      if (event.data?.result === 'ok') resolve()
      else reject(new Error('The LaTeX engine failed to initialise.'))
    }
    worker.onerror = () => reject(new Error(
      `Could not load the LaTeX engine from ${ENGINE_URL}. ` +
      'Make sure public/swiftlatex/ contains swiftlatexpdftex.js and swiftlatexpdftex.wasm.'
    ))
  })

  readyPromise = Promise.all([booted, bundle])
    .then(([, { files, preload }]) => {
      worker.onmessage = null
      worker.onerror   = null
      // The worker resolves relative URLs against its own script, so pass an absolute one
      worker.postMessage({ cmd: 'settexliveurl', url: new URL(ENGINE_DIR, location.href).href })
      worker.postMessage({ cmd: 'settexlivefiles', files })
      for (const file of preload) worker.postMessage({ cmd: 'addtexfile', ...file }, [file.src])
      reportProgress(null)
    })
    .catch(error => {
      reportProgress(null)
      // Allow a later retry instead of caching the failure forever
      worker?.terminate()
      worker       = null
      readyPromise = null
      throw error
    })

  return readyPromise
}

async function runCompilation(source) {
  await startEngine()

  return new Promise((resolve, reject) => {
    worker.onmessage = event => {
      const data = event.data
      if (data?.cmd !== 'compile') return // e.g. the 'writefile' acknowledgement
      worker.onmessage = null
      worker.onerror   = null
      resolve({
        ok:  data.status === 0 && !!data.pdf,
        pdf: data.pdf ? new Uint8Array(data.pdf) : null,
        log: data.log || '',
      })
    }
    worker.onerror = () => {
      // Start from a fresh worker on the next compilation
      worker.terminate()
      worker       = null
      readyPromise = null
      reject(new Error('The LaTeX engine crashed during compilation.'))
    }

    worker.postMessage({ cmd: 'writefile', url: MAIN_FILE, src: source })
    worker.postMessage({ cmd: 'setmainfile', url: MAIN_FILE })
    worker.postMessage({ cmd: 'compilelatex' })
  })
}

/**
 * Compiles a complete .tex document to PDF.
 * Resolves with { ok, pdf: Uint8Array | null, log }.
 */
export function compileLatex(source) {
  const result = queue.then(() => runCompilation(source))
  queue = result.catch(() => {})
  return result
}

/** Starts downloading the engine early so the first preview appears sooner. */
export function preloadLatexEngine() {
  startEngine().catch(() => {})
}
