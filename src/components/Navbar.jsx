import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useQuizStore } from '../store/useQuizStore.js'
import {
  Brain,
  HistoryIcon,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Trophy,
  Target,
} from './icons/Icons.jsx'

function ShoppingBagIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function LayoutDashboardIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  )
}

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { studyCart } = useQuizStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    await signOut()
    navigate('/')
  }

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      return name.slice(0, 2).toUpperCase()
    }
    if (email) return email.slice(0, 2).toUpperCase()
    return 'QM'
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userInitials = getInitials(user?.user_metadata?.full_name, user?.email)

  return (
    <nav className="qm-navbar">
      <div className="qm-navbar__container">
        {/* Logo / Brand */}
        <Link to="/" className="qm-navbar__brand">
          <div className="qm-navbar__logo-icon">
            <Brain />
          </div>
          <div className="qm-navbar__brand-text">
            <span className="qm-navbar__title">QuizMaster</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="qm-navbar__links">
          <Link
            to="/"
            className={`qm-navbar__link ${user && location.pathname === '/' ? 'qm-navbar__link--active' : ''}`}
            aria-current={user && location.pathname === '/' ? 'page' : undefined}
          >
            Challenge Setup
          </Link>

          <Link
            to="/dashboard"
            className={`qm-navbar__link ${user && location.pathname === '/dashboard' ? 'qm-navbar__link--active' : ''}`}
            aria-current={user && location.pathname === '/dashboard' ? 'page' : undefined}
          >
            <LayoutDashboardIcon className="link-icon" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/deck"
            className={`qm-navbar__link ${user && location.pathname === '/deck' ? 'qm-navbar__link--active' : ''}`}
            aria-current={user && location.pathname === '/deck' ? 'page' : undefined}
          >
            <ShoppingBagIcon className="link-icon" />
            <span>Study Deck</span>
            {studyCart.length > 0 && (
              <span className="qm-navbar__cart-badge">{studyCart.length}</span>
            )}
          </Link>

          <Link
            to="/history"
            className={`qm-navbar__link ${user && location.pathname === '/history' ? 'qm-navbar__link--active' : ''}`}
            aria-current={user && location.pathname === '/history' ? 'page' : undefined}
          >
            <HistoryIcon className="link-icon" />
            <span>History</span>
          </Link>
        </div>

        {/* Right Action Items */}
        <div className="qm-navbar__actions">
          {/* User Profile or Auth Buttons */}
          {user ? (
            <div className="qm-user-menu" ref={dropdownRef}>
              <button
                type="button"
                className="qm-user-menu__trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
              >
                <div className="qm-avatar-circle">{userInitials}</div>
                <span className="qm-user-menu__name">{userName}</span>
                <ChevronDown className={`qm-user-menu__chevron ${dropdownOpen ? 'rotate' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="qm-dropdown-menu">
                  <div className="qm-dropdown-menu__header">
                    <div className="qm-avatar-circle qm-avatar-circle--lg">{userInitials}</div>
                    <div className="qm-dropdown-menu__user-info">
                      <span className="qm-dropdown-menu__user-name">{userName}</span>
                      <span className="qm-dropdown-menu__user-email">{user.email}</span>
                      <div className="qm-dropdown-menu__badges">
                        <span className="auth-type-badge auth-type-badge--supabase">
                          Active Scholar
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="qm-dropdown-menu__divider" />

                  <Link
                    to="/dashboard"
                    className="qm-dropdown-menu__item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Target className="menu-item-icon" />
                    <span>Learning Dashboard</span>
                  </Link>

                  <Link
                    to="/deck"
                    className="qm-dropdown-menu__item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <ShoppingBagIcon className="menu-item-icon" />
                    <span>Study Deck ({studyCart.length})</span>
                  </Link>

                  <Link
                    to="/profile"
                    className="qm-dropdown-menu__item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="menu-item-icon" />
                    <span>My Profile & Stats</span>
                  </Link>

                  <Link
                    to="/history"
                    className="qm-dropdown-menu__item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Trophy className="menu-item-icon" />
                    <span>Attempt History</span>
                  </Link>

                  <div className="qm-dropdown-menu__divider" />

                  <button
                    type="button"
                    className="qm-dropdown-menu__item qm-dropdown-menu__item--danger"
                    onClick={handleSignOut}
                  >
                    <LogOut className="menu-item-icon" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="qm-auth-buttons">
              <Link to="/login" className="qm-btn-signin">
                Sign In
              </Link>
              <Link to="/signup" className="qm-btn-signup">
                <Sparkles className="qm-btn-icon" />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
