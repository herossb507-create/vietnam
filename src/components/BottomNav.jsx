import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/',          icon: '🏠', label: 'Trang chủ' },
  { path: '/guide',     icon: '📋', label: 'Visa/EPS'  },
  { path: '/life',      icon: '🏙️', label: 'Cuộc sống' },
  { path: '/community', icon: '💬', label: 'Cộng đồng' },
]

function BottomNav() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

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
