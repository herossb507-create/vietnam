import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../lib/auth'
import NotificationBell from './NotificationBell'

function Header({ onLoginClick, onSearchClick }) {
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!showMenu) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const handleSignOut = async () => {
    setShowMenu(false)
    await signOut()
  }

  return (
    <header>
      <div className="header-inner">
        <div className="logo">KoViet <span>Guide</span></div>

        <div className="header-right">
          {/* 검색 아이콘 버튼 */}
          <button className="search-icon-btn" onClick={onSearchClick} aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" width="18" height="18">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <NotificationBell />
          {user ? (
            /* ── 로그인 상태: 아바타 + 드롭다운 ── */
            <div className="user-menu-wrap" ref={menuRef}>
              <button
                className="avatar-btn"
                onClick={() => setShowMenu((v) => !v)}
                title={user.email}
              >
                {user.email[0].toUpperCase()}
              </button>

              {showMenu && (
                <div className="user-dropdown">
                  <div className="user-dropdown-email">{user.email}</div>
                  <button className="user-dropdown-item" onClick={handleSignOut}>
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── 비로그인 상태: 로그인 버튼 ── */
            <button className="login-header-btn" onClick={onLoginClick}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
