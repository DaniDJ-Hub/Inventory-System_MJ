import * as React from 'react'
import { cn } from '@/lib/utils'

/*
  PaperFlow input field — dark background, blue focus ring.
*/

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Layout & base
        'w-full min-w-0 outline-none transition-[border-color,box-shadow,background]',
        // File input resets
        'file:text-[var(--text)] placeholder:text-[var(--text-faint)]',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        // Disabled
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      style={{
        height: 42,
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid var(--line-strong)',
        borderRadius: 'var(--r-sm)',
        color: 'var(--text)',
        fontFamily: 'var(--font)',
        fontSize: 14,
        padding: '0 13px',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--blue)'
        e.currentTarget.style.boxShadow = '0 0 0 3.5px var(--blue-ghost)'
        e.currentTarget.style.background = 'rgba(0,0,0,0.35)'
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--line-strong)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.background = 'rgba(0,0,0,0.25)'
        props.onBlur?.(e)
      }}
      {...props}
    />
  )
}

export { Input }