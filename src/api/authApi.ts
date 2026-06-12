import api from './axios'
import { type LoginRequest, type LoginResponse } from '@/types'

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', request)
  return data
}
