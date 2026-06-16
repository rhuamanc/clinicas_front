import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { hasResource } from '@/security/resourceCatalog'

interface RequireResourceProps {
  resourceKey: string
  children: ReactElement
}

export default function RequireResource({ resourceKey, children }: RequireResourceProps) {
  const recursos = useAuthStore((s) => s.recursos)

  if (!hasResource(recursos, resourceKey)) {
    return <Navigate to="/" replace />
  }

  return children
}
