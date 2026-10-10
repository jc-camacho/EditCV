/** Everything EditCV keeps in localStorage. */
const KEYS = {
  cvs:         'editcv_cvs',
  activeId:    'editcv_active',
  theme:       'editcv_theme',
  editorWidth: 'editcv_editor_width', // editor pane width, as a percentage of the main card
}

export const loadTheme = () => localStorage.getItem(KEYS.theme) || 'dark'
export const saveTheme = theme => localStorage.setItem(KEYS.theme, theme)

export const loadEditorWidth = () => Number(localStorage.getItem(KEYS.editorWidth)) || 50
export const saveEditorWidth = percent => localStorage.setItem(KEYS.editorWidth, percent.toFixed(1))

export const loadActiveId = () => localStorage.getItem(KEYS.activeId)
export const saveActiveId = id => localStorage.setItem(KEYS.activeId, id)

// ── CVs ───────────────────────────────────────────────────────────────────────

export function loadCVs() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.cvs)) || []
  } catch {
    return []
  }
}

const saveCVs = cvs => localStorage.setItem(KEYS.cvs, JSON.stringify(cvs))

/** Inserts the CV, or replaces the stored one with the same id. */
export function saveCV(cv) {
  const cvs   = loadCVs()
  const index = cvs.findIndex(c => c.id === cv.id)
  if (index >= 0) cvs[index] = cv
  else cvs.push(cv)
  saveCVs(cvs)
}

export function deleteCV(id) {
  saveCVs(loadCVs().filter(c => c.id !== id))
}

/** A new, unsaved CV filled with an example to start from. */
export function createCV(name) {
  return {
    id: Date.now().toString(),
    name,
    yaml: defaultYaml(name),
    updatedAt: new Date().toISOString(),
    archived: false,
    favorite: false,
  }
}

function defaultYaml(name) {
  return `cv:
  lang: en  # en | es — date labels and hyphenation
  name: "${name}"
  headline: Software Engineer & Machine Learning Researcher
  location: Santa Cruz de la Sierra, Bolivia
  email: mario.mendoza@email.com
  phone: +591 7 123 4567
  website: https://mariomendoza.dev
  social_networks:
    - network: LinkedIn
      username: mario-mendoza-bo
    - network: GitHub
      username: mmendoza-dev
  custom_connections: []
  sections:
    education:
      - institution: Universidad Autónoma Gabriel René Moreno
        area: Systems Engineering
        degree: BS
        start_date: 2015-02
        end_date: 2020-11
        location: Santa Cruz de la Sierra, Bolivia
        highlights:
          - 'GPA: 4.73/5.00, Graduated with Honors'
          - Best Graduation Project Award — AI-based crop disease detection system
          - Teaching Assistant for Data Structures and Algorithms (2018–2019)
      - institution: Universidad de Chile
        area: Computer Science (Exchange Program)
        degree: Exchange Student
        start_date: 2019-03
        end_date: 2019-07
        location: Santiago, Chile
        highlights:
          - Selected among 12 students nationwide for the MARCA exchange scholarship
    experience:
      - company: Jalasoft
        position: Senior Software Engineer
        start_date: 2022-01
        end_date: present
        location: Cochabamba, Bolivia (Remote)
        highlights:
          - Led migration of monolithic Java backend to microservices architecture,
            reducing deployment time by 65%
          - Designed real-time data pipeline processing 500K+ events/day using Kafka
            and Apache Flink
          - Mentored team of 6 junior engineers across Bolivia and Argentina offices
          - Implemented CI/CD workflows with GitHub Actions, cutting release cycles
            from 2 weeks to 2 days
      - company: Fundación Bolivia en Datos
        position: ML Engineer (Part-time)
        start_date: 2021-03
        end_date: 2022-12
        location: Santa Cruz de la Sierra, Bolivia
        highlights:
          - Built NLP pipeline for Spanish-language social media monitoring used by
            3 government agencies
          - Developed dashboard visualizing poverty and education indicators across
            Bolivia's 9 departments
          - Open-sourced dataset of 120K annotated Bolivian Spanish tweets (2,400+
            GitHub stars)
      - company: Agetic (Agencia de Gobierno Electrónico)
        position: Backend Developer Intern
        start_date: 2020-01
        end_date: 2020-12
        location: La Paz, Bolivia
        highlights:
          - Contributed to national digital identity platform serving 4M+ citizens
          - Integrated biometric verification API reducing identity fraud by 38%
    projects:
      - name: '[BoliviaNLP](https://github.com/)'
        start_date: 2021-06
        end_date: present
        summary: Open-source NLP toolkit for Bolivian Spanish and Quechua language processing
        highlights:
          - First publicly available Quechua-Spanish bilingual language model (BERT-based)
          - Adopted by 4 Bolivian universities for research, 1,800+ GitHub stars
      - name: '[AgroSense](https://github.com/)'
        date: '2020'
        summary: IoT + ML platform for smallholder farmers in the Bolivian lowlands
        highlights:
          - Deployed on 120 farms across Santa Cruz department, improving yield
            predictions by 31%
          - Winner of the Bolivia Innovation Challenge 2020 (Ministry of Science)
    publications:
      - title: Low-Resource NLP for Andean Languages Using Transfer Learning
        authors:
          - '*Mario Mendoza*'
          - Ana Quispe
          - Roberto Flores
        doi: 10.1234/lrec.2023.0892
        journal: LREC-COLING 2023
        date: 2023-06
      - title: 'AgroSense: Crop Yield Prediction for Resource-Constrained Environments'
        authors:
          - '*Mario Mendoza*'
          - Luisa Torrico
        doi: 10.1234/acmdev.2021.0045
        journal: ACM DEV 2021
        date: 2021-03
    skills:
      - label: Languages
        details: Python, Java, TypeScript, Go, SQL
      - label: ML & Data
        details: PyTorch, scikit-learn, HuggingFace, Apache Spark, Kafka
      - label: Infrastructure
        details: Docker, Kubernetes, AWS, Terraform, GitHub Actions
      - label: Human Languages
        details: Spanish (native), English (C1), Quechua (conversational)
    selected_honors:
      - bullet: Google Developers Expert — Machine Learning (2023)
      - bullet: Bolivia Innovation Challenge Winner — Ministry of Science (2020)
      - bullet: MARCA Exchange Scholarship — Universidad de Chile (2019)
      - bullet: Best Graduation Project Award — UAGRM (2020)
`
}
