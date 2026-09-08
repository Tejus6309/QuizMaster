import { Home } from '../components/icons/Icons.jsx'

export default function NotFound() {
  return (
    <div className="not-found">
      <h1 className="not-found__code">404</h1>
      <p className="not-found__text">This page doesn't exist.</p>
      <a href="/" className="btn btn--primary">
        <Home /> Back Home
      </a>
    </div>
  )
}
