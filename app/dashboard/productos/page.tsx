import { createClient } from '@/lib/supabase/server'
import { ProductsContent } from '@/components/products/products-content'

const PAGE_SIZE = 25

interface ProductsPageProps {
  searchParams: Promise<{ page?: string; q?: string }>
}

// FIX (Alto #5): antes se traía TODA la tabla `products` sin `.range()`, y sin
// filtrar por `is_active`, lo que además causaba que productos desactivados
// (soft-deleted) siguieran apareciendo en el listado. Ahora se pagina en
// Postgres con `.range()` y se filtra + busca del lado del servidor.
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { page: pageParam, q } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1') || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, category:categories(id, name, color), supplier:suppliers(id, name)', {
      count: 'exact',
    })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`)
  }

  const [{ data: products, count }, { data: categories }, { data: suppliers }] = await Promise.all([
    query,
    supabase.from('categories').select('id, name, color').eq('is_active', true).order('name'),
    supabase.from('suppliers').select('id, name').eq('is_active', true).order('name'),
  ])

  return (
    <ProductsContent
      initialProducts={products ?? []}
      categories={categories ?? []}
      suppliers={suppliers ?? []}
      totalCount={count ?? 0}
      page={page}
      pageSize={PAGE_SIZE}
    />
  )
}
