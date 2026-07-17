import { createClient } from '@/lib/supabase/server'
import { PurchasesContent } from '@/components/purchases/purchases-content'

export default async function PurchasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: purchases },
    { data: suppliers },
    { data: products },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('purchases')
      .select(`
        *,
        supplier:suppliers(id, name),
        user:profiles(id, first_name, last_name),
        items:purchase_items(
          id, quantity, unit_cost, total,
          product:products(id, name, sku)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('suppliers')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('products')
      .select('id, name, sku, cost_price, stock_quantity')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('profiles')
      .select('id')
      .eq('id', user?.id ?? '')
      .single(),
  ])

  return (
    <PurchasesContent 
      initialPurchases={purchases ?? []}
      suppliers={suppliers ?? []}
      products={products ?? []}
      userId={profile?.id ?? ''}
    />
  )
}
