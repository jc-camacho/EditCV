import { basePreamble } from './base'

// Charter, blue accent, left-aligned section titles followed by a grey rule,
// date and location stacked on the right.
export const classicPreamble = basePreamble({
  fontSetup: String.raw`\usepackage{charter}`,
  margins: 'top=0.4in,bottom=0.4in,left=0.6in,right=0.6in',
}) + String.raw`
\definecolor{cvaccent}{HTML}{1A56DB}
\definecolor{cvrule}{HTML}{94A3B8}
\definecolor{cvmuted}{HTML}{555555}
\definecolor{cvsub}{HTML}{444444}
\definecolor{cvsoft}{HTML}{333333}
\definecolor{cvtext}{HTML}{222222}
\hypersetup{colorlinks,urlcolor=cvaccent,linkcolor=cvaccent}
\AtBeginDocument{\color{cvtext}}

\newcommand{\cvbody}{\cvfont{9.5pt}{13pt}}
\newcommand{\cvsmall}{\cvfont{9pt}{12pt}}

\setlist[itemize]{label=\textbullet,leftmargin=14pt,topsep=1pt,partopsep=0pt,itemsep=1pt,parsep=0pt}
\newenvironment{cvhighlights}{\cvbody\begin{itemize}}{\end{itemize}}
\newenvironment{cvbullets}{\cvbody\begin{itemize}[topsep=0pt]}{\end{itemize}}

\newcommand{\cvsep}{\unskip\ \textbullet\ \ignorespaces}

\newcommand{\cvheader}[3]{%
  {\centering\color{cvaccent}%
    {\cvfont{24pt}{28pt}\bfseries #1\par}%
    \ifblank{#2}{}{\vspace{3pt}{\cvfont{11pt}{13pt}#2\par}}%
    \ifblank{#3}{}{\vspace{3pt}{\cvsmall #3\par}}%
  }\vspace{4pt}}

\newcommand{\cvsection}[1]{%
  \par\vspace{8pt}%
  {\parfillskip=0pt\noindent{\cvfont{12pt}{14pt}\bfseries\color{cvaccent}#1}\enspace%
   {\color{cvrule}\leaders\hrule height 3.6pt depth -2.85pt\hfill}\par}%
  \nopagebreak\vspace{3pt}\nopagebreak}

% Right column: date, with the location underneath
\newcommand{\cvdateloc}[2]{%
  {\cvbody\color{cvmuted}\begin{tabular}[t]{@{}r@{}}#1\ifblank{#2}{}{\\\relax #2}\end{tabular}}}

% Company, Position                                                  Date
%                                                                Location
\newcommand{\cventry}[6]{%
  \par\vspace{3pt}%
  \cvheadrow{\textbf{#1}\ifblank{#2}{}{{\color{cvsub}, #2}}}{\cvdateloc{#4}{#3}}%
  \ifblank{#5}{}{{\cvbody\color{cvsoft}#5\par}}%
  #6}

% Degree, Institution, Area                                          Date
\newcommand{\cveducation}[7]{%
  \par\vspace{3pt}%
  \cvheadrow{\ifblank{#1}{}{\textbf{#1}, }\textbf{#2}\ifblank{#3}{}{{\color{cvsub}, #3}}}{\cvdateloc{#5}{#4}}%
  \ifblank{#6}{}{{\cvbody\color{cvsoft}#6\par}}%
  #7}

\newcommand{\cvpublication}[5]{%
  \par\vspace{3pt}%
  \cvheadrow{\textbf{#1}}{{\cvbody\color{cvmuted}#2}}%
  \ifblank{#3}{}{{\cvbody\color{cvsoft}#3\par}}%
  \ifblank{#4#5}{}{{\cvsmall #4\ifblank{#4}{}{\ifblank{#5}{}{\ }}\ifblank{#5}{}{{\color{cvmuted}(#5)}}\par}}}

\newcommand{\cvskill}[2]{{\cvbody\hangindent=1em\hangafter=1 \textbf{#1:} {\color{cvsoft}#2}\par}\vspace{2pt}}

\newcommand{\cvtext}[1]{{\cvbody\color{cvsoft}#1\par}\vspace{2pt}}
`
