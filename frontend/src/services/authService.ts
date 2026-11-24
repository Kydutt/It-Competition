import { api, initCsrf } from '../lib/axios'
import type { ApiResponse, PingData, User } from '../types/api'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  terms_accepted: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthData {
  user: User
}

export const authService = {
  /**
   * Health and connectivity check to backend API v1
   */
  async ping(): Promise<ApiResponse<PingData>> {
    const response = await api.get<ApiResponse<PingData>>('/api/v1/ping')
    return response.data
  },

  /**
   * Fetch CSRF cookie before authenticating
   */
  async csrf(): Promise<void> {
    await initCsrf()
  },

  /**
   * Register a new participant account
   */
  async register(payload: RegisterPayload): Promise<ApiResponse<AuthData>> {
    await initCsrf()
    const response = await api.post<ApiResponse<AuthData>>('/api/v1/auth/register', payload)
    return response.data
  },

  /**
   * Authenticate user via session
   */
  async login(payload: LoginPayload): Promise<ApiResponse<AuthData>> {
    await initCsrf()
    const response = await api.post<ApiResponse<AuthData>>('/api/v1/auth/login', payload)
    return response.data
  },

  /**
   * End authenticated session
   */
  async logout(): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>('/api/v1/auth/logout')
    return response.data
  },

  /**
   * Fetch current authenticated user profile
   */
  async getMe(): Promise<ApiResponse<{ user: User }>> {
    const response = await api.get<ApiResponse<{ user: User }>>('/api/v1/auth/me')
    return response.data
  },
}

export default authService
