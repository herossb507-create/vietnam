import { useState, useEffect } from 'react'
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
      setError('Vui lòng nhập email và mật khẩu.')
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
      // 로그인 성공 → useEffect의 user 변화로 자동 닫힘
    } catch (e) {
      const msg = {
        'Invalid login credentials':      'Email hoặc mật khẩu không đúng.',
        'Email not confirmed':             'Email chưa được xác nhận. Kiểm tra hộp thư.',
        'User already registered':         'Email này đã được đăng ký.',
        'Password should be at least 6 characters': 'Mật khẩu tối thiểu 6 ký tự.',
      }[e.message] ?? e.message ?? 'Đã xảy ra lỗi. Vui lòng thử lại.'
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
      // 리다이렉트되므로 이후 코드는 실행 안 됨
    } catch (e) {
      setError(e.message ?? 'Không thể kết nối Google.')
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
            <div className="s-title">Kiểm tra email!</div>
            <div className="s-desc">
              Chúng tôi đã gửi link xác nhận tới<br />
              <strong>{email}</strong><br />
              Nhấp vào link để kích hoạt tài khoản.
            </div>
          </div>
        ) : (
          <>
            {/* 로고 + 타이틀 */}
            <div className="auth-logo">🔐</div>
            <div className="auth-headline">KoViet Guide</div>
            <p className="auth-sub">Đăng nhập để chia sẻ kinh nghiệm</p>

            {/* 탭 */}
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === 'login'  ? 'active' : ''}`} onClick={() => switchMode('login')}>
                Đăng nhập
              </button>
              <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => switchMode('signup')}>
                Đăng ký
              </button>
            </div>

            {/* 이메일 */}
            <div className="form-group">
              <label className="form-label">Email</label>
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
              <label className="form-label">Mật khẩu</label>
              <input
                className="form-input"
                type="password"
                placeholder={mode === 'signup' ? 'Tối thiểu 6 ký tự' : '••••••••'}
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
              {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>

            {/* 구분선 */}
            <div className="auth-divider"><span>hoặc</span></div>

            {/* 구글 로그인 */}
            <button className="google-btn" onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              Tiếp tục với Google
            </button>
          </>
        )}
      </div>
    </div>
  )
}
