import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type AuthState, type LoginResponse } from '@/types'

interface AuthActions {
  login: (payload: LoginResponse) => void
  logout: () => void
}

const initialState: AuthState = {
  token: null,
  nombre: null,
  rol: null,
  idZona: null,
  recursos: [],
  isAuthenticated: false,
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,
      login: (payload) =>
        set({
          token: payload.token,
          nombre: payload.nombre,
          rol: payload.rol,
          idZona: payload.idZona,
          recursos: payload.recursos ?? [],
          isAuthenticated: true,
        }),
      logout: () => set(initialState),
    }),
    { name: 'farmacia-auth' }
  )
)
