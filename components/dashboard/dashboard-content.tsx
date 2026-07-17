'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Package,
  Users,
  Truck,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Receipt,
  Clock,
  Star,
  Activity,
  Layers,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRightLeft,
} from 'lucide-react'

interface DashboardContentProps {
  stats: {
    totalProducts: number
    lowStockCount: number
    totalCustomers: number
    totalSuppliers: number
    todaySalesTotal: number
    todaySalesCount: number
    // Nuevos campos opcionales
    weekSalesTotal?: number
    monthSalesTotal?: number
    totalPurchasesMonth?: number
    avgTicket?: number
    outOfStockCount?: number
  }
  recentSales: Array<{
    id: string
    sale_number: number
    total: number
    payment_method: string
    created_at: string
    customer?: { name: string } | null
    items_count?: number
  }>
  lowStockProducts: Array<{
    id: string
    name: string
    sku: string
    stock_quantity: number
    min_stock: number
    sale_price: number
  }>
  categories: Array<{
    id: string
    name: string
    color: string
    product_count?: number
  }>
  // Nuevas props opcionales
  topProducts?: Array<{
    id: string
    name: string
    sku: string
    total_sold: number
    revenue: number
  }>
  weekSales?: Array<{
    day: string
    total: number
    count: number
  }>
  paymentBreakdown?: {
    cash: number
    card: number
    transfer: number
    credit: number
  }
  recentPurchases?: Array<{
    id: string
    purchase_number: number
    total: number
    created_at: string
    supplier?: { name: string } | null
  }>
}

const paymentMethodConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  cash: { label: 'Efectivo', icon: Banknote, color: '#10b981' },
  card: { label: 'Tarjeta', icon: CreditCard, color: '#6366f1' },
  transfer: { label: 'Transferencia', icon: ArrowRightLeft, color: '#f59e0b' },
  credit: { label: 'Crédito', icon: Smartphone, color: '#f97316' },
}

const paymentBadgeClass: Record<string, string> = {
  cash: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50',
  card: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700/50',
  transfer: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50',
  credit: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/50',
}

