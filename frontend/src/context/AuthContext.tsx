import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService, type LoginPayload, type RegisterPayload } from '../services/authService'
import type { User } from '../types/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const res = await authService.getMe()
      if (res.success && res.data?.user) {
        setUser(res.data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (payload: LoginPayload): Promise<User> => {
    setIsLoading(true)
    try {
      const res = await authService.login(payload)
      const currentUser = res.data.user
      setUser(currentUser)
      return currentUser
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload: RegisterPayload): Promise<User> => {
    setIsLoading(true)
    try {
      const res = await authService.register(payload)
      const currentUser = res.data.user
      setUser(currentUser)
      return currentUser
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await authService.logout()
    } catch (err) {
      console.warn('Logout error ignored:', err)
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }

  const refreshUser = async (): Promise<void> => {
    await checkAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
