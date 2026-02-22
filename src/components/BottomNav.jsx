import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function BottomNav() {
  const { t } = useTranslation()
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  const NAV_ITEMS = [
    { path: '/',          icon: '🏠', label: t('nav.home') },
    { path: '/guide',     icon: '📋', label: t('nav.guide') },
    { path: '/life',      icon: '🏙️', label: t('nav.life') },
    { path: '/community', icon: '💬', label: t('nav.community') },
  ]

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ path, icon, label }) => (
        <div
          key={path}
          className={`nav-item ${pathname === path ? 'active' : ''}`}
          onClick={() => navigate(path)}
        >
          <div className="nav-icon">{icon}</div>
          <div className="nav-label">{label}</div>
        </div>
      ))}
    </nav>
  )
}

export default BottomNav
