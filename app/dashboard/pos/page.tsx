import { createClient } from '@/lib/supabase/server'
import { POSContent } from '@/components/pos/pos-content'

export default async function POSPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: products },
    { data: customers },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, sku, barcode, name, sale_price, stock_quantity, unit, category:categories(id, name, color)')
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .order('name'),
    supabase
      .from('customers')
      .select('id, name, email, phone')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('profiles')
      .select('id')
      .eq('id', user?.id ?? '')
      .single(),
  ])

  return (
    <POSContent 
      products={(products ?? []).map(p => ({
        ...p,
        category: Array.isArray(p.category) ? (p.category[0] ?? null) : p.category,
      }))}
      customers={customers ?? []}
      userId={profile?.id ?? ''}
    />
  )
}
