'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { changePasswordSchema, firstZodError } from '@/lib/validations/schemas'

/**
 * FIX (Alto #7): segunda mitad del flujo de "olvidé mi contraseña", antes
 * inexistente. El usuario llega aquí ya autenticado temporalmente por el
 * enlace mágico del correo (procesado por /auth/callback), y define su
 * nueva contraseña bajo la misma política reforzada usada en Configuración
 * (10+ caracteres, mayúscula, minúscula y número).
 */
export default function UpdatePasswordPage() {
  const router = useRouter()
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsed = changePasswordSchema.safeParse({ nueva, confirmar })
    if (!parsed.success) {
      toast.error(firstZodError(parsed))
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: parsed.data.nueva })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Contraseña actualizada correctamente')
      router.push('/dashboard')
    } catch {
      toast.error('No se pudo actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crea una nueva contraseña</CardTitle>
          <CardDescription>Mínimo 10 caracteres, con mayúscula, minúscula y número</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nueva">Nueva contraseña</Label>
              <Input
                id="nueva"
                type="password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar contraseña</Label>
              <Input
                id="confirmar"
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar nueva contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
