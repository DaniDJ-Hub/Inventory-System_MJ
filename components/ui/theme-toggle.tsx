'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return (
    <div style={{ width: 38, height: 38 }} />
  )

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      style={{
        width: 38,
        height: 38,
        borderRadius: 9,
        border: '1px solid var(--line)',
        background: 'rgba(255,255,255,0.03)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all .15s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.color = 'var(--text)'
        el.style.background = 'rgba(255,255,255,0.07)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.color = 'var(--text-muted)'
        el.style.background = 'rgba(255,255,255,0.03)'
      }}
    >
      {isDark
        ? <Sun size={17} />
        : <Moon size={17} />
      }
    </button>
  )
}