import { createClient } from '@/lib/supabase/server'
import { CategoriesContent } from '@/components/categories/categories-content'

// FIX (Crítico #3): antes se listaban TODAS las categorías sin filtrar por
// is_active; tras habilitar el borrado lógico, las desactivadas ya no deben
// aparecer aquí. El conteo de productos también se limita a productos activos,
// para que sea consistente con lo que se ve en la página de Productos.
export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const { data: productCounts } = await supabase
    .from('products')
    .select('category_id')
    .eq('is_active', true)

  const categoriesWithCount = (categories ?? []).map(cat => ({
    ...cat,
    product_count: productCounts?.filter(p => p.category_id === cat.id).length ?? 0
  }))

  return <CategoriesContent initialCategories={categoriesWithCount} />
}
