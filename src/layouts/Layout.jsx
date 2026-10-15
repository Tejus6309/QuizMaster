import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import Dropdown from '../components/ui/Dropdown.jsx'
import { Brain, Sun, Moon, LogOut, User, LayoutDashboard, FileText, Settings, Menu, X } from '../components/icons/Icons.jsx'
import { useState } from 'react'

export default function Layout() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard', auth: true },
    { to: '/generate', label: 'Generate Quiz', auth: true },
    { to: '/my-quizzes', label: 'My Quizzes', auth: true },
    { to: '/about', label: 'About' },
  ]

  const visibleLinks = navLinks.filter((l) => !l.auth || user)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="layout">
      <header className="navbar">
        <div className="navbar__inner">
          <Link to="/" className="navbar__logo">
            <Brain className="navbar__logo-icon" />
            <span>QuizMaster</span>
          </Link>

          <nav className="navbar__links">
            {visibleLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`navbar__link ${isActive(l.to) ? 'navbar__link--active' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="navbar__actions">
            <button type="button" className="navbar__icon-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? <Moon /> : <Sun />}
            </button>

            {user ? (
              <Dropdown
                trigger={
                  <button type="button" className="navbar__user-btn">
                    <span className="navbar__avatar">
                      {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                    <span className="navbar__user-name">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                  </button>
                }
              >
                <Link to="/dashboard" className="dropdown-item"><LayoutDashboard className="dropdown-item__icon" /> Dashboard</Link>
                <Link to="/profile" className="dropdown-item"><Settings className="dropdown-item__icon" /> Profile</Link>
                <Link to="/my-quizzes" className="dropdown-item"><FileText className="dropdown-item__icon" /> My Quizzes</Link>
                <button type="button" className="dropdown-item dropdown-item--danger" onClick={handleSignOut}>
                  <LogOut className="dropdown-item__icon" /> Sign Out
                </button>
              </Dropdown>
            ) : (
              <div className="navbar__auth-links">
                <Link to="/login" className="navbar__link">Login</Link>
                <Link to="/register" className="btn btn--primary btn--sm">Sign Up</Link>
              </div>
            )}

            <button
              type="button"
              className="navbar__mobile-toggle"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="navbar__mobile-menu">
            {visibleLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`navbar__mobile-link ${isActive(l.to) ? 'navbar__mobile-link--active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="layout__content">
        <Outlet />
      </main>

      <footer className="layout__footer">
        <div className="footer__inner">
          <span>QuizMaster &copy; {new Date().getFullYear()}</span>
          <div className="footer__links">
            <Link to="/about">About</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
