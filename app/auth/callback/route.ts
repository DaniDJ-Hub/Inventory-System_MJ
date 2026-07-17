import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// FIX (defensa en profundidad): `next` viene de un query param controlado por
// quien construye el enlace (ej. un correo de reset-password). Antes se usaba
// directamente en `NextResponse.redirect(`${origin}${next}`)` sin validar que
// fuera una ruta relativa interna. Aunque la concatenación con `origin` ya
// mitigaba un open-redirect clásico, forzamos explícitamente que `next`
// empiece con "/" (nunca "//" ni una URL absoluta) para eliminar cualquier
// ambigüedad, siguiendo el principio de "allowlist" en vez de "denylist".
function sanitizeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/dashboard'
  }
  return next
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = sanitizeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
