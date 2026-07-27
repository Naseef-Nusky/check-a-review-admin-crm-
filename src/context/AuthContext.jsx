import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { adminApi } from '../services/api'
import { isCrmRole, isSuperAdmin, isViewer } from '../utils/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('admin_user')
    return stored ? JSON.parse(stored) : null
  })
  const [authReady, setAuthReady] = useState(() => !localStorage.getItem('admin_token'))

  const login = useCallback((userData, token) => {
    localStorage.setItem('admin_user', JSON.stringify(userData))
    localStorage.setItem('admin_token', token)
    setUser(userData)
    setAuthReady(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_token')
    setUser(null)
    setAuthReady(true)
  }, [])

  // Refresh role from DB (e.g. after admin → super_admin promotion)
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      setAuthReady(true)
      return
    }

    let cancelled = false
    adminApi
      .getMe()
      .then((profile) => {
        if (cancelled) return
        if (!isCrmRole(profile.role)) {
          logout()
          return
        }
        localStorage.setItem('admin_user', JSON.stringify(profile))
        setUser(profile)
      })
      .catch(() => {
        if (!cancelled) logout()
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [logout])

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      authReady,
      isAuthenticated: !!user && isCrmRole(user.role),
      isSuperAdmin: !!user && isSuperAdmin(user.role),
      isViewer: !!user && isViewer(user.role),
      canWrite: !!user && isCrmRole(user.role) && !isViewer(user.role),
    }),
    [user, login, logout, authReady],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
