'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

/**
 * FIX (Bajo #21 / A09 OWASP): Next.js App Router usa convención de archivos
 * `error.tsx` como Error Boundary de React para todo lo que esté debajo de
 * este segmento. Antes no existía ninguno, así que cualquier excepción no
 * controlada (ej. un error de red al cargar el dashboard) mostraba la
 * pantalla de error genérica y en blanco de Next.js, sin posibilidad de
 * recuperación ni registro.
 *
 * En un proyecto real, `console.error` debería sustituirse por el SDK de
 * Sentry (u otra herramienta de monitoreo) — se deja el punto de integración
 * marcado explícitamente.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // TODO: reemplazar por Sentry.captureException(error) u otra herramienta
    // de monitoreo antes de ir a producción.
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">Algo salió mal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Reintentar</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
          Ir al dashboard
        </Button>
      </div>
    </div>
  )
}
