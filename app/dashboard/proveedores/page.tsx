import { createClient } from '@/lib/supabase/server'
import { SuppliersContent } from '@/components/suppliers/suppliers-content'

const PAGE_SIZE = 25

interface SuppliersPageProps {
  searchParams: Promise<{ page?: string; q?: string }> 
}

// FIX (Alto #5 + Crítico #3): paginación server-side + solo proveedores activos.
export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const { page: pageParam, q } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1') || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from('suppliers')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name')
    .range(from, to)

  if (q) {
    query = query.or(`name.ilike.%${q}%,contact_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: suppliers, count } = await query

  return (
    <SuppliersContent
      initialSuppliers={suppliers ?? []}
      totalCount={count ?? 0}
      page={page}
      pageSize={PAGE_SIZE}
    />
  )
}
