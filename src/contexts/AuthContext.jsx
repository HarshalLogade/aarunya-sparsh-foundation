/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ADMIN_INACTIVITY_MS } from './adminSession'

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  logout: async () => {},
})

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const inactivityTimerRef = useRef(null)

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
  }, [])

  const handleSessionExpired = useCallback(async () => {
    clearInactivityTimer()
    await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
    setLoading(false)
    navigate('/login', { replace: true, state: { sessionExpired: true } })
  }, [clearInactivityTimer, navigate])

  const resetInactivityTimer = useCallback(() => {
    if (!session || !isAdmin || !location.pathname.startsWith('/admin')) {
      clearInactivityTimer()
      return
    }

    clearInactivityTimer()
    inactivityTimerRef.current = window.setTimeout(() => {
      handleSessionExpired()
    }, ADMIN_INACTIVITY_MS)
  }, [clearInactivityTimer, handleSessionExpired, isAdmin, location.pathname, session])

  useEffect(() => {
    if (!session || !isAdmin || !location.pathname.startsWith('/admin')) {
      clearInactivityTimer()
      return
    }

    const activityEvents = ['mousemove', 'click', 'keydown', 'scroll', 'touchstart']

    const handleActivity = () => {
      resetInactivityTimer()
    }

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true })
    })

    resetInactivityTimer()

    return () => {
      clearInactivityTimer()
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
      })
    }
  }, [clearInactivityTimer, isAdmin, location.pathname, resetInactivityTimer, session])

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
      clearInactivityTimer()
    }
  }, [clearInactivityTimer])

  const logout = async () => {
    clearInactivityTimer()
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
