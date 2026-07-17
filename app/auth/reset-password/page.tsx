'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'

/**
 * FIX (Alto #7): antes, el botón "¿Olvidaste tu contraseña?" en /auth/login
 * apuntaba a esta ruta, que no existía (404 en producción). Este formulario
 * dispara `resetPasswordForEmail`, que envía un correo con un enlace mágico
 * hacia /auth/callback?next=/auth/update-password.
 */
export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      setSent(true)
    } catch {
      toast.error('No se pudo enviar el correo de restablecimiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Restablecer contraseña</CardTitle>
          <CardDescription>
            {sent
              ? 'Revisa tu correo para continuar'
              : 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <Mail className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Si existe una cuenta con ese correo, recibirás un enlace para crear una
                nueva contraseña en unos minutos.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar enlace
              </Button>
            </form>
          )}

          <Link
            href="/auth/login"
            className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a iniciar sesión
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
