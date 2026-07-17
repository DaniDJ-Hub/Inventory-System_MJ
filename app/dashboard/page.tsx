import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // FIX: leer el umbral de stock bajo desde business_settings
  // en lugar de hardcodearlo a 10
  const { data: settings } = await supabase
    .from('business_settings')
    .select('low_stock_threshold')
    .maybeSingle()

  const lowStockThreshold = settings?.low_stock_threshold ?? 10

  // Inicio de la semana (lunes)
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1))
  startOfWeek.setHours(0, 0, 0, 0)

  const [
    { count: totalProducts },
    { count: lowStockCount },
    { count: totalCustomers },
    { count: totalSuppliers },
    { data: todaySales },
    { data: recentSalesRaw },
    { data: lowStockProducts },
    { data: categories },
    { data: salesThisWeek },
    { data: saleItemsRaw },
    { data: recentPurchasesRaw },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),

    // FIX: usa el threshold dinámico de la configuración del negocio
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lt('stock_quantity', lowStockThreshold)
      .eq('is_active', true),

    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),

    supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),

    // Ventas de hoy
    supabase
      .from('sales')
      .select('total')
      .gte('created_at', new Date().toISOString().split('T')[0]),

    // Ventas recientes con método de pago
    supabase
      .from('sales')
      .select('id, sale_number, total, payment_method, created_at, customer:customers(name)')
      .order('created_at', { ascending: false })
      .limit(6),

    // FIX: usa el threshold dinámico aquí también
    supabase
      .from('products')
      .select('id, name, sku, stock_quantity, min_stock, sale_price')
      .lt('stock_quantity', lowStockThreshold)
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true })
      .limit(5),

    // Categorías activas
    supabase
      .from('categories')
      .select('id, name, color')
      .eq('is_active', true),

    // Ventas de la semana para la gráfica
    supabase
      .from('sales')
      .select('total, created_at')
      .gte('created_at', startOfWeek.toISOString()),

    // Items de venta para top productos
    supabase
      .from('sale_items')
      .select('quantity, total, product:products(id, name, sku)')
      .limit(500),

    // Compras recientes
    supabase
      .from('purchases')
      .select('id, purchase_number, total, created_at, supplier:suppliers(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // ── Fix tipos: Supabase devuelve relaciones como array ────────
  const recentSales = (recentSalesRaw ?? []).map(s => ({
    ...s,
    customer: Array.isArray(s.customer)
      ? (s.customer[0] as { name: string } | undefined) ?? null
      : (s.customer as { name: string } | null),
  }))

  const recentPurchases = (recentPurchasesRaw ?? []).map(p => ({
    ...p,
    supplier: Array.isArray(p.supplier)
      ? (p.supplier[0] as { name: string } | undefined) ?? null
      : (p.supplier as { name: string } | null),
  }))

  // ── Estadísticas del día ──────────────────────────────────────
  const todaySalesTotal = todaySales?.reduce((sum, s) => sum + (s.total || 0), 0) ?? 0
  const todaySalesCount = todaySales?.length ?? 0

  // ── Ventas por día de la semana ───────────────────────────────
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const weekSales = days.map((day, i) => {
    const daySales = salesThisWeek?.filter(s => {
      const d = new Date(s.created_at)
      const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1
      return dayIndex === i
    }) ?? []
    return {
      day,
      total: daySales.reduce((sum, s) => sum + (s.total || 0), 0),
      count: daySales.length,
    }
  })

  // ── Top productos más vendidos ────────────────────────────────
  const productMap = new Map<string, {
    id: string
    name: string
    sku: string
    total_sold: number
    revenue: number
  }>()

  for (const item of saleItemsRaw ?? []) {
    const productRaw = Array.isArray(item.product)
      ? item.product[0]
      : item.product

    const p = productRaw as { id: string; name: string; sku: string } | null
    if (!p?.id) continue

    const existing = productMap.get(p.id) ?? {
      id: p.id,
      name: p.name,
      sku: p.sku,
      total_sold: 0,
      revenue: 0,
    }
    existing.total_sold += item.quantity ?? 0
    existing.revenue += item.total ?? 0
    productMap.set(p.id, existing)
  }

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // ── Desglose de métodos de pago hoy ──────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]
  const paymentBreakdown = recentSales
    .filter(s => s.created_at.startsWith(todayStr))
    .reduce(
      (acc, s) => {
        const method = s.payment_method as 'cash' | 'card' | 'transfer' | 'credit'
        acc[method] = (acc[method] ?? 0) + (s.total ?? 0)
        return acc
      },
      { cash: 0, card: 0, transfer: 0, credit: 0 }
    )

  const stats = {
    totalProducts: totalProducts ?? 0,
    lowStockCount: lowStockCount ?? 0,
    totalCustomers: totalCustomers ?? 0,
    totalSuppliers: totalSuppliers ?? 0,
    todaySalesTotal,
    todaySalesCount,
  }

  return (
    <DashboardContent
      stats={stats}
      recentSales={recentSales}
      lowStockProducts={lowStockProducts ?? []}
      categories={categories ?? []}
      weekSales={weekSales}
      topProducts={topProducts}
      paymentBreakdown={paymentBreakdown}
      recentPurchases={recentPurchases}
    />
  )
}