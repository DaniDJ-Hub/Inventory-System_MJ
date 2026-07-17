import { ConfiguracionContent } from '@/components/configuracion/configuracion-content'
import { requireRole } from '@/lib/auth/require-role'

// FIX (Crítico #1/#2): esta página gestiona roles y usuarios del sistema — antes
// solo verificaba `if (!user)`, permitiendo que CUALQUIER usuario autenticado
// (incluyendo un "cashier") viera la lista completa de usuarios y, potencialmente,
// se autoasignara el rol de administrador desde el cliente. `requireRole` corta el
// acceso a nivel de Server Component, antes de que se ejecute cualquier query.
// Esto es defensa en profundidad: las políticas RLS (ver /supabase/migrations)
// deben bloquear esto también a nivel de base de datos.
// FIX: Supabase tipa las relaciones embebidas (`role:roles(...)`) como
// arreglo por defecto sin un esquema generado (`supabase gen types`). En
// tiempo de ejecución, para una FK 1-a-1 siempre es un único objeto o null.
// Se normaliza aquí, en el borde servidor→cliente, una sola vez — mismo
// patrón ya usado en app/dashboard/page.tsx — en vez de que cada componente
// cliente tenga que manejar ambos casos.
function normalizeRole<T extends { role?: unknown }>(row: T) {
  const role = row.role
  return {
    ...row,
    role: (Array.isArray(role) ? role[0] : role) ?? null,
  }
}

export default async function ConfiguracionPage() {
  const {
    userId: currentUserId,
    email: currentUserEmail,
    role: currentUserRole,
    supabase,
  } = await requireRole(['admin'])

  const [
    { data: settings },
    { data: profile },
    { data: roles },
    { data: usuarios },
  ] = await Promise.all([
    // Configuración del negocio (toma el primer registro, o null)
    supabase
      .from('business_settings')
      .select('*')
      .maybeSingle(),

    // Perfil del usuario actual
    supabase
      .from('profiles')
      .select('*, role:roles(id, name, description)')
      .eq('id', currentUserId)
      .single(),

    // Roles disponibles
    supabase
      .from('roles')
      .select('id, name, description, permissions')
      .order('name'),

    // Lista de usuarios del sistema
    supabase
      .from('profiles')
      .select('id, first_name, last_name, phone, is_active, role:roles(id, name)')
      .order('first_name'),
  ])

  return (
    <ConfiguracionContent
      userId={currentUserId}
      userEmail={currentUserEmail}
      currentUserRole={currentUserRole}
      settings={settings}
      profile={profile ? normalizeRole(profile) : null}
      roles={roles ?? []}
      usuarios={(usuarios ?? []).map(normalizeRole)}
    />
  )
}