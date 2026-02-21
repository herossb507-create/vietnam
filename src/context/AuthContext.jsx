import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    // 앱 시작 시 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    // 로그인 / 로그아웃 / OAuth 콜백 등 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, authLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Context 파일은 Provider + hook을 함께 export하는 표준 패턴이므로 예외 처리
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
