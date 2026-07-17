import { createClient } from '@/lib/supabase/server'
import { ReportesContent } from '@/components/reportes/reportes-content'
import { redirect } from 'next/navigation'

export default async function ReportesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Rango: últimos 30 días
  const hoy = new Date()
  const hace30Dias = new Date()
  hace30Dias.setDate(hoy.getDate() - 30)

  const hace7Dias = new Date()
  hace7Dias.setDate(hoy.getDate() - 7)

  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)

  const [
    // Ventas últimos 30 días (para gráfica de tendencia)
    { data: ventasUltimos30 },
    // Ventas mes actual
    { data: ventasMesActual },
    // Ventas mes anterior (para comparar)
    { data: ventasMesAnterior },
    // Ventas por método de pago (últimos 30 días)
    { data: ventasPorMetodo },
    // Top 10 productos más vendidos
    { data: topProductos },
    // Productos con stock bajo
    { data: stockBajo },
    // Compras últimos 30 días
    { data: comprasUltimos30 },
    // Ventas por categoría
    { data: ventasPorCategoria },
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('total, payment_method, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', hace30Dias.toISOString())
      .order('created_at', { ascending: true }),

    supabase
      .from('sales')
      .select('total')
      .eq('payment_status', 'paid')
      .gte('created_at', inicioMes.toISOString()),

    supabase
      .from('sales')
      .select('total')
      .eq('payment_status', 'paid')
      .gte('created_at', inicioMesAnterior.toISOString())
      .lte('created_at', finMesAnterior.toISOString()),

    supabase
      .from('sales')
      .select('payment_method, total')
      .eq('payment_status', 'paid')
      .gte('created_at', hace30Dias.toISOString()),

    supabase
      .from('sale_items')
      .select('quantity, total, product:products(id, name, sku, sale_price, category:categories(name, color))')
      .gte('created_at', hace30Dias.toISOString()),

    supabase
      .from('products')
      .select('id, name, sku, stock_quantity, min_stock, sale_price, category:categories(name, color)')
      .filter('stock_quantity', 'lt', 'min_stock')
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true })
      .limit(20),

    supabase
      .from('purchases')
      .select('total, payment_status, created_at')
      .gte('created_at', hace30Dias.toISOString())
      .order('created_at', { ascending: true }),

    supabase
      .from('sale_items')
      .select('total, product:products(category:categories(name, color))')
      .gte('created_at', hace30Dias.toISOString()),
  ])

  // ── Procesar datos para la gráfica de ventas diarias ──
  const ventasPorDia = (() => {
    const mapa: Record<string, number> = {}
    // Inicializar los últimos 30 días en 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      mapa[key] = 0
    }
    ;(ventasUltimos30 ?? []).forEach(v => {
      const key = v.created_at.split('T')[0]
      if (mapa[key] !== undefined) mapa[key] += v.total
    })
    return Object.entries(mapa).map(([fecha, total]) => ({
      fecha,
      total: Math.round(total * 100) / 100,
      label: new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })
        .format(new Date(fecha + 'T12:00:00')),
    }))
  })()

  // ── Totales generales ──
  const totalMesActual = (ventasMesActual ?? []).reduce((s, v) => s + v.total, 0)
  const totalMesAnterior = (ventasMesAnterior ?? []).reduce((s, v) => s + v.total, 0)
  const crecimiento = totalMesAnterior > 0
    ? ((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100
    : 0

  const totalUltimos30 = (ventasUltimos30 ?? []).reduce((s, v) => s + v.total, 0)
  const totalCompras30 = (comprasUltimos30 ?? []).reduce((s, v) => s + v.total, 0)

  // ── Ventas por método de pago ──
  const metodos = (ventasPorMetodo ?? []).reduce(
    (acc, v) => {
      acc[v.payment_method] = (acc[v.payment_method] ?? 0) + v.total
      return acc
    },
    {} as Record<string, number>
  )
  const ventasMetodoPago = [
    { metodo: 'Efectivo', total: metodos['cash'] ?? 0, color: '#10b981' },
    { metodo: 'Tarjeta', total: metodos['card'] ?? 0, color: '#6366f1' },
    { metodo: 'Transferencia', total: metodos['transfer'] ?? 0, color: '#f59e0b' },
    { metodo: 'Crédito', total: metodos['credit'] ?? 0, color: '#ef4444' },
  ].filter(m => m.total > 0)

  // ── Top productos ──
  // FIX (Medio #16): `any` reemplazado por un tipo explícito. Además, igual
  // que en app/dashboard/page.tsx, Supabase puede devolver la relación
  // `product` como objeto o como arreglo de un elemento según el tipo de
  // join — se normaliza con el mismo patrón `Array.isArray` ya usado ahí,
  // por consistencia (DRY de convención, no de código compartido).
  interface SaleItemWithProduct {
    quantity: number
    total: number
    product:
      | { id: string; name: string; sku: string; category?: { name: string; color: string } | null }
      | { id: string; name: string; sku: string; category?: { name: string; color: string } | null }[]
      | null
  }

  const productosMap: Record<string, {
    nombre: string; sku: string; categoria: string; color: string;
    unidades: number; ingresos: number
  }> = {}
  ;(topProductos as SaleItemWithProduct[] | null ?? []).forEach((item) => {
    const product = Array.isArray(item.product) ? item.product[0] : item.product
    if (!product) return
    const id = product.id
    if (!productosMap[id]) {
      productosMap[id] = {
        nombre: product.name,
        sku: product.sku,
        categoria: product.category?.name ?? 'Sin categoría',
        color: product.category?.color ?? '#6b7280',
        unidades: 0,
        ingresos: 0,
      }
    }
    productosMap[id].unidades += item.quantity
    productosMap[id].ingresos += item.total
  })
  const topProductosData = Object.values(productosMap)
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 10)

  // ── Ventas por categoría ──
  interface SaleItemWithCategory {
    total: number
    product:
      | { category?: { name: string; color: string } | null }
      | { category?: { name: string; color: string } | null }[]
      | null
  }

  const catMap: Record<string, { nombre: string; color: string; total: number }> = {}
  ;(ventasPorCategoria as SaleItemWithCategory[] | null ?? []).forEach((item) => {
    const product = Array.isArray(item.product) ? item.product[0] : item.product
    const cat = product?.category
    if (!cat) return
    if (!catMap[cat.name]) catMap[cat.name] = { nombre: cat.name, color: cat.color, total: 0 }
    catMap[cat.name].total += item.total
  })
  const ventasCategorias = Object.values(catMap).sort((a, b) => b.total - a.total)

  // FIX: mismo problema de tipado de relaciones embebidas que en
  // configuracion/page.tsx — `category:categories(...)` se normaliza a un
  // solo objeto (o null) antes de cruzar el borde servidor→cliente.
  const stockBajoNormalizado = (stockBajo ?? []).map((p) => ({
    ...p,
    category: Array.isArray(p.category) ? (p.category[0] ?? null) : p.category,
  }))

  return (
    <ReportesContent
      ventasPorDia={ventasPorDia}
      totalMesActual={totalMesActual}
      totalMesAnterior={totalMesAnterior}
      crecimiento={crecimiento}
      totalUltimos30={totalUltimos30}
      totalCompras30={totalCompras30}
      ventasMetodoPago={ventasMetodoPago}
      topProductos={topProductosData}
      stockBajo={stockBajoNormalizado}
      ventasCategorias={ventasCategorias}
      cantidadVentas30={(ventasUltimos30 ?? []).length}
    />
  )
}