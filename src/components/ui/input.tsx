import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function getNumericInputValue(value: React.InputHTMLAttributes<HTMLInputElement>['value']) {
  if (value == null) return ''
  return String(value)
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, onChange, onBlur, value, ...props }, ref) => {
  const isNumeric = type === 'number'
  const [numericValue, setNumericValue] = React.useState(() => (isNumeric ? getNumericInputValue(value) : ''))
  const previousValueRef = React.useRef(value)

  React.useEffect(() => {
    if (!isNumeric) return
    if (Object.is(previousValueRef.current, value)) return
    previousValueRef.current = value
    setNumericValue(getNumericInputValue(value))
  }, [isNumeric, value])

  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      ref={ref}
      value={isNumeric ? numericValue : value}
      onChange={(event) => {
        if (isNumeric) setNumericValue(event.target.value)
        onChange?.(event)
      }}
      onBlur={(event) => {
        if (isNumeric && event.target.value === '') {
          setNumericValue(getNumericInputValue(value))
        }
        onBlur?.(event)
      }}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
