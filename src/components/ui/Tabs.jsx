import { useState } from 'react'

export default function Tabs({ tabs, defaultTab = 0 }) {
  const [active, setActive] = useState(defaultTab)
  const activeTab = tabs[active]

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            className={`tab-btn ${active === i ? 'tab-btn--active' : ''}`}
            onClick={() => setActive(i)}
          >
            {t.label}
            {t.count !== undefined && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>
      <div className="tabs-body">{activeTab?.content}</div>
    </div>
  )
}
