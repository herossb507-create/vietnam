import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { signIn, signUp, signInWithGoogle } from '../lib/auth'
import { useAuth } from '../context/AuthContext'

// 구글 로고 SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85L38.4 6.1A22.9 22.9 0 0 0 24 1C14.82 1 7.07 6.52 3.64 14.24l7.24 5.62C12.62 13.84 17.84 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.14 24.55c0-1.64-.14-3.22-.4-4.75H24v9h12.46c-.54 2.9-2.17 5.35-4.63 7l7.15 5.55C43.35 37.35 46.14 31.4 46.14 24.55z"/>
      <path fill="#FBBC05" d="M10.88 28.14A14.46 14.46 0 0 1 10 24c0-1.44.2-2.84.54-4.14L3.3 14.24A23 23 0 0 0 1 24c0 3.74.9 7.27 2.49 10.37l7.39-6.23z"/>
      <path fill="#34A853" d="M24 47c6.48 0 11.92-2.14 15.9-5.82l-7.15-5.55C30.6 37.4 27.46 38.5 24 38.5c-6.16 0-11.38-4.34-13.12-10.36l-7.39 6.23C7.07 41.48 14.82 47 24 47z"/>
    </svg>
  )
}

export default function AuthModal({ onClose }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [mode,     setMode]     = useState('login')   // 'login' | 'signup'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)

  // OAuth 콜백 등으로 로그인이 완료되면 자동으로 모달 닫기
  useEffect(() => {
    if (user) onClose()
  }, [user, onClose])

  const switchMode = (m) => { setMode(m); setError('') }

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t('auth.validationEmpty'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error: authErr } =
        mode === 'login'
          ? await signIn(email, password)
          : await signUp(email, password)
      if (authErr) throw authErr
      if (mode === 'signup') setDone(true)
    } catch (e) {
      const msg = {
        'Invalid login credentials':      t('auth.errInvalidLogin'),
        'Email not confirmed':             t('auth.errNotConfirmed'),
        'User already registered':         t('auth.errAlreadyRegistered'),
        'Password should be at least 6 characters': t('auth.errPasswordShort'),
      }[e.message] ?? e.message ?? t('auth.errGeneric')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      const { error: authErr } = await signInWithGoogle()
      if (authErr) throw authErr
    } catch (e) {
      setError(e.message ?? t('auth.errGoogleFail'))
    }
  }

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose() }
  const onKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="modal-overlay show" onClick={handleOverlay}>
      <div className="modal-sheet auth-sheet">
        <div className="modal-handle" />
        <button className="modal-close" onClick={onClose}>✕</button>

        {done ? (
          /* ── 회원가입 완료 ── */
          <div className="success-box">
            <div className="s-icon">📧</div>
            <div className="s-title">{t('auth.signupDoneTitle')}</div>
            <div className="s-desc">
              {t('auth.signupDoneDesc1')}<br />
              <strong>{email}</strong><br />
              {t('auth.signupDoneDesc2')}
            </div>
          </div>
        ) : (
          <>
            {/* 로고 + 타이틀 */}
            <div className="auth-logo">🔐</div>
            <div className="auth-headline">{t('auth.headline')}</div>
            <p className="auth-sub">{t('auth.sub')}</p>

            {/* 탭 */}
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === 'login'  ? 'active' : ''}`} onClick={() => switchMode('login')}>
                {t('auth.tabLogin')}
              </button>
              <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => switchMode('signup')}>
                {t('auth.tabSignup')}
              </button>
            </div>

            {/* 이메일 */}
            <div className="form-group">
              <label className="form-label">{t('auth.email')}</label>
              <input
                className="form-input"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={onKey}
                autoComplete="email"
              />
            </div>

            {/* 비밀번호 */}
            <div className="form-group">
              <label className="form-label">{t('auth.password')}</label>
              <input
                className="form-input"
                type="password"
                placeholder={mode === 'signup' ? t('auth.passwordMinHint') : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKey}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {/* 오류 메시지 */}
            {error && <p className="auth-error">{error}</p>}

            {/* 제출 */}
            <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? t('auth.processing') : mode === 'login' ? t('auth.submit') : t('auth.submitSignup')}
            </button>

            {/* 구분선 */}
            <div className="auth-divider"><span>{t('auth.or')}</span></div>

            {/* 구글 로그인 */}
            <button className="google-btn" onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              {t('auth.google')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
