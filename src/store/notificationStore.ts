import axios from 'axios'
import { create } from 'zustand'

type NotificationType = 'success' | 'error' | 'info'

type NotificationItem = {
  id: number
  message: string
  type: NotificationType
}

type NotificationState = {
  items: NotificationItem[]
  push: (message: string, type?: NotificationType) => void
  remove: (id: number) => void
}

const AUTO_CLOSE_MS = 3500

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  push: (message, type = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    set((state) => ({ items: [...state.items, { id, message, type }] }))
    window.setTimeout(() => {
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
    }, AUTO_CLOSE_MS)
  },
  remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}))

export function notifySuccess(message: string) {
  useNotificationStore.getState().push(message, 'success')
}

export function notifyError(message: string) {
  useNotificationStore.getState().push(message, 'error')
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { mensaje?: string; message?: string } | undefined
    return data?.mensaje ?? data?.message ?? error.message ?? fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
