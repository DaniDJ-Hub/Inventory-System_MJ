import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export type RoleName = 'admin' | 'manager' | 'cashier' | 'employee'

interface RequireRoleResult {
  userId: string
  email: string
  role: RoleName
  supabase: SupabaseClient
}

/**
 * Server-side authorization guard for App Router Server Components / Route Handlers.
 *
 * WHY THIS EXISTS
 * ----------------
 * Supabase RLS policies are the *last* line of defense (and must exist independently —
 * see /supabase/migrations/0001_security_rls_policies.sql). This helper is the *first*
 * line of defense: it stops unauthorized users from ever rendering a restricted page,
 * instead of letting them load the page and only fail on individual queries.
 *
 * Defense in depth: even if a future RLS policy is misconfigured, this guard still
 * prevents cashiers/employees from reaching admin-only routes like /dashboard/configuracion.
 *
 * USAGE
 * -----
 *   export default async function ConfiguracionPage() {
 *     const { userId, role } = await requireRole(['admin'])
 *     ...
 *   }
 */
export async function requireRole(allowed: RoleName[]): Promise<RequireRoleResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_active, role:roles(name)')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    // Profile row missing/unreadable — fail closed, never open.
    redirect('/dashboard?error=forbidden')
  }

  const roleRelation = profile.role as { name: RoleName } | { name: RoleName }[] | null
  const roleName = Array.isArray(roleRelation) ? roleRelation[0]?.name : roleRelation?.name

  if (!profile.is_active || !roleName || !allowed.includes(roleName)) {
    redirect('/dashboard?error=forbidden')
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    role: roleName,
    supabase,
  }
}

/**
 * Non-redirecting variant for cases where the caller wants to render a fallback UI
 * (e.g. hide a section) instead of redirecting away from the whole page.
 */
export async function getCurrentUserRole(): Promise<RoleName | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active, role:roles(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.is_active) return null

  const roleRelation = profile.role as { name: RoleName } | { name: RoleName }[] | null
  return (Array.isArray(roleRelation) ? roleRelation[0]?.name : roleRelation?.name) ?? null
}
