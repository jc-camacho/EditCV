import { basePreamble } from './base'

// Times, centered header, section titles centered between thin rules.
export const harvardPreamble = basePreamble({
  fontSetup: String.raw`\usepackage{mathptmx}`,
  margins: 'top=0.4in,bottom=0.4in,left=0.6in,right=0.6in',
}) + String.raw`
\hypersetup{hidelinks}

\newcommand{\cvbody}{\cvfont{9.5pt}{12.5pt}}
\newcommand{\cvsmall}{\cvfont{9pt}{11.5pt}}
\definecolor{cvmuted}{HTML}{555555}

\setlist[itemize]{label=\textbullet,leftmargin=13pt,topsep=1pt,partopsep=0pt,itemsep=1pt,parsep=0pt}
\newenvironment{cvhighlights}{\cvbody\begin{itemize}}{\end{itemize}}
\newenvironment{cvbullets}{\cvbody\begin{itemize}[topsep=0pt]}{\end{itemize}}

\newcommand{\cvsep}{\unskip\ {\color{cvmuted}\textbullet}\ \ignorespaces}

\newcommand{\cvheader}[3]{%
  {\centering
    {\cvfont{18pt}{22pt}\bfseries #1\par}%
    \ifblank{#2}{}{\vspace{2pt}{\cvbody #2\par}}%
    \ifblank{#3}{}{\vspace{2pt}{\cvsmall #3\par}}%
  }\vspace{2pt}}

\newcommand{\cvrule}{\leaders\hrule height 3pt depth -2.5pt\hfill}
\newcommand{\cvsection}[1]{%
  \par\vspace{7pt}%
  {\parfillskip=0pt\noindent\cvrule\enspace\textbf{#1}\enspace\cvrule\par}%
  \nopagebreak\vspace{3pt}\nopagebreak}

% Company, Position -- Location                                     Date
\newcommand{\cventry}[6]{%
  \par\vspace{3pt}%
  \cvheadrow{\textbf{#1}\ifblank{#2}{}{, \textit{#2}}\ifblank{#3}{}{ -- #3}}{\cvbody #4}%
  \ifblank{#5}{}{{\cvbody #5\par}}%
  #6}

% Degree  Institution, Area -- Location                             Date
\newcommand{\cveducation}[7]{%
  \par\vspace{3pt}%
  \cvheadrow{\ifblank{#1}{}{\textbf{#1}\quad}\textbf{#2}\ifblank{#3}{}{, #3}\ifblank{#4}{}{ -- #4}}{\cvbody #5}%
  \ifblank{#6}{}{{\cvbody #6\par}}%
  #7}

\newcommand{\cvpublication}[5]{%
  \par\vspace{3pt}%
  \cvheadrow{\cvbody\textbf{#1}}{\cvbody #2}%
  \ifblank{#3}{}{{\cvsmall\itshape #3\par}}%
  \ifblank{#4#5}{}{{\cvsmall\ifblank{#4}{}{{\color{cvmuted}#4}}\ifblank{#4}{}{\ifblank{#5}{}{\ }}\ifblank{#5}{}{(#5)}\par}}}

\newcommand{\cvskill}[2]{{\cvbody\hangindent=1em\hangafter=1 \textbf{#1:} #2\par}\vspace{1pt}}

\newcommand{\cvtext}[1]{{\cvbody #1\par}\vspace{3pt}}
`