export function DashboardContent({
  stats,
  recentSales,
  lowStockProducts,
  categories,
  topProducts = [],
  weekSales = [],
  paymentBreakdown,
  recentPurchases = [],
}: DashboardContentProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const formatTime = (dateString: string) =>
    new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateString))

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('es-MX', { dateStyle: 'short' }).format(new Date(dateString))

  const avgTicket = stats.todaySalesCount > 0
    ? stats.todaySalesTotal / stats.todaySalesCount
    : 0

  // Semana de ventas (fallback con datos vacíos si no se proveen)
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const weekData = weekSales.length > 0
    ? weekSales
    : days.map(d => ({ day: d, total: 0, count: 0 }))
  const maxDayTotal = Math.max(...weekData.map(d => d.total), 1)

  // Breakdown de pagos para hoy (de ventas recientes si no se pasa breakdown)
  const breakdown = paymentBreakdown ?? recentSales.reduce((acc, s) => {
    acc[s.payment_method] = (acc[s.payment_method] || 0) + s.total
    return acc
  }, {} as Record<string, number>)
  const breakdownTotal = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="space-y-5">

      {/* ── Encabezado ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </p>
        </div>
      </div>

      {/* ── KPIs principales ───────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Ventas hoy */}
        <div className="rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-sm relative overflow-hidden"
          style={{ border: '1.5px solid #6366f1' }}>
          <div className="h-1 w-full absolute top-0 left-0 rounded-t-xl" style={{ background: '#6366f1' }} />
          <div className="flex items-start justify-between mt-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6366f1' }}>Ventas hoy</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(stats.todaySalesTotal)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{stats.todaySalesCount} transacciones</p>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <DollarSign className="h-5 w-5" style={{ color: '#6366f1' }} />
            </div>
          </div>
          <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (stats.todaySalesCount / 20) * 100)}%`, background: '#6366f1' }} />
          </div>
        </div>

        {/* Ticket promedio */}
        <div className="rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-sm relative overflow-hidden"
          style={{ border: '1.5px solid #10b981' }}>
          <div className="h-1 w-full absolute top-0 left-0 rounded-t-xl" style={{ background: '#10b981' }} />
          <div className="flex items-start justify-between mt-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#10b981' }}>Ticket promedio</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(avgTicket)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">por transacción hoy</p>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <Receipt className="h-5 w-5" style={{ color: '#10b981' }} />
            </div>
          </div>
          <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (avgTicket / 500) * 100)}%`, background: '#10b981' }} />
          </div>
        </div>

        {/* Productos */}
        <div className="rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-sm relative overflow-hidden"
          style={{ border: '1.5px solid #2f6bff' }}>
          <div className="h-1 w-full absolute top-0 left-0 rounded-t-xl" style={{ background: '#2f6bff' }} />
          <div className="flex items-start justify-between mt-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#2f6bff' }}>Productos</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalProducts}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {stats.lowStockCount > 0
                  ? <span className="text-amber-500 font-medium">{stats.lowStockCount} con stock bajo</span>
                  : 'inventario al día'}
              </p>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(47,107,255,0.1)' }}>
              <Package className="h-5 w-5" style={{ color: '#2f6bff' }} />
            </div>
          </div>
          <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(47,107,255,0.15)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (stats.totalProducts / 500) * 100)}%`, background: '#2f6bff' }} />
          </div>
        </div>

        {/* Clientes */}
        <div className="rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-sm relative overflow-hidden"
          style={{ border: '1.5px solid #f59e0b' }}>
          <div className="h-1 w-full absolute top-0 left-0 rounded-t-xl" style={{ background: '#f59e0b' }} />
          <div className="flex items-start justify-between mt-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#f59e0b' }}>Clientes</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalCustomers}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{stats.totalSuppliers} proveedores activos</p>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Users className="h-5 w-5" style={{ color: '#f59e0b' }} />
            </div>
          </div>
          <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (stats.totalCustomers / 200) * 100)}%`, background: '#f59e0b' }} />
          </div>
        </div>
      </div>

      {/* ── Alerta stock bajo ──────────────────────────────────── */}
      {stats.lowStockCount > 0 && (
        <div className="rounded-xl border-2 border-l-4 border-amber-300 border-l-amber-400 dark:border-amber-700/60 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/40 p-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Stock bajo — {stats.lowStockCount} productos</h3>
              <p className="text-xs text-zinc-500">Requieren reabastecimiento pronto</p>
            </div>
            <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20" asChild>
              <Link href="/dashboard/productos?filter=low-stock">
                Ver todos <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
                  <TableHead className="text-xs">Producto</TableHead>
                  <TableHead className="text-xs">SKU</TableHead>
                  <TableHead className="text-right text-xs">Stock actual</TableHead>
                  <TableHead className="text-right text-xs">Mínimo</TableHead>
                  <TableHead className="text-right text-xs">Precio venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.slice(0, 5).map((p) => (
                  <TableRow key={p.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30">
                    <TableCell className="font-medium text-sm text-zinc-700 dark:text-zinc-300">{p.name}</TableCell>
                    <TableCell className="text-xs font-mono text-zinc-400">{p.sku}</TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center justify-center text-xs font-bold px-2 py-0.5 rounded-full border ${p.stock_quantity === 0
                          ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                        {p.stock_quantity === 0 ? 'Sin stock' : p.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-zinc-400">{p.min_stock}</TableCell>
                    <TableCell className="text-right text-xs font-medium text-zinc-600 dark:text-zinc-300">{formatCurrency(p.sale_price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Fila central: Gráfica semanal + Métodos de pago ───── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Gráfica ventas semana */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Ventas de la semana</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total por día</p>
            </div>
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-2">
              <BarChart3 className="h-4 w-4 text-zinc-400" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-28">
            {weekData.map((d) => {
              const pct = maxDayTotal > 0 ? (d.total / maxDayTotal) * 100 : 0
              const isToday = d.day === days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
              return (
                <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[10px] font-medium text-zinc-400">{d.total > 0 ? formatCurrency(d.total).replace('$', '$') : ''}</span>
                  <div className="w-full rounded-t-md overflow-hidden" style={{ height: 72 }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${isToday ? 'bg-violet-500' : 'bg-violet-200 dark:bg-violet-900/50'}`}
                      style={{ height: `${Math.max(pct, d.total > 0 ? 8 : 0)}%`, marginTop: `${100 - Math.max(pct, d.total > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${isToday ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-400'}`}>{d.day}</span>
                </div>
              )
            })}
          </div>
          {weekSales.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <span>Total semana: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatCurrency(weekData.reduce((a, d) => a + d.total, 0))}</span></span>
              <span>{weekData.reduce((a, d) => a + d.count, 0)} ventas</span>
            </div>
          )}
        </div>

        {/* Métodos de pago hoy */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Métodos de pago</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Distribución del día</p>
            </div>
          </div>
          <div className="space-y-3">
            {Object.entries(paymentMethodConfig).map(([key, config]) => {
              const amount = (breakdown as Record<string, number>)[key] || 0
              const pct = breakdownTotal > 0 ? (amount / breakdownTotal) * 100 : 0
              const Icon = config.icon
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{formatCurrency(amount)}</span>
                      <span className="text-[10px] text-zinc-400">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: config.color }} />
                  </div>
                </div>
              )
            })}
          </div>
          {stats.todaySalesTotal > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Total cobrado hoy</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatCurrency(stats.todaySalesTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Fila inferior: Ventas recientes + Top productos + Compras ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Ventas recientes */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Ventas recientes</h3>
              <p className="text-xs text-zinc-500">Últimas transacciones</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-zinc-600" asChild>
              <Link href="/dashboard/ventas">Ver todas <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>

          {recentSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingCart className="h-10 w-10 text-zinc-200 dark:text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-400">Sin ventas aún</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/dashboard/pos">Ir al POS</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-0">
              {recentSales.slice(0, 6).map((sale, i) => {
                const badgeClass = paymentBadgeClass[sale.payment_method] ?? 'bg-zinc-50 text-zinc-500 border-zinc-200'
                const pmConfig = paymentMethodConfig[sale.payment_method]
                return (
                  <div key={sale.id}>
                    <div className="flex items-center justify-between py-2.5 px-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                          <Receipt className="h-3.5 w-3.5 text-violet-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                            #{sale.sale_number}
                            {sale.customer?.name && (
                              <span className="font-normal text-zinc-400 ml-1">· {sale.customer.name}</span>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-2.5 w-2.5 text-zinc-300" />
                            <span className="text-[10px] text-zinc-400">{formatTime(sale.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{formatCurrency(sale.total)}</p>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${badgeClass}`}>
                          {pmConfig?.label ?? sale.payment_method}
                        </span>
                      </div>
                    </div>
                    {i < Math.min(recentSales.length - 1, 5) && (
                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-1" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Más vendidos</h3>
              <p className="text-xs text-zinc-500">Este período</p>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 p-1.5">
              <Star className="h-4 w-4 text-amber-500" />
            </div>
          </div>

          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Layers className="h-10 w-10 text-zinc-200 dark:text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-400">Sin datos aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((product, i) => {
                const maxRevenue = Math.max(...topProducts.map(p => p.revenue), 1)
                const pct = (product.revenue / maxRevenue) * 100
                return (
                  <div key={product.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-300 dark:text-zinc-600 w-4 text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{product.name}</p>
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 ml-2 flex-shrink-0">{formatCurrency(product.revenue)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-zinc-400 flex-shrink-0">{product.total_sold} uds</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Categorías debajo de top productos */}
          {categories.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Categorías</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.slice(0, 8).map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${cat.color}15`,
                      borderColor: `${cat.color}40`,
                      color: cat.color,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Compras recientes + Proveedores */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Compras recientes</h3>
              <p className="text-xs text-zinc-500">Últimas entradas</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-zinc-600" asChild>
              <Link href="/dashboard/compras">Ver todas <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>

          {recentPurchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Truck className="h-10 w-10 text-zinc-200 dark:text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-400">Sin compras recientes</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/dashboard/compras">Registrar compra</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-0">
              {recentPurchases.slice(0, 5).map((purchase, i) => (
                <div key={purchase.id}>
                  <div className="flex items-center justify-between py-2.5 px-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <Truck className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">#{purchase.purchase_number}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{purchase.supplier?.name ?? 'Sin proveedor'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{formatCurrency(purchase.total)}</p>
                      <p className="text-[10px] text-zinc-400">{formatDate(purchase.created_at)}</p>
                    </div>
                  </div>
                  {i < Math.min(recentPurchases.length - 1, 4) && (
                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-1" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Proveedores activos */}
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-500">Proveedores activos</span>
              </div>
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{stats.totalSuppliers}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}