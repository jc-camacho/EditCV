/**
 * Preamble shared by every template.
 *
 * Each template must define this macro interface (the generator only ever
 * emits these, so layouts are free to differ):
 *
 *   \cvheader{name}{headline}{contacts joined by \cvsep}
 *   \cvsection{title}
 *   \cventry{title}{subtitle}{location}{date}{summary}{highlights}
 *   \cveducation{degree}{institution}{area}{location}{date}{summary}{highlights}
 *   \cvpublication{title}{date}{authors}{doi}{venue}
 *   \cvskill{label}{details}
 *   \cvtext{paragraphs}
 *   cvhighlights / cvbullets environments (itemize-based)
 *
 * Empty arguments are allowed everywhere; templates test them with \ifblank.
 */
export function basePreamble({ fontSetup, margins }) {
  return String.raw`\documentclass[10pt,letterpaper]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
${fontSetup}
\usepackage[letterpaper,${margins}]{geometry}
\usepackage{xcolor}
\usepackage{tabularx}
\usepackage{enumitem}
\usepackage{etoolbox}
\usepackage[unicode]{hyperref}

% Correct text extraction (copy/paste, ATS parsers) for ligatures and symbols
\input{glyphtounicode}
\pdfgentounicode=1

\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\setlength{\tabcolsep}{0pt}
\raggedbottom

\newcommand{\cvfont}[2]{\fontsize{#1}{#2}\selectfont}

% Left content / right-aligned column (dates), top-aligned
\newcommand{\cvheadrow}[2]{%
  \par\noindent
  \begin{tabularx}{\linewidth}{@{}X@{\hspace{8pt}}r@{}}#1 & #2\end{tabularx}\par}
`
}
