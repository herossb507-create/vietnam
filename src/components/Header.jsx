import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../lib/auth'
import NotificationBell from './NotificationBell'

const LANGS = [
  { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'ko', flag: '🇰🇷', label: '한국어' },
]

function Header({ onLoginClick, onSearchClick }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showLang, setShowLang] = useState(false)
  const menuRef = useRef(null)
  const langRef = useRef(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!showMenu && !showLang) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
      if (langRef.current && !langRef.current.contains(e.target)) setShowLang(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu, showLang])

  const handleSignOut = async () => {
    setShowMenu(false)
    await signOut()
  }

  const handleLangChange = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
    setShowLang(false)
  }

  const currentLang = LANGS.find((l) => l.code === i18n.language) || LANGS[0]

  return (
    <header>
      <div className="header-inner">
        <div className="logo">KoViet <span>Guide</span></div>

        <div className="header-right">
          {/* 언어 전환 */}
          <div className="lang-wrap" ref={langRef}>
            <button className="lang-btn" onClick={() => setShowLang((v) => !v)} aria-label="Language">
              <span className="lang-flag">{currentLang.flag}</span>
            </button>
            {showLang && (
              <div className="lang-dropdown">
                {LANGS.map((lang) => (
                  <button
                    key={lang.code}
                    className={`lang-option ${lang.code === i18n.language ? 'active' : ''}`}
                    onClick={() => handleLangChange(lang.code)}
                  >
                    <span className="lang-flag">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

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
                    {t('header.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── 비로그인 상태: 로그인 버튼 ── */
            <button className="login-header-btn" onClick={onLoginClick}>
              {t('header.login')}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
