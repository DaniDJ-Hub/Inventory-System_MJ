'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Receipt,
  Eye,
  Calendar,
  User,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Smartphone,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'

interface SaleItem {
  id: string
  quantity: number
  unit_price: number
  total: number
  product?: { id: string; name: string; sku: string } | null
}

interface Sale {
  id: string
  sale_number: number
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  payment_method: string
  payment_status: string
  notes: string | null
  created_at: string
  customer?: { id: string; name: string } | null
  user?: { id: string; first_name: string; last_name: string } | null
  items?: SaleItem[]
}

interface SalesContentProps {
  initialSales: Sale[]
}

// ── Configuración de métodos de pago ──────────────────────
const paymentMethodConfig: Record<string, {
  label: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
}> = {
  cash:     { label: 'Efectivo',      icon: Banknote,       color: '#059669', bg: 'rgba(5,150,105,0.08)',   border: 'rgba(5,150,105,0.25)'   },
  card:     { label: 'Tarjeta',       icon: CreditCard,     color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.25)'  },
  transfer: { label: 'Transferencia', icon: ArrowRightLeft, color: '#d97706', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.25)'   },
  credit:   { label: 'Crédito',       icon: Smartphone,     color: '#ea580c', bg: 'rgba(234,88,12,0.08)',   border: 'rgba(234,88,12,0.25)'   },
}

// ── Configuración de estados ──────────────────────────────
const paymentStatusConfig: Record<string, {
  label: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
}> = {
  paid:      { label: 'Pagado',    icon: CheckCircle2, color: '#059669', bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.25)'  },
  pending:   { label: 'Pendiente', icon: Clock,        color: '#d97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.25)'  },
  cancelled: { label: 'Cancelado', icon: XCircle,      color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.25)'  },
}

export function SalesContent({ initialSales }: SalesContentProps) {
  const [sales] = useState<Sale[]>(initialSales)
  const [search, setSearch] = useState('')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  const filteredSales = sales.filter(sale =>
    sale.sale_number.toString().includes(search) ||
    (sale.customer?.name && sale.customer.name.toLowerCase().includes(search.toLowerCase()))
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString))

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
  const todaySales = filteredSales.filter(sale =>
    new Date(sale.created_at).toDateString() === new Date().toDateString()
  )
  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0)
  const avgTicket = filteredSales.length > 0 ? totalSales / filteredSales.length : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">Historial de transacciones</p>
        </div>
      </div>

      {/* ── KPIs con borde de color ── */}
      <div className="grid gap-4 md:grid-cols-3">

        {/* Ventas de hoy */}
        <div className="rounded-xl bg-card shadow-sm relative overflow-hidden"
          style={{ border: '1.5px solid #6366f1' }}>
          <div className="h-1 w-full absolute top-0 left-0" style={{ background: '#6366f1' }} />
          <div className="pt-5 px-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6366f1' }}>Ventas de Hoy</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(todayTotal)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{todaySales.length} transacciones</p>
              </div>
              <div className="rounded-lg p-2" style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Calendar className="h-5 w-5" style={{ color: '#6366f1' }} />
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(99,102,241,0.12)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (todaySales.length / 20) * 100)}%`, background: '#6366f1' }} />
            </div>
          </div>
        </div>

        {/* Total mostrado */}
        <div className="rounded-xl bg-card shadow-sm relative overflow-hidden"
          style={{ border: '1.5px solid #2f6bff' }}>
          <div className="h-1 w-full absolute top-0 left-0" style={{ background: '#2f6bff' }} />
          <div className="pt-5 px-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#2f6bff' }}>Total Mostrado</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(totalSales)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredSales.length} ventas</p>
              </div>
              <div className="rounded-lg p-2" style={{ background: 'rgba(47,107,255,0.1)' }}>
                <Receipt className="h-5 w-5" style={{ color: '#2f6bff' }} />
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(47,107,255,0.12)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (filteredSales.length / 50) * 100)}%`, background: '#2f6bff' }} />
            </div>
          </div>
        </div>

        {/* Ticket promedio */}
        <div className="rounded-xl bg-card shadow-sm relative overflow-hidden"
          style={{ border: '1.5px solid #10b981' }}>
          <div className="h-1 w-full absolute top-0 left-0" style={{ background: '#10b981' }} />
          <div className="pt-5 px-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#10b981' }}>Ticket Promedio</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(avgTicket)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">por transacción</p>
              </div>
              <div className="rounded-lg p-2" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <CreditCard className="h-5 w-5" style={{ color: '#10b981' }} />
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (avgTicket / 500) * 100)}%`, background: '#10b981' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Búsqueda ── */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* ── Tabla ── */}
      {filteredSales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Receipt className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No hay ventas</h3>
          <p className="text-muted-foreground">
            {search ? 'No se encontraron ventas con ese criterio' : 'Las ventas aparecerán aquí'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>No. Venta</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => {
                const pm = paymentMethodConfig[sale.payment_method]
                const ps = paymentStatusConfig[sale.payment_status]
                const PmIcon = pm?.icon ?? CreditCard
                const PsIcon = ps?.icon ?? CheckCircle2
                return (
                  <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-medium">
                      #{sale.sale_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(sale.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {sale.customer?.name ?? 'Público General'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {sale.user ? `${sale.user.first_name} ${sale.user.last_name}` : '—'}
                    </TableCell>

                    {/* Método de pago con color */}
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          color: pm?.color ?? '#6b7280',
                          background: pm?.bg ?? 'rgba(107,114,128,0.08)',
                          border: `1px solid ${pm?.border ?? 'rgba(107,114,128,0.2)'}`,
                        }}
                      >
                        <PmIcon className="h-3 w-3" />
                        {pm?.label ?? sale.payment_method}
                      </span>
                    </TableCell>

                    {/* Estado con color */}
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          color: ps?.color ?? '#6b7280',
                          background: ps?.bg ?? 'rgba(107,114,128,0.08)',
                          border: `1px solid ${ps?.border ?? 'rgba(107,114,128,0.2)'}`,
                        }}
                      >
                        <PsIcon className="h-3 w-3" />
                        {ps?.label ?? sale.payment_status}
                      </span>
                    </TableCell>

                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Detalle de venta ── */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Venta #{selectedSale?.sale_number}</DialogTitle>
            <DialogDescription>
              {selectedSale && formatDate(selectedSale.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedSale && (() => {
            const pm = paymentMethodConfig[selectedSale.payment_method]
            const ps = paymentStatusConfig[selectedSale.payment_status]
            const PmIcon = pm?.icon ?? CreditCard
            const PsIcon = ps?.icon ?? CheckCircle2
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Cliente</p>
                    </div>
                    <p className="font-semibold text-sm">{selectedSale.customer?.name ?? 'Público General'}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: pm ? pm.bg : 'rgba(107,114,128,0.06)', border: `1px solid ${pm ? pm.border : 'rgba(107,114,128,0.15)'}` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <PmIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Método de pago</p>
                    </div>
                    <p className="font-semibold text-sm" style={{ color: pm?.color }}>{pm?.label ?? selectedSale.payment_method}</p>
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: ps?.color, background: ps?.bg, border: `1px solid ${ps?.border}` }}
                  >
                    <PsIcon className="h-3 w-3" />
                    {ps?.label ?? selectedSale.payment_status}
                  </span>
                </div>

                <Separator />

                {/* Items */}
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {selectedSale.items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Totales */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedSale.subtotal)}</span>
                  </div>
                  {selectedSale.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Descuento</span>
                      <span>-{formatCurrency(selectedSale.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-1 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(selectedSale.total)}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}