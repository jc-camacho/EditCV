const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="7.5" cy="7.5" r="2.5" />
    <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3 3l1.1 1.1M10.9 10.9 12 12M12 3l-1.1 1.1M4.1 10.9 3 12" />
  </svg>
)

const IconMoon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9A6 6 0 0 1 5 2a6 6 0 1 0 7 7z" />
  </svg>
)

export default function Navbar({ theme, onToggleTheme }) {
  return (
    <nav className="card navbar">
      <span className="logo">EditCV</span>
      <button className="btnIcon filled lg" onClick={onToggleTheme} title="Toggle theme">
        {theme === 'dark' ? <IconSun /> : <IconMoon />}
      </button>
    </nav>
  )
}
