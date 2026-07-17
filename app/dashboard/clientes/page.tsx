import { createClient } from '@/lib/supabase/server'
import { CustomersContent } from '@/components/customers/customers-content'

const PAGE_SIZE = 25

interface CustomersPageProps {
  searchParams: Promise<{ page?: string; q?: string }>
}

// FIX (Alto #5 + Crítico #3): paginación server-side + solo clientes activos
// (antes: tabla completa sin filtrar, y el borrado era físico).
export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { page: pageParam, q } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1') || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name')
    .range(from, to)

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const { data: customers, count } = await query

  return (
    <CustomersContent
      initialCustomers={customers ?? []}
      totalCount={count ?? 0}
      page={page}
      pageSize={PAGE_SIZE}
    />
  )
}
