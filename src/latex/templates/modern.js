import { basePreamble } from './base'

// Helvetica, teal accent, left-aligned header with an accent rule, and a
// two-column layout: date + location on the left, content on the right.
export const modernPreamble = basePreamble({
  fontSetup: String.raw`\usepackage[scaled=0.92]{helvet}
\renewcommand{\familydefault}{\sfdefault}`,
  margins: 'top=0.35in,bottom=0.35in,left=0.46in,right=0.46in',
}) + String.raw`
\definecolor{cvaccent}{HTML}{0097A7}
\definecolor{cvaccentdim}{HTML}{006978}
\definecolor{cvtext}{HTML}{1A1A1A}
\definecolor{cvmuted}{HTML}{546E7A}
\definecolor{cvline}{HTML}{B2DFDB}
\definecolor{cvname}{HTML}{0D2137}
\hypersetup{colorlinks,urlcolor=cvaccent,linkcolor=cvaccent}
\AtBeginDocument{\color{cvtext}}

\newcommand{\cvbody}{\cvfont{9pt}{13pt}}
\newcommand{\cvtitle}{\cvfont{9.5pt}{12.5pt}}
\newcommand{\cvmetafont}{\cvfont{8.5pt}{12pt}}

\setlist[itemize]{label={\color{cvaccent}\textbullet},leftmargin=11pt,topsep=1pt,partopsep=0pt,itemsep=1.5pt,parsep=0pt}
\setlist[itemize,2]{label={\color{cvaccentdim}\textbullet}}
\newenvironment{cvhighlights}{\cvbody\begin{itemize}}{\end{itemize}}
\newenvironment{cvbullets}{\cvbody\begin{itemize}[topsep=0pt]}{\end{itemize}}

% Stretchable space after the bar so long contact lines can wrap
\newcommand{\cvsep}{\unskip\enspace{\color{cvline}|}\hspace{0.5em}\ignorespaces}

\newcommand{\cvheader}[3]{%
  {\raggedright
    {\cvfont{20pt}{24pt}\bfseries\color{cvname}#1\par}%
    \ifblank{#2}{}{\vspace{2pt}{\cvtitle\color{cvaccent}#2\par}}%
    \ifblank{#3}{}{\vspace{4pt}{\cvmetafont\color{cvmuted}#3\par}}%
  }%
  \vspace{6pt}\noindent{\color{cvaccent}\rule{\linewidth}{1.5pt}}\par\vspace{2pt}}

\newcommand{\cvsection}[1]{%
  \par\vspace{7pt}%
  {\parfillskip=0pt\noindent{\cvtitle\bfseries\color{cvaccent}\MakeUppercase{#1}}\enspace%
   {\color{cvline}\leaders\hrule height 3pt depth -2.25pt\hfill}\par}%
  \nopagebreak\vspace{3pt}\nopagebreak}

% 96pt meta column (date, location) | content column
\newcommand{\cvtwocol}[2]{%
  \par\noindent
  \begin{tabularx}{\linewidth}{@{}>{\raggedright\arraybackslash}p{96pt}@{\hspace{8pt}}X@{}}#1 & #2\end{tabularx}\par}
\newcommand{\cvmeta}[2]{{\cvmetafont\color{cvmuted}#1\ifblank{#2}{}{\par #2}\par}}

\newcommand{\cventry}[6]{%
  \par\vspace{3pt}%
  \cvtwocol{\cvmeta{#4}{#3}}{%
    {\cvtitle\textbf{#1}\ifblank{#2}{}{{\color{cvmuted}\ -- }{\color{cvaccent}#2}}\par}%
    \ifblank{#5}{}{{\cvbody\color{cvmuted}#5\par}}%
    #6}}

\newcommand{\cveducation}[7]{%
  \par\vspace{3pt}%
  \cvtwocol{\cvmeta{#5}{#4}}{%
    {\cvtitle\ifblank{#1}{}{\textbf{#1}{\color{cvmuted}, }}\textbf{#2}\ifblank{#3}{}{{\color{cvmuted}\ -- #3}}\par}%
    \ifblank{#6}{}{{\cvbody\color{cvmuted}#6\par}}%
    #7}}

% Publications span the full width
\newcommand{\cvpublication}[5]{%
  \par\vspace{3pt}%
  \cvheadrow{{\cvtitle\textbf{#1}\par}}{{\cvmetafont\color{cvmuted}#2}}%
  {\cvmetafont\color{cvmuted}%
    \ifblank{#3}{}{#3\par}%
    \ifblank{#4#5}{}{#4\ifblank{#4}{}{\ifblank{#5}{}{\ }}\ifblank{#5}{}{(#5)}\par}}}

\newcommand{\cvskill}[2]{%
  \par\noindent
  \begin{tabularx}{\linewidth}{@{}>{\raggedright\arraybackslash}p{90pt}@{\hspace{4pt}}X@{}}%
    {\cvbody\bfseries\color{cvaccent}#1\par} & {\cvbody #2\par}%
  \end{tabularx}\par\vspace{2pt}}

\newcommand{\cvtext}[1]{{\cvbody #1\par}\vspace{2pt}}
`
