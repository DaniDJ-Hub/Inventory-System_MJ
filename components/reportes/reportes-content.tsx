'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Package,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  Loader2,
  FileText,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────
interface VentaDia { fecha: string; total: number; label: string }
interface MetodoPago { metodo: string; total: number; color: string }
interface TopProducto { nombre: string; sku: string; categoria: string; color: string; unidades: number; ingresos: number }
interface StockBajo { id: string; name: string; sku: string; stock_quantity: number; min_stock: number; sale_price: number; category?: { name: string; color: string } | null }
interface VentaCategoria { nombre: string; color: string; total: number }

interface ReportesContentProps {
  ventasPorDia: VentaDia[]
  totalMesActual: number
  totalMesAnterior: number
  crecimiento: number
  totalUltimos30: number
  totalCompras30: number
  ventasMetodoPago: MetodoPago[]
  topProductos: TopProducto[]
  stockBajo: StockBajo[]
  ventasCategorias: VentaCategoria[]
  cantidadVentas30: number
}

// ── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

const fmtShort = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  return fmt(n)
}

// FIX (Medio #16): `any` reemplazado por el tipo de recharts, con acceso
// seguro a `payload` (puede venir undefined durante animaciones/transiciones).
type RechartsTooltipProps = {
  active?: boolean
  payload?: Array<{ value?: number | string }>
  label?: string | number
}

const TooltipVentas = ({ active, payload, label }: RechartsTooltipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-medium mb-1">{label}</p>
      <p className="text-primary">{fmt(Number(payload[0]?.value ?? 0))}</p>
    </div>
  )
}

const TooltipBarras = ({ active, payload, label }: RechartsTooltipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-medium mb-1 max-w-[180px] truncate">{label}</p>
      <p className="text-primary">{fmt(Number(payload[0]?.value ?? 0))}</p>
    </div>
  )
}

