import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

/**
 * FIX (Alto #7): /app/auth/callback/route.ts redirige aquí cuando
 * exchangeCodeForSession falla (enlace expirado, código inválido, etc.).
 * Antes esta ruta no existía, así que el usuario terminaba en un 404
 * genérico de Next.js sin ninguna explicación ni forma de continuar.
 */
export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>No pudimos verificar tu enlace</CardTitle>
          <CardDescription>
            El enlace pudo haber expirado o ya fue utilizado. Intenta iniciar sesión de nuevo
            o solicita un nuevo enlace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/auth/login">Ir a iniciar sesión</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/reset-password">Solicitar nuevo enlace</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
