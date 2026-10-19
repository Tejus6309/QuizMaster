import { Link } from 'react-router-dom'
import { Home } from '../icons/Icons.jsx'

/**
 * Reusable Breadcrumbs component
 * Practical topic: Navigation layout and page structure, Multi-page SPA design
 */
export default function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null

  return (
    <nav className="qm-breadcrumbs" aria-label="Breadcrumbs">
      <ol className="qm-breadcrumbs__list">
        <li className="qm-breadcrumbs__item">
          <Link to="/" className="qm-breadcrumbs__link">
            <Home className="qm-breadcrumbs__home-icon" />
            <span>Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={item.path || item.label} className="qm-breadcrumbs__item">
              <span className="qm-breadcrumbs__separator">/</span>
              {isLast || !item.path ? (
                <span className="qm-breadcrumbs__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.path} className="qm-breadcrumbs__link">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