// ── KPI Card con borde de color ────────────────────────────
function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  borderColor,
  iconBg,
  iconColor,
  valueColor,
}: {
  title: string
  value: string
  sub: React.ReactNode
  icon: React.ElementType
  borderColor: string
  iconBg: string
  iconColor: string
  valueColor?: string
}) {
  return (
    <div
      className="rounded-xl bg-card shadow-sm relative overflow-hidden"
      style={{ border: `1.5px solid ${borderColor}` }}
    >
      {/* Barra superior de color */}
      <div className="h-1 w-full absolute top-0 left-0" style={{ background: borderColor }} />
      <div className="pt-5 px-4 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
            <p className={`text-2xl font-bold tracking-tight ${valueColor ?? 'text-foreground'}`}>{value}</p>
            <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
          </div>
          <div className="rounded-lg p-2 ml-3 flex-shrink-0" style={{ background: iconBg }}>
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente Principal ───────────────────────────────────
export function ReportesContent({
  ventasPorDia,
  totalMesActual,
  totalMesAnterior,
  crecimiento,
  totalUltimos30,
  totalCompras30,
  ventasMetodoPago,
  topProductos,
  stockBajo,
  ventasCategorias,
  cantidadVentas30,
}: ReportesContentProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const utilidadBruta = totalUltimos30 - totalCompras30
  const margen = totalUltimos30 > 0 ? (utilidadBruta / totalUltimos30) * 100 : 0
  const ticketPromedio = cantidadVentas30 > 0 ? totalUltimos30 / cantidadVentas30 : 0

  const topBarras = topProductos.slice(0, 7).map(p => ({
    nombre: p.nombre.length > 18 ? p.nombre.slice(0, 18) + '…' : p.nombre,
    ingresos: Math.round(p.ingresos * 100) / 100,
  }))

  // ── Descarga PDF via print ─────────────────────────────
  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const fechaHoy = new Intl.DateTimeFormat('es-MX', {
        day: 'numeric', month: 'long', year: 'numeric'
      }).format(new Date())

      const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8"/>
          <title>Reporte PaperFlow — ${fechaHoy}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #fff; font-size: 12px; }
            .page { padding: 32px 36px; max-width: 800px; margin: 0 auto; }
            /* Header */
            .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 2px solid #2f6bff; }
            .logo { display: flex; align-items: center; gap: 10px; }
            .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #4f86ff, #1d4ed8); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 18px; }
            .logo-text h1 { font-size: 20px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; }
            .logo-text p { font-size: 11px; color: #6b7280; margin-top: 1px; }
            .header-meta { text-align: right; }
            .header-meta p { font-size: 11px; color: #6b7280; }
            .header-meta strong { color: #1a1a2e; }
            /* KPIs */
            .section-title { font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.06em; margin: 22px 0 12px; padding-left: 8px; border-left: 3px solid #2f6bff; }
            .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
            .kpi { padding: 14px; border-radius: 10px; border: 1.5px solid; }
            .kpi-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
            .kpi-value { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 3px; }
            .kpi-sub { font-size: 9px; color: #6b7280; }
            .kpi-ventas { border-color: #6366f1; background: #f5f3ff; }
            .kpi-ventas .kpi-label { color: #6366f1; }
            .kpi-ventas .kpi-value { color: #4f46e5; }
            .kpi-30 { border-color: #2f6bff; background: #eff6ff; }
            .kpi-30 .kpi-label { color: #2f6bff; }
            .kpi-30 .kpi-value { color: #1d4ed8; }
            .kpi-ticket { border-color: #10b981; background: #f0fdf4; }
            .kpi-ticket .kpi-label { color: #059669; }
            .kpi-ticket .kpi-value { color: #047857; }
            .kpi-utilidad { border-color: ${utilidadBruta >= 0 ? '#10b981' : '#ef4444'}; background: ${utilidadBruta >= 0 ? '#f0fdf4' : '#fef2f2'}; }
            .kpi-utilidad .kpi-label { color: ${utilidadBruta >= 0 ? '#059669' : '#dc2626'}; }
            .kpi-utilidad .kpi-value { color: ${utilidadBruta >= 0 ? '#047857' : '#b91c1c'}; }
            /* Tables */
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f9fafb; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th.right { text-align: right; }
            td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; color: #374151; }
            td.right { text-align: right; font-variant-numeric: tabular-nums; }
            td.mono { font-family: monospace; font-size: 10px; color: #9ca3af; }
            tr:last-child td { border-bottom: none; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: 600; }
            .badge-red { background: #fee2e2; color: #b91c1c; }
            .badge-amber { background: #fef3c7; color: #92400e; }
            /* Métodos de pago */
            .metodos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 20px; }
            .metodo { padding: 10px 12px; border-radius: 8px; border: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
            .metodo-name { font-size: 11px; font-weight: 600; color: #374151; }
            .metodo-total { font-size: 13px; font-weight: 700; }
            .metodo-pct { font-size: 9px; color: #9ca3af; margin-top: 1px; }
            /* Comparativo */
            .comparativo { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
            .comp-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f3f4f6; }
            .comp-label { font-size: 11px; color: #6b7280; }
            .comp-value { font-size: 11px; font-weight: 600; color: #1a1a2e; }
            .green { color: #059669; }
            .red { color: #dc2626; }
            /* Footer */
            .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
        <div class="page">
          <!-- Header -->
          <div class="header">
            <div class="logo">
              <div class="logo-icon">P</div>
              <div class="logo-text">
                <h1>PaperFlow</h1>
                <p>Sistema de Inventario y Punto de Venta</p>
              </div>
            </div>
            <div class="header-meta">
              <p>Reporte generado el <strong>${fechaHoy}</strong></p>
              <p>Período: <strong>Últimos 30 días</strong></p>
            </div>
          </div>

          <!-- KPIs -->
          <div class="section-title">Métricas principales</div>
          <div class="kpis">
            <div class="kpi kpi-ventas">
              <div class="kpi-label">Ventas este mes</div>
              <div class="kpi-value">${fmt(totalMesActual)}</div>
              <div class="kpi-sub">${crecimiento >= 0 ? '+' : ''}${crecimiento.toFixed(1)}% vs mes anterior</div>
            </div>
            <div class="kpi kpi-30">
              <div class="kpi-label">Ventas (30 días)</div>
              <div class="kpi-value">${fmt(totalUltimos30)}</div>
              <div class="kpi-sub">${cantidadVentas30} transacciones</div>
            </div>
            <div class="kpi kpi-ticket">
              <div class="kpi-label">Ticket promedio</div>
              <div class="kpi-value">${fmt(ticketPromedio)}</div>
              <div class="kpi-sub">Por transacción</div>
            </div>
            <div class="kpi kpi-utilidad">
              <div class="kpi-label">Utilidad bruta</div>
              <div class="kpi-value">${fmt(utilidadBruta)}</div>
              <div class="kpi-sub">Margen ${margen.toFixed(1)}%</div>
            </div>
          </div>

          <!-- Comparativo + Métodos de pago -->
          <div class="section-title">Ventas por método de pago</div>
          <div class="metodos">
            ${ventasMetodoPago.map(m => {
              const pct = totalUltimos30 > 0 ? (m.total / totalUltimos30) * 100 : 0
              return `
              <div class="metodo">
                <div>
                  <div class="metodo-name">${m.metodo}</div>
                  <div class="metodo-pct">${pct.toFixed(1)}% del total</div>
                </div>
                <div class="metodo-total" style="color:${m.color}">${fmt(m.total)}</div>
              </div>`
            }).join('')}
          </div>

          <!-- Comparativo mensual -->
          <div class="section-title">Comparativo mensual</div>
          <div style="max-width:360px; margin-bottom:20px;">
            <div class="comp-row"><span class="comp-label">Mes actual</span><span class="comp-value">${fmt(totalMesActual)}</span></div>
            <div class="comp-row"><span class="comp-label">Mes anterior</span><span class="comp-value">${fmt(totalMesAnterior)}</span></div>
            <div class="comp-row"><span class="comp-label">Diferencia</span><span class="comp-value ${totalMesActual >= totalMesAnterior ? 'green' : 'red'}">${totalMesActual >= totalMesAnterior ? '+' : ''}${fmt(totalMesActual - totalMesAnterior)}</span></div>
            <div class="comp-row"><span class="comp-label">Compras (30d)</span><span class="comp-value red">${fmt(totalCompras30)}</span></div>
            <div class="comp-row"><span class="comp-label">Utilidad bruta</span><span class="comp-value ${utilidadBruta >= 0 ? 'green' : 'red'}">${fmt(utilidadBruta)}</span></div>
          </div>

          <!-- Top productos -->
          <div class="section-title">Top 10 productos más vendidos</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th class="right">Unidades</th>
                <th class="right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              ${topProductos.slice(0, 10).map((p, i) => `
              <tr>
                <td class="mono">${i + 1}</td>
                <td><strong>${p.nombre}</strong></td>
                <td class="mono">${p.sku}</td>
                <td><span class="badge" style="background:${p.color}22;color:${p.color}">${p.categoria}</span></td>
                <td class="right">${p.unidades}</td>
                <td class="right"><strong>${fmt(p.ingresos)}</strong></td>
              </tr>`).join('')}
            </tbody>
          </table>

          <!-- Stock bajo -->
          ${stockBajo.length > 0 ? `
          <div class="section-title">Productos con stock bajo (${stockBajo.length})</div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th class="right">Stock actual</th>
                <th class="right">Mínimo</th>
                <th class="right">Faltante</th>
                <th class="right">Precio venta</th>
              </tr>
            </thead>
            <tbody>
              ${stockBajo.map(p => `
              <tr>
                <td><strong>${p.name}</strong></td>
                <td class="mono">${p.sku}</td>
                <td class="right"><span class="badge ${p.stock_quantity === 0 ? 'badge-red' : 'badge-amber'}">${p.stock_quantity === 0 ? 'Sin stock' : p.stock_quantity}</span></td>
                <td class="right">${p.min_stock}</td>
                <td class="right" style="color:#d97706;font-weight:600">${p.min_stock - p.stock_quantity}</td>
                <td class="right">${fmt(p.sale_price)}</td>
              </tr>`).join('')}
            </tbody>
          </table>` : ''}

          <!-- Ventas por categoría -->
          ${ventasCategorias.length > 0 ? `
          <div class="section-title">Ventas por categoría</div>
          <table>
            <thead>
              <tr><th>Categoría</th><th class="right">Total</th><th class="right">% del total</th></tr>
            </thead>
            <tbody>
              ${ventasCategorias.map(cat => {
                const pct = totalUltimos30 > 0 ? (cat.total / totalUltimos30) * 100 : 0
                return `<tr>
                  <td><span class="badge" style="background:${cat.color}22;color:${cat.color}">${cat.nombre}</span></td>
                  <td class="right"><strong>${fmt(cat.total)}</strong></td>
                  <td class="right">${pct.toFixed(1)}%</td>
                </tr>`
              }).join('')}
            </tbody>
          </table>` : ''}

          <!-- Footer -->
          <div class="footer">
            <span>PaperFlow — Sistema de Inventario y POS</span>
            <span>Generado el ${fechaHoy}</span>
          </div>
        </div>
        </body>
        </html>
      `

      const printWindow = window.open('', '_blank', 'width=900,height=700')
      if (!printWindow) {
        alert('Permite ventanas emergentes para descargar el PDF')
        return
      }
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 800)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">Últimos 30 días · datos en tiempo real</p>
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="gap-2"
          variant="outline"
        >
          {isDownloading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Download className="h-4 w-4" />
          }
          Descargar PDF
        </Button>
      </div>

      {/* ── KPIs con borde de color ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Ventas este mes"
          value={fmt(totalMesActual)}
          icon={DollarSign}
          borderColor="#6366f1"
          iconBg="rgba(99,102,241,0.1)"
          iconColor="#6366f1"
          sub={
            <div className="flex items-center gap-1">
              {crecimiento > 0
                ? <ArrowUpRight className="h-3 w-3 text-green-600" />
                : crecimiento < 0
                ? <ArrowDownRight className="h-3 w-3 text-red-600" />
                : <Minus className="h-3 w-3 text-muted-foreground" />
              }
              <span className={crecimiento > 0 ? 'text-green-600' : crecimiento < 0 ? 'text-red-600' : ''}>
                {crecimiento > 0 ? '+' : ''}{crecimiento.toFixed(1)}% vs mes anterior
              </span>
            </div>
          }
        />

        <KpiCard
          title="Ventas (30 días)"
          value={fmt(totalUltimos30)}
          icon={ShoppingBag}
          borderColor="#2f6bff"
          iconBg="rgba(47,107,255,0.1)"
          iconColor="#2f6bff"
          sub={<span>{cantidadVentas30} transacciones</span>}
        />

        <KpiCard
          title="Ticket promedio"
          value={fmt(ticketPromedio)}
          icon={TrendingUp}
          borderColor="#10b981"
          iconBg="rgba(16,185,129,0.1)"
          iconColor="#10b981"
          sub={<span>Por transacción</span>}
        />

        <KpiCard
          title="Utilidad bruta"
          value={fmt(utilidadBruta)}
          icon={BarChart3}
          borderColor={utilidadBruta >= 0 ? '#10b981' : '#ef4444'}
          iconBg={utilidadBruta >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}
          iconColor={utilidadBruta >= 0 ? '#10b981' : '#ef4444'}
          valueColor={utilidadBruta >= 0 ? 'text-emerald-600' : 'text-red-600'}
          sub={<span>Margen {margen.toFixed(1)}% · Compras {fmt(totalCompras30)}</span>}
        />
      </div>

      {/* ── Tabs de reportes ── */}
      <Tabs defaultValue="ventas">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
        </TabsList>

        {/* TAB: VENTAS */}
        <TabsContent value="ventas" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendencia de ventas — últimos 30 días</CardTitle>
              <CardDescription>Ingresos diarios totales</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={ventasPorDia} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={fmtShort} width={58} />
                  <Tooltip content={<TooltipVentas />} />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#colorVentas)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por método de pago</CardTitle>
                <CardDescription>Distribución últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent>
                {ventasMetodoPago.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={ventasMetodoPago} dataKey="total" nameKey="metodo" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                          {ventasMetodoPago.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-1">
                      {ventasMetodoPago.map((m) => {
                        const pct = totalUltimos30 > 0 ? (m.total / totalUltimos30) * 100 : 0
                        return (
                          <div key={m.metodo} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
                              <span className="text-muted-foreground">{m.metodo}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                              <span className="font-medium tabular-nums">{fmt(m.total)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comparativo mensual</CardTitle>
                <CardDescription>Mes actual vs mes anterior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                {[
                  { label: 'Mes actual', value: fmt(totalMesActual), color: '' },
                  { label: 'Mes anterior', value: fmt(totalMesAnterior), color: '' },
                  { label: 'Diferencia', value: `${totalMesActual >= totalMesAnterior ? '+' : ''}${fmt(totalMesActual - totalMesAnterior)}`, color: totalMesActual >= totalMesAnterior ? 'text-green-600' : 'text-red-600' },
                  { label: 'Crecimiento', value: `${crecimiento >= 0 ? '+' : ''}${crecimiento.toFixed(1)}%`, color: crecimiento >= 0 ? 'text-green-600' : 'text-red-600' },
                  { label: 'Compras (30d)', value: fmt(totalCompras30), color: 'text-orange-600' },
                  { label: 'Utilidad bruta', value: fmt(utilidadBruta), color: utilidadBruta >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold' },
                ].map((row, i, arr) => (
                  <div key={row.label} className={`flex justify-between items-center py-2.5 ${i < arr.length - 1 ? 'border-b' : ''}`}>
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className={`text-sm font-semibold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: PRODUCTOS */}
        <TabsContent value="productos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 7 productos por ingresos</CardTitle>
              <CardDescription>Últimos 30 días</CardDescription>
            </CardHeader>
            <CardContent>
              {topBarras.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin ventas registradas</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topBarras} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" strokeOpacity={0.06} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmtShort} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={130} axisLine={false} tickLine={false} />
                    <Tooltip content={<TooltipBarras />} />
                    <Bar dataKey="ingresos" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 10 productos — detalle</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topProductos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Unidades</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProductos.map((p, i) => (
                      <TableRow key={p.sku}>
                        <TableCell className="text-muted-foreground text-sm font-mono">{i + 1}</TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{p.nombre}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" style={{ background: p.color + '22', color: p.color, border: `1px solid ${p.color}44` }} className="text-xs">
                            {p.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{p.unidades}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{fmt(p.ingresos)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: CATEGORÍAS */}
        <TabsContent value="categorias" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ventas por categoría</CardTitle>
                <CardDescription>Últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent>
                {ventasCategorias.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={ventasCategorias} dataKey="total" nameKey="nombre" cx="50%" cy="50%" outerRadius={85} paddingAngle={2}
                        label={({ nombre, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                        labelLine={false}
                      >
                        {ventasCategorias.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ranking por categoría</CardTitle>
              </CardHeader>
              <CardContent>
                {ventasCategorias.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                ) : (
                  <div className="space-y-3">
                    {ventasCategorias.map((cat) => {
                      const pct = totalUltimos30 > 0 ? (cat.total / totalUltimos30) * 100 : 0
                      return (
                        <div key={cat.nombre} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                              <span className="font-medium">{cat.nombre}</span>
                            </div>
                            <span className="tabular-nums font-medium">{fmt(cat.total)}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cat.color }} />
                          </div>
                          <p className="text-xs text-muted-foreground text-right">{pct.toFixed(1)}% del total</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: INVENTARIO */}
        <TabsContent value="inventario" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Productos con stock bajo
                </CardTitle>
                <CardDescription>
                  {stockBajo.length} producto{stockBajo.length !== 1 ? 's' : ''} requieren reabastecimiento
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {stockBajo.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Package className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium text-green-600">Todo el inventario está bien abastecido</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Stock actual</TableHead>
                      <TableHead className="text-right">Mínimo</TableHead>
                      <TableHead className="text-right">Faltante</TableHead>
                      <TableHead className="text-right">Precio venta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockBajo.map((p) => {
                      const faltante = p.min_stock - p.stock_quantity
                      const critico = p.stock_quantity === 0
                      return (
                        <TableRow key={p.id} className={critico ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                          <TableCell>
                            <p className="font-medium text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku}</p>
                          </TableCell>
                          <TableCell>
                            {p.category ? (
                              <Badge variant="secondary" style={{ background: p.category.color + '22', color: p.category.color, border: `1px solid ${p.category.color}44` }} className="text-xs">
                                {p.category.name}
                              </Badge>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={critico ? 'destructive' : 'secondary'} className="tabular-nums">{p.stock_quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground tabular-nums">{p.min_stock}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold text-amber-600 tabular-nums">{faltante}</span>
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{fmt(p.sale_price)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}