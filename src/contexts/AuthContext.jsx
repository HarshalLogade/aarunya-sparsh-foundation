import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  logout: async () => {},
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let mounted = true

    const checkAdminStatus = async (userId) => {
      if (!userId) {
        if (mounted) setIsAdmin(false)
        return
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('auth_uid', userId)
        .limit(1)

      if (!mounted) return
      setIsAdmin(!error && (data?.length ?? 0) > 0)
    }

    const initAuth = async () => {
      setLoading(true)
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      await checkAdminStatus(data.session?.user?.id)
      if (!mounted) return
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      setSession(session)

      if (!session?.user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setLoading(true)
      await checkAdminStatus(session.user.id)
      if (!mounted) return
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    return await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
