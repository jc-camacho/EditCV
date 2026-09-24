/**
 * Runs SwiftLaTeX's pdfTeX Web Worker (public/swiftlatex/swiftlatexpdftex.js)
 * inside Node, so the TeX bundle can be generated and tested without a browser.
 *
 * The worker is evaluated in a vm context that looks like a Worker global:
 * `self`, `postMessage`, `onmessage` and a synchronous XMLHttpRequest whose
 * responses come from the `resolveFile(url)` callback instead of the network.
 *
 * Without `files` every request reaches resolveFile (to discover what pdfTeX
 * needs); with `files` the worker is restricted to that manifest, exactly as
 * in the browser.
 */
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const ENGINE_DIR = new URL('../public/swiftlatex/', import.meta.url).pathname

export async function createEngine({ resolveFile, files = null, verbose = false }) {
  const listeners = []

  class XMLHttpRequest {
    open(_method, url) { this.url = url }
    send() {
      const hit = resolveFile(this.url)
      this.status   = hit ? 200 : 404
      this.response = hit ? toArrayBuffer(hit.data) : null
      this.headers  = hit?.headers || {}
    }
    getResponseHeader(name) { return this.headers[name] ?? null }
  }

  const context = {
    console: verbose ? console : { ...console, log() {}, error() {} },
    XMLHttpRequest,
    WebAssembly, TextDecoder, TextEncoder, performance,
    setTimeout, clearTimeout, Uint8Array, ArrayBuffer,
    // The worker resets `Module`, so the .wasm is handed over through fetch
    location: { href: 'http://engine.local/swiftlatexpdftex.js' },
    fetch: async () => new Response(fs.readFileSync(path.join(ENGINE_DIR, 'swiftlatexpdftex.wasm')), {
      headers: { 'content-type': 'application/wasm' },
    }),
    postMessage: data => listeners.shift()?.(data),
  }
  context.self = context
  vm.createContext(context)

  const next = () => new Promise(resolve => listeners.push(resolve))
  const ready = next()
  vm.runInContext(fs.readFileSync(path.join(ENGINE_DIR, 'swiftlatexpdftex.js'), 'utf8'), context)
  const first = await ready
  if (first?.result !== 'ok') throw new Error('Engine failed to start: ' + JSON.stringify(first))

  const send = data => context.self.onmessage({ data })
  const request = data => { const reply = next(); send(data); return reply }

  context.self.texlive_endpoint = 'http://texlive.local/'
  if (files) send({ cmd: 'settexlivefiles', files })
  else context.self.texlive_files = { has: () => true }

  return {
    writeFile: (name, src) => request({ cmd: 'writefile', url: name, src }),
    compileFormat: () => request({ cmd: 'compileformat' }),
    addTexFile: (key, src) => send({ cmd: 'addtexfile', key, name: path.basename(key), src }),
    async compile(source, mainFile = 'main.tex') {
      await request({ cmd: 'writefile', url: mainFile, src: source })
      send({ cmd: 'setmainfile', url: mainFile })
      return request({ cmd: 'compilelatex' })
    },
  }
}

function toArrayBuffer(data) {
  const bytes = new Uint8Array(data)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}
