/**
 * Builds public/swiftlatex/pdftex/: every TeX file the CV templates need, so pdfLaTeX
 * runs entirely in the browser without contacting any TeX Live server.
 *
 *   node scripts/build-texlive-bundle.mjs
 *
 * Requires a local TeX Live (kpsewhich) as the source of the files. Missing
 * packages can be dropped into scripts/texlive-extra/.
 *
 * Steps:
 *   1. Build pdflatex.fmt with the WASM engine itself (a format is only valid
 *      for the exact pdfTeX binary that produced it).
 *   2. Compile a sample CV and a character-coverage document with every
 *      template, recording each file pdfTeX asks for.
 *   3. Copy those files to public/swiftlatex/pdftex/<format>/<name> and write
 *      manifest.json, so the worker never requests a file that isn't there.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { createServer } from 'vite'
import { createEngine } from './swiftlatex-node.mjs'

const ROOT      = path.resolve(new URL('..', import.meta.url).pathname)
const EXTRA_DIR = path.join(ROOT, 'scripts/texlive-extra')
const OUT_DIR   = path.join(ROOT, 'public/swiftlatex/pdftex')

// kpathsea format ids (as sent by the worker) → default file extension
const FORMAT_EXT = { 3: '.tfm', 10: '.fmt', 11: '.map', 32: '.pfb', 33: '.vf', 44: '.enc' }

const used = new Map() // "<format>/<name>" → source path, or a Buffer for the format
let formatFile = null

function locate(format, name) {
  if (format === '10') return formatFile
  for (const candidate of [name, name + (FORMAT_EXT[format] ?? '')]) {
    const extra = path.join(EXTRA_DIR, candidate)
    if (fs.existsSync(extra)) return extra
    try {
      const found = execFileSync('kpsewhich', [candidate], { encoding: 'utf8' }).trim()
      if (found) return found
    } catch { /* not found */ }
  }
  return null
}

function resolveFile(url) {
  const key = url.match(/pdftex\/(.+)$/)[1]
  const [format, ...rest] = key.split('/')
  const source = locate(format, rest.join('/'))
  if (!source) return null
  used.set(key, source)
  return { data: Buffer.isBuffer(source) ? source : fs.readFileSync(source), headers: { fileid: rest.join('/') } }
}

async function loadGenerator() {
  const vite = await createServer({ root: ROOT, logLevel: 'error', server: { middlewareMode: true } })
  try {
    const { generateLatex } = await vite.ssrLoadModule('/src/latex/generateLatex.js')
    const { escapeLatex }   = await vite.ssrLoadModule('/src/latex/escape.js')
    const { parseCV }       = await vite.ssrLoadModule('/src/utils/yamlParser.js')
    const { createCV }      = await vite.ssrLoadModule('/src/utils/storage.js')
    const { TEMPLATES }     = await vite.ssrLoadModule('/src/latex/templates/index.js')
    return { generateLatex, escapeLatex, parseCV, createCV, TEMPLATES }
  } finally {
    await vite.close()
  }
}

// Every character escapeLatex lets through, in every font shape the templates can produce
function coverageDocument(preamble, escapeLatex) {
  const chars = []
  for (let c = 0x20; c <= 0x17f; c++) if (c <= 0x7e || c >= 0xa0) chars.push(String.fromCodePoint(c))
  const text = escapeLatex(chars.join('') + '–—‘’‚“”„†‡•…‰‹›€™')
  // Shapes the generator emits: **bold**, *italic*, italic subtitles, and both nested
  const lines = [
    text,
    `\\textbf{${text}}`,
    `\\emph{${text}}`,
    `\\textit{${text} \\emph{${text}}}`,
    `\\textbf{\\emph{${text}}}`,
  ].map(line => `{${line}\\par}`)
  return [
    preamble,
    '\\begin{document}',
    ...lines,
    '\\begin{itemize}\\item a \\begin{itemize}\\item b \\begin{itemize}\\item c\\end{itemize}\\end{itemize}\\end{itemize}',
    '\\href{https://example.com}{link} \\textbullet{} \\textendash{} \\textemdash',
    '\\end{document}',
  ].join('\n')
}

function assertCompiled(label, result) {
  const problems = result.log.split('\n').filter(line =>
    // Font-shape substitutions are normal LaTeX behaviour (pdflatex does the same)
    line.startsWith('!') || /Missing character|not loadable|cannot open|cannot find/i.test(line))
  if (result.status !== 0 || !result.pdf || problems.length) {
    console.error(result.log.slice(-3000))
    throw new Error(`${label}: compilation failed\n${problems.join('\n')}`)
  }
  console.log(`  ✓ ${label} (${(result.pdf.byteLength / 1024).toFixed(0)} KB PDF)`)
}

const { generateLatex, escapeLatex, parseCV, createCV, TEMPLATES } = await loadGenerator()
const sampleCV = parseCV(createCV('Mario Mendoza').yaml).data

console.log('Building pdflatex.fmt with the WASM engine…')
const formatEngine = await createEngine({ resolveFile })
const format = await formatEngine.compileFormat()
if (format.status !== 0) throw new Error('Format build failed:\n' + format.log.slice(-2000))
formatFile = Buffer.from(format.pdf) // the worker returns the .fmt in the `pdf` field
used.clear() // the format's own inputs are baked into it

const documents = Object.keys(TEMPLATES).flatMap(templateId => [
  [`${templateId}: sample CV`, generateLatex(sampleCV, templateId)],
  [`${templateId}: character coverage`, coverageDocument(TEMPLATES[templateId].preamble, escapeLatex)],
])

console.log('Compiling templates against TeX Live…')
for (const [label, source] of documents) {
  // Fresh engine per document, like a new browser session
  const engine = await createEngine({ resolveFile })
  assertCompiled(label, await engine.compile(source))
}

// The format is by far the largest file: ship it gzipped and let the browser inflate it
const FORMAT_KEY = [...used.keys()].find(key => key.startsWith('10/'))
const preload = { [FORMAT_KEY]: FORMAT_KEY + '.gz' }

fs.rmSync(OUT_DIR, { recursive: true, force: true })
let total = 0
for (const [key, source] of used) {
  const data = key === FORMAT_KEY ? zlib.gzipSync(source, { level: 9 }) : fs.readFileSync(source)
  const target = path.join(OUT_DIR, preload[key] ?? key)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, data)
  total += data.length
}
const files = [...used.keys()].filter(key => key !== FORMAT_KEY).sort()
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify({ preload, files }, null, 1) + '\n')
console.log(`Wrote ${used.size} files (${(total / 1048576).toFixed(1)} MB) to public/swiftlatex/pdftex/`)

// Same protocol as src/latex/engine.js: manifest-restricted, no server headers
console.log('Verifying the bundle on its own…')
const fromBundle = url => {
  const target = path.join(OUT_DIR, url.match(/pdftex\/(.+)$/)[1])
  return fs.existsSync(target) ? { data: fs.readFileSync(target) } : null
}
for (const [label, source] of documents) {
  const engine = await createEngine({ resolveFile: fromBundle, files })
  for (const [key, file] of Object.entries(preload)) {
    engine.addTexFile(key, zlib.gunzipSync(fs.readFileSync(path.join(OUT_DIR, file))))
  }
  assertCompiled(label, await engine.compile(source))
}
