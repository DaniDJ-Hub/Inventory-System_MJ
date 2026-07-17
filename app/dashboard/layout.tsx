import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role:roles(name)')
    .eq('id', user.id)
    .single()

  const roleRelation = profile?.role as { name: string } | { name: string }[] | null
  const roleName = Array.isArray(roleRelation) ? roleRelation[0]?.name : roleRelation?.name

  const userData = {
    email: user.email ?? '',
    firstName: profile?.first_name ?? 'Usuario',
    lastName: profile?.last_name ?? '',
    // FIX: se expone el rol al layout solo para UX (ocultar "Configuración"
    // en la barra lateral si el usuario no es admin). NO es la protección
    // real — esa vive en requireRole(['admin']) dentro de
    // app/dashboard/configuracion/page.tsx y en las políticas RLS.
    role: roleName ?? null,
  }

  return <DashboardLayoutClient user={userData}>{children}</DashboardLayoutClient>
}
