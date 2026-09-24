# ✦ EditCV

> **Build professional CVs using a form or plain YAML — Harvard, Classic, or Modern style.**
> No accounts, no servers, no limits — everything runs in your browser.

![Status](https://img.shields.io/badge/status-in%20development-yellow?style=flat-square)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite-61dafb?style=flat-square&logo=react)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Table of Contents

- [What is EditCV?](#what-is-editcv)
- [Features](#features)
- [Getting Started](#getting-started)
- [Interface Layout](#interface-layout)
- [Form Editor](#form-editor)
- [YAML Editor](#yaml-editor)
- [YAML Structure](#yaml-structure)
- [Automatic Entry Type Detection](#automatic-entry-type-detection)
- [Inline Markdown](#inline-markdown)
- [LaTeX Rendering](#latex-rendering)
- [Persistence](#persistence)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Tech Stack](#tech-stack)
- [Design Decisions](#design-decisions)
- [Roadmap](#roadmap)

---

## What is EditCV?

EditCV is a web app that generates a professional CV from a form or a YAML file, with three available templates:

| Template | Style |
|---|---|
| **Harvard** | Times New Roman, centered section titles, horizontal rules — the standard at MIT, Harvard, and Stanford |
| **Classic** | Clean serif layout, left-aligned titles |
| **Modern** | Contemporary sans-serif design with subtle visual hierarchy |

Fill in your information and the app turns it into a **LaTeX** document, compiles it with pdfLaTeX **inside your browser** (WebAssembly), and shows the resulting PDF in **US Letter (8.5" × 11")** format. The output is a real, text-based PDF ready to send: selectable, searchable, and readable by ATS parsers.

---

## Features

| Feature | Description |
|---|---|
| 📋 **Form editor** | Visual UI with fields per entry type — no YAML required |
| 📝 **YAML editor** | Full Monaco editor with syntax highlighting and error detection |
| 🔀 **Mode toggle** | Switch between Form and YAML at any time — data stays in sync |
| 👁 **Live preview** | The compiled PDF refreshes shortly after every change |
| 🎨 **3 templates** | Harvard (Times New Roman), Classic, and Modern — switchable from the preview toolbar |
| ➕ **Custom sections** | Add any section with any name you want |
| ↕ **Reorder sections** | Move sections up/down with ↑↓ buttons — order is reflected in the PDF |
| ✎ **Rename sections** | Inline name editing directly in the section header |
| 💾 **Autosave** | Every change is saved to `localStorage` with a 600ms debounce |
| 📂 **Multiple CVs** | Create, rename, and delete CVs from the sidebar |
| ⬇ **PDF export** | Downloads exactly the PDF shown in the preview |
| 🔍 **Preview zoom** | Control the preview zoom level (25% – 250%) |
| ↔ **Resizable panes** | Drag the divider between editor and preview (arrow keys also work; double-click resets) |
| 🌙 **Dark / Light mode** | Theme toggle in the navbar, persisted across sessions |
| 🔌 **No backend** | No server, no database, no tracking — LaTeX and its fonts ship with the app, so nothing is fetched from third parties |

---

## Getting Started

### Requirements

- Node.js 18+
- npm 9+

### Install & run

```bash
# 1. Clone the repository
git clone https://github.com/your-user/editcv.git
cd editcv

# 2. Install dependencies
npm install

# 3. Start the dev server (the LaTeX engine and its TeX files are already
#    in public/swiftlatex/ — see public/swiftlatex/README.md)
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

---

## Interface Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ✦ EditCV                                                    [ ☀ / ☾ ]  │  ← Fixed navbar
└──────────────────────────────────────────────────────────────────────────┘
┌───────────────┬──────────────────────────┬───────────────────────────────┐
│               │                          │                               │
│  + New CV     │  ┌──── Form │ YAML ────┐ │  Preview — US Letter    🔍±  │
│  ──────────── │  │                     │ │  ─────────────────────────── │
│  ● My CV      │  │  Personal Info      │ │  ┌───────────────────────┐   │
│    Work       │  │  Social Networks    │ │  │     MARIO MENDOZA      │   │
│    Academic   │  │  ▸ Education    3   │ │  │  Software Engineer     │   │
│               │  │  ▸ Experience   3   │ │  │  email · phone · web   │   │
│               │  │  ▸ Skills       4   │ │  ├──────── Education ─────│   │
│               │  │  ▸ Publications 2   │ │  │  University ...   2020 │   │
│               │  │                     │ │  ├────── Experience ──────│   │
│               │  │  + New Section      │ │  │  Company ...     2022– │   │
│               │  └─────────────────────┘ │  └───────────────────────┘   │
│  Sidebar      │  Editor (Form / YAML)    │  Preview (scrollable)         │
│  220px fixed  │  flex: 1                 │  flex: 1                      │
└───────────────┴──────────────────────────┴───────────────────────────────┘
```

- **Sidebar** (220px): CV list with create, rename, and delete buttons
- **Editor**: toggles between Form Editor and YAML Editor via a header switch
- **Preview**: letter-size page with zoom control, PDF export button, and its own scroll

---

## Form Editor

The Form Editor is the default mode. It provides a visual interface that builds the YAML behind the scenes — no code required.

```
┌─ Personal Info ─────────────────────────────────────────────┐
│  Full Name   [ Mario Mendoza                              ]  │
│  Headline    [ Software Engineer & ML Researcher          ]  │
│  Location    [ Santa Cruz, Bolivia ]  Email [ mario@... ]   │
│  Phone       [ +591 7 123 4567    ]  Website[ mario.dev  ]  │
└─────────────────────────────────────────────────────────────┘

┌─ Social Networks ───────────────────────────────────────────┐
│  [ LinkedIn        ] [ mario-mendoza              ]  [ × ]  │
│  [ GitHub          ] [ mmendoza-dev               ]  [ × ]  │
│  + Add Network                                              │
└─────────────────────────────────────────────────────────────┘

┌─ Sections ──────────────────────────────────────────────────┐
│  ▸ Education                    3   [ ↑ ][ ↓ ][ ✎ ][ × ]  │
│  ▾ Experience                   3   [ ↑ ][ ↓ ][ ✎ ][ × ]  │
│  │                                                          │
│  │  ┌── #1 ──────────────── [ ↑ ][ ↓ ][ × ] ───────────┐  │
│  │  │  Company   [ Jalasoft                            ] │  │
│  │  │  Position  [ Senior Software Engineer            ] │  │
│  │  │  Start     [ 2022-01 ]  End [ ──────── ] ☑ Present│  │
│  │  │  Location  [ Cochabamba, Bolivia (Remote)        ] │  │
│  │  │  Highlights                              + Add    │  │
│  │  │  [ Led migration to microservices…           ] [×]│  │
│  │  │  [ Mentored 6 junior engineers               ] [×]│  │
│  │  └───────────────────────────────────────────────────┘  │
│  │                                                          │
│  │  + Add Experience                                        │
│                                                             │
│  ▸ Skills                       4   [ ↑ ][ ↓ ][ ✎ ][ × ]  │
│  ▸ Selected Honors              4   [ ↑ ][ ↓ ][ ✎ ][ × ]  │
│                                                             │
│  ╔═══════════════════════════════╗                          │
│  ║  + New Section                ║                          │
│  ╚═══════════════════════════════╝                          │
└─────────────────────────────────────────────────────────────┘
```

### Available entry types

Each section has an entry type that determines which fields appear in the form:

| Type | Available fields |
|---|---|
| **Education** | Institution, Field of Study, Degree, Start/End date, Location, Highlights |
| **Experience** | Company, Position, Start/End date, Location, Summary, Highlights |
| **Project** | Name (markdown), Start/End date or single Date, Summary, Highlights |
| **Publication** | Title, Authors, Journal, DOI, URL, Date |
| **Skill** | Label, Details |
| **Bullet / Honor** | Bullet (free text) |

### Adding a new section

Click **+ New Section**. A modal appears where you type a name and pick an entry type:

```
┌─ New Section ──────────────────────────────┐
│  Section Name  [ Certifications          ] │
│                                            │
│  Entry Type                                │
│  ┌────────────┐  ┌────────────────────┐   │
│  │ Education  │  │ Experience         │   │
│  └────────────┘  └────────────────────┘   │
│  ┌────────────┐  ┌────────────────────┐   │
│  │ Projects   │  │ Publications       │   │
│  └────────────┘  └────────────────────┘   │
│  ┌────────────┐  ┌────────────────────┐   │
│  │ Skills     │  │ ● Bullets/Honors   │   │
│  └────────────┘  └────────────────────┘   │
│                                            │
│              [ Cancel ] [ Add Section ]    │
└────────────────────────────────────────────┘
```

The name is automatically converted to `snake_case` as the YAML key, and displayed as a formatted title everywhere in the UI and the CV:

| You type | YAML key | Displayed as |
|---|---|---|
| `Certifications` | `certifications` | **Certifications** |
| `Invited Talks` | `invited_talks` | **Invited Talks** |
| `Selected Honors` | `selected_honors` | **Selected Honors** |

### Managing and reordering sections

Each section header has four action buttons:

```
┌─ Education   3 ──────────────────── [ ↑ ][ ↓ ][ ✎ ][ × ] ─┐
```

| Button | Action |
|---|---|
| **↑** | Move section one position up (disabled on the first section) |
| **↓** | Move section one position down (disabled on the last section) |
| **✎** | Start inline rename — press Enter to confirm, Escape to cancel |
| **×** | Delete the section and all its entries |

The order of sections in the form is the order they appear in the CV and the PDF.

---

## YAML Editor

Click **YAML** in the header toggle to see and edit the full YAML that represents your CV.

```
┌─ YAML Editor ──────────────────────────── [ Form | YAML ] ──┐
│                                                              │
│  1  cv:                                                      │
│  2    name: "Mario Mendoza"                                  │
│  3    headline: Software Engineer & ML Researcher            │
│  4    location: Santa Cruz de la Sierra, Bolivia             │
│  5    email: mario@email.com                                 │
│  6    phone: +591 7 123 4567                                 │
│  7    website: https://mario.dev                             │
│  8    social_networks:                                       │
│  9      - network: LinkedIn                                  │
│ 10        username: mario-mendoza                            │
│ 11    sections:                                              │
│ 12      education:                                           │
│ 13        - institution: Universidad Autónoma...             │
│    ...                                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
│ ⚠ Syntax error on line 13: unexpected token                  │  ← only shown on error
└──────────────────────────────────────────────────────────────┘
```

The editor uses **Monaco** (the same engine as VS Code) with:
- YAML syntax highlighting
- Block folding
- Line numbers
- Real-time syntax error detection
- Theme that follows the app's dark/light mode

Any change in the YAML is immediately reflected in the form and in the preview.

---

## YAML Structure

The document must have a root `cv:` key. All fields are optional except `name`.

```yaml
cv:
  # ── Personal info ──────────────────────────────────────────
  name: "Your Full Name"
  headline: "Your professional title"
  location: "City, Country"
  email: "you@email.com"
  phone: "+1 234 567 890"
  website: "https://yoursite.com"

  # ── Social networks ────────────────────────────────────────
  social_networks:
    - network: LinkedIn
      username: your-username
    - network: GitHub
      username: your-username

  # ── Sections ───────────────────────────────────────────────
  sections:

    education:
      - institution: "University Name"
        area: "Field of Study"
        degree: "PhD / MSc / BS / BA"
        start_date: 2018-09           # format: YYYY-MM
        end_date: 2023-05
        location: "City, Country"
        highlights:
          - "Thesis, honors, GPA, etc."

    experience:
      - company: "Company Name"
        position: "Your Job Title"
        start_date: 2022-01
        end_date: present             # use "present" for current jobs
        location: "City, Country (Remote)"
        summary: "Optional prose description of the role."
        highlights:
          - "Achievement with **concrete metrics**"
          - "Another key responsibility"

    projects:
      - name: "[Project Name](https://link.com)"   # markdown links work
        start_date: 2023-01
        end_date: present
        summary: "Short project description"
        highlights:
          - "Technical detail or achievement"

      - name: "Project with a single date"
        date: '2022'                  # alternative to start_date/end_date
        summary: "Description"
        highlights:
          - "Achievement"

    publications:
      - title: "Paper Title"
        authors:
          - "*Your Name*"             # asterisks = italic (marks lead author)
          - "Co-author One"
          - "Co-author Two"
        journal: "NeurIPS 2023"
        date: 2023-07
        doi: 10.1234/example.5678
        url: https://paper-url.com

    skills:
      - label: "Languages"
        details: "Python, JavaScript, Go, SQL"
      - label: "Infrastructure"
        details: "Docker, Kubernetes, AWS, Terraform"

    # Simple bullets — for honors, awards, talks, patents, etc.
    selected_honors:
      - bullet: "National Innovation Award (2023)"
      - bullet: "Exchange Scholarship — University of Chile (2019)"

    # You can create any section with any name:
    certifications:
      - bullet: "AWS Certified Solutions Architect (2023)"
      - bullet: "Google Cloud Professional Data Engineer (2022)"

    invited_talks:
      - bullet: "Keynote — LatamConf 2023, Bogotá"
      - bullet: "NLP Workshop — UAGRM 2022"
```

---

## Automatic Entry Type Detection

The renderer detects which component to use based on the **fields present** in each entry, not on the section name. This means you can name your sections anything you want.

```
Has "institution"?                           → \cveducation
Has "company"?                               → \cventry
Has "title" AND "authors"?                   → \cvpublication
Has "name" AND ("start_date" OR "date" OR "highlights")? → \cventry (project)
Has "label" AND "details"?                   → \cvskill
Has "bullet"?                                → cvbullets list
Has "reversed_number" or "number"?           → cvbullets list
Is a plain string / has "summary"?           → \cvtext (free text)
```

**Example:** you can name a section `jobs` instead of `experience` and it will work exactly the same, because the entries inside have the `company` field.

| Fields present | Detected type | LaTeX output |
|---|---|---|
| `institution` | Education | `\cveducation` |
| `company` | Experience | `\cventry` |
| `title` + `authors` | Publication | `\cvpublication` |
| `name` + `start_date`/`date`/`highlights` | Project | `\cventry` |
| `label` + `details` | Skill | `\cvskill` |
| `bullet` | Simple bullet | `cvbullets` |
| `reversed_number` / `number` | Numbered item | `cvbullets` |
| Plain string / `summary` | Free text | `\cvtext` |

---

## Inline Markdown

Any text field supports basic inline markdown:

| Syntax | Output |
|---|---|
| `**text**` | **bold** |
| `*text*` | *italic* |
| `[text](url)` | clickable link |

Real examples:

```yaml
highlights:
  - "Reduced latency by **73%** compared to the previous baseline"
  - "Paper published at [NeurIPS 2023](https://neurips.cc)"
  - "**Stack:** React, Node.js, PostgreSQL, Redis"

name: "[BoliviaNLP](https://github.com/mmendoza/bolivianlp)"

authors:
  - "*Mario Mendoza*"    # asterisks render as italic in the CV
  - "Ana Quispe"
```

---

## LaTeX Rendering

Everything after the editor is LaTeX:

```
parsedCV ──► generateLatex(cv, template) ──► main.tex
                                                │
                              compileLatex()    ▼
                     pdfTeX (WebAssembly, Web Worker)
                                                │
                                                ▼
                                   PDF bytes (Uint8Array)
                                     │               │
                                     ▼               ▼
                          PdfPreview (pdf.js)   ⬇ Download PDF
```

- **Generator** (`src/latex/generateLatex.js`): emits only content, through a small macro interface (`\cvheader`, `\cvsection`, `\cventry`, `\cveducation`, `\cvpublication`, `\cvskill`, `\cvtext`, and the `cvhighlights` / `cvbullets` lists).
- **Templates** (`src/latex/templates/`): each template is a pdfLaTeX preamble that defines those macros, so Harvard, Classic, and Modern differ only in their preamble.
- **Escaping** (`src/latex/escape.js`): all user text is escaped (`& % $ # _ { } ~ ^ \`). Characters pdfLaTeX can't typeset, such as emoji, are dropped so they can't break the build.
- **Engine** (`src/latex/engine.js`): SwiftLaTeX's pdfTeX runs in a Web Worker and reads its format, packages and fonts from a bundle in `public/swiftlatex/pdftex/` (built by `npm run build:texlive`). Compilations are queued and debounced by 400 ms. If a compilation fails, the preview keeps the last good PDF and shows the first TeX error above it.

### PDF specs

| Parameter | Value |
|---|---|
| Page size | US Letter (8.5" × 11") |
| Engine | pdfLaTeX (SwiftLaTeX WebAssembly build) |
| Text | Real text with `glyphtounicode` mappings: selectable and ATS-friendly |
| Links | Clickable (email, phone → WhatsApp chat, website, social profiles, DOIs, markdown links) |
| Fonts | Harvard: Times (`mathptmx`) · Classic: Charter · Modern: Helvetica |
| Filename | `{cv-name}.pdf` |

> The download button is disabled while the PDF is out of date: YAML errors, a failed LaTeX compilation, or a compilation still running.

### Pagination

LaTeX paginates the document. Page breaks can fall between entries, so a long section simply continues on the next page. A section title is never left alone at the bottom of a page.

---

## Persistence

All data is saved automatically to the browser's `localStorage`. No manual action needed.

| Key | Type | Contents |
|---|---|---|
| `editcv_cvs` | JSON array | All CVs: `{ id, name, yaml, updatedAt }` |
| `editcv_active` | string | ID of the currently selected CV |
| `editcv_theme` | string | `"dark"` or `"light"` |

Autosave uses a **600ms debounce** — it waits 600ms after the last change before writing to storage, to avoid flooding it on every keystroke.

> Data persists across browser restarts. It is only cleared if you manually wipe `localStorage` or use private/incognito mode.

---

## Project Structure

```
editcv/
├── index.html
├── vite.config.js
├── package.json
├── scripts/                         # TeX bundle builder (npm run build:texlive)
├── public/
│   └── swiftlatex/                  # pdfTeX WebAssembly engine (see its README)
│       └── pdftex/                  # Bundled TeX files + manifest.json (generated)
│
└── src/
    ├── main.jsx                    # React entry point
    ├── App.jsx                     # Root component — CVs, theme, template, zoom, autosave
    ├── styles.css                  # The only stylesheet: theme variables, layout, components
    │
    ├── latex/
    │   ├── generateLatex.js         # CV object → complete .tex document
    │   ├── escape.js                # LaTeX escaping + inline markdown → LaTeX
    │   ├── engine.js                # SwiftLaTeX pdfTeX worker wrapper (compile queue)
    │   ├── useLatexPdf.js           # Hook: debounce → generate → compile → PDF bytes
    │   └── templates/
    │       ├── index.js             # Template registry: label, date format, preamble
    │       ├── base.js              # Shared preamble + macro interface docs
    │       ├── harvard.js
    │       ├── classic.js
    │       └── modern.js
    │
    ├── utils/
    │   ├── yamlParser.js            # js-yaml wrapper, entry type detection, date formatting
    │   └── storage.js               # localStorage: CVs, active CV, theme + default YAML
    │
    └── components/
        ├── Navbar.jsx               # Top bar with the theme toggle
        ├── Sidebar.jsx              # CV list: create / rename / archive / delete
        ├── Editor.jsx               # Form/YAML toggle; Monaco is lazy-loaded
        ├── FormEditor.jsx           # Form UI, driven by one field config per entry type
        ├── Modal.jsx                # Shared dialog shell (Escape / backdrop close)
        ├── ExportModal.jsx          # Filename prompt before downloading the PDF
        └── PdfPreview.jsx           # Renders the compiled PDF pages with pdf.js
```

---

## Data Flow

YAML is the single source of truth. Both the form and the Monaco editor read from and write back to the same `yamlText` state in `App.jsx`.

```
                          App.jsx
                             │
              ┌──────────────┴──────────────┐
              │                             │
         yamlText (string)            parsedCV (object)
              │                             │
    ┌─────────┴──────────┐                  │
    │                    │                  ▼
 onChange             onChange       useLatexPdf(parsedCV, template)
    │                    │                  │  generateLatex() → detectEntryType()
    ▼                    ▼                  │  compileLatex()  → pdfTeX (WASM)
FormEditor.jsx    MonacoEditor              ▼
    │                                  PdfPreview.jsx (pdf.js)
    │  yaml.dump(data)
    └─► serializes back to YAML string
```

### Form ↔ YAML sync

To avoid infinite update loops when the form triggers a YAML change:

```
User edits a field in the Form
        │
        ▼
applyUpdate(newData)       updates the form's internal state
        │
        ▼
yaml.dump(newData)         serializes with js-yaml
        │
        ▼
onYamlChange(yamlStr)      propagates to App.jsx via setYamlText
        │
        ▼
parseCV(yamlText)          useMemo in App.jsx → parsedCV
        │
    ┌───┴────────────────┐
    │                    │
useLatexPdf             FormEditor
recompiles the PDF      skipNextSync → ignores the next cvData update
                        (prevents the form from resetting while the user types)
```

### State lifecycle

```
Initial load
      │
      ▼
loadCVs() from localStorage
      │
      ▼
setYamlText(cv.yaml)     → parseCV() → useLatexPdf compiles → PdfPreview renders

Every user change
      │
      ▼
setYamlText(newValue)
      │
      ├─ parseCV()  → LaTeX regenerated and compiled (debounced 400ms)
      │
      └─ debounce 600ms → saveCV() → localStorage
```

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| [React](https://react.dev) | 18 | UI framework and state management with hooks |
| [Vite](https://vitejs.dev) | 5 | Dev server with HMR and production bundler |
| [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) | 4 | Code editor with YAML syntax highlighting |
| [js-yaml](https://github.com/nodeca/js-yaml) | 4 | YAML parsing and serialization in the browser |
| [SwiftLaTeX](https://github.com/SwiftLaTeX/SwiftLaTeX) | — | pdfTeX compiled to WebAssembly (served from `public/swiftlatex/`) |
| [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`) | 4 | Renders the compiled PDF in the preview |

No backend. No database. No authentication. The TeX files the templates need are static assets served with the app; the only third-party request is Monaco itself, which `@monaco-editor/react` loads from jsDelivr when the YAML tab is first opened.

---

## Design Decisions

**Why both a form and YAML?**
The form removes friction for non-technical users or when you just want to fill things in quickly. YAML is essential for power users who want to copy/paste from another CV, keep it in a git repo, or use advanced features like inline markdown. Both modes write the exact same data — there is no duplication.

**Why YAML as the internal format?**
It's more readable than JSON and easier to maintain by hand than XML. An engineer can store their CV in a git repo like any other config file, submit PRs with their updates, and get clean diffs.

**Why multiple templates?**
Different contexts call for different styles. Harvard is the standard for academic and research CVs. Classic suits traditional industries. Modern works well for tech and creative roles. All templates share the same data model — switching is instant and affects only the visual output.

**Why localStorage instead of a backend?**
Zero onboarding friction. No accounts, no API keys, no latency. For a personal CV, localStorage is more than enough. If the user wants a backup, they can copy the YAML and save it as a file.

**Why detect entry type by fields instead of section name?**
Because section names are free-form — someone might write `jobs` instead of `experience`. Field-based detection makes the system robust to naming variations and supports sections in any language.

**Why LaTeX?**
It gives professional typography and pagination, and it produces a text-based PDF that ATS parsers can read. The preview renders the same compiled PDF that you download, so what you see is exactly what you get. Compiling in the browser with WebAssembly keeps the app serverless.

---

## Roadmap

- [x] Multiple templates (Harvard, Classic, Modern)
- [ ] Drag-to-resize between editor and preview
- [ ] Export YAML as a `.yaml` file
- [ ] Import YAML from a `.yaml` file
- [ ] `Ctrl+S` shortcut to force manual save
- [ ] Page numbers in the PDF
- [ ] Optional profile photo support
- [ ] Diff view when switching between CVs

---

## License

MIT — free for personal and commercial use.
