/**
 * Reusable animated Tabs component
 * Practical topic: Modal, tabs, dropdowns, toast notifications
 */
export default function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
  if (!tabs || tabs.length === 0) return null

  return (
    <div className={`qm-tabs-container ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`qm-tab-item ${isActive ? 'qm-tab-item--active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {Icon && <Icon className="qm-tab-icon" />}
            <span className="qm-tab-label">{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`qm-tab-count ${isActive ? 'qm-tab-count--active' : ''}`}>
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className="qm-tab-badge">{tab.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
