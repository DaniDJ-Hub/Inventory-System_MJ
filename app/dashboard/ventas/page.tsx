import { createClient } from '@/lib/supabase/server'
import { SalesContent } from '@/components/sales/sales-content'

export default async function SalesPage() {
  const supabase = await createClient()

  const { data: sales } = await supabase
    .from('sales')
    .select(`
      *,
      customer:customers(id, name),
      user:profiles(id, first_name, last_name),
      items:sale_items(
        id,
        quantity,
        unit_price,
        total,
        product:products(id, name, sku)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return <SalesContent initialSales={sales ?? []} />
}
