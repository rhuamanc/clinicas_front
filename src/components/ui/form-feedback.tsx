import { cn } from '@/lib/utils'

export function RequiredLabel({ htmlFor, children }: { htmlFor?: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-800">
      {children} <span className="text-red-600">*</span>
    </label>
  )
}

export function OptionalLabel({ htmlFor, children }: { htmlFor?: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-800">
      {children}
    </label>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-medium text-red-600">{message}</p>
}

export function fieldClass(hasError: boolean) {
  return cn(hasError && 'border-red-500 ring-1 ring-red-200 focus-visible:ring-red-500')
}

export function isBlank(value?: string | null) {
  return !value || value.trim().length === 0
}
