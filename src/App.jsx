import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import About from './pages/About'
import Example from './pages/Example'
import Home from './pages/Home'
import Meters from './pages/Meters'
import Statistics from './pages/Statistics'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Statistics', to: '/statistics' },
  { label: 'Meters', to: '/meters' },
  { label: 'Example', to: '/example' },
  { label: 'About', to: '/about' },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const location = useLocation()
  const pageKey = location.pathname.replace('/', '') || 'home'

  useEffect(() => {
    const storedTheme = localStorage.getItem('site_theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = storedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(initial)
    document.body.setAttribute('data-theme', initial)
  }, [])

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('site_theme', next)
    setTheme(next)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-glow" aria-hidden="true"></div>
        <div className="title-group">
          <span className="site-kicker">Sanskrit Metrical Analyzer</span>
          <h1 className="site-title">Chandoviśleṣaṇam</h1>
          <p className="site-subtitle">Tools for Sanskrit scansion.</p>
        </div>
        <div className="header-actions">
          <button
            className="theme-toggle icon-toggle"
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M12 2.6v2.4M12 19v2.4M4.6 12H2.2M21.8 12h-2.4M5.1 5.1l1.7 1.7M17.2 17.2l1.7 1.7M18.9 5.1l-1.7 1.7M6.8 17.2l-1.7 1.7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M17.3 14.7a6 6 0 1 1-8-8 7.3 7.3 0 0 0 8 8z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span className="sr-only">Toggle theme</span>
          </button>
        </div>
      </header>

      <div className="nav-bar">
        <div className="nav-actions">
          <button
            className="menu-toggle"
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            aria-label="Toggle navigation"
          >
            <span className="menu-icon" aria-hidden="true"></span>
          </button>
        </div>
        <nav className={`primary-nav ${menuOpen ? 'open' : ''}`} id="primary-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="main-content" data-page={pageKey}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/meters" element={<Meters />} />
          <Route path="/example" element={<Example />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <footer className="site-footer">
        Chandoviśleṣaṇam © 2026.
      </footer>
    </div>
  )
}

export default App
