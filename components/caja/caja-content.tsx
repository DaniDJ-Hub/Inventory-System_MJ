'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Calculator,
  Banknote,
  CreditCard,
  Building2,
  Lock,
  Unlock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'

interface CashRegister {
  id: string
  user_id: string
  opening_amount: number
  closing_amount: number | null
  expected_amount: number | null
  difference: number | null
  cash_sales: number
  card_sales: number
  transfer_sales: number
  status: 'open' | 'closed'
  opened_at: string
  closed_at: string | null
  notes: string | null
  user?: { first_name: string; last_name: string } | null
}

interface TotalesHoy {
  total: number
  efectivo: number
  tarjeta: number
  transferencia: number
  count: number
}

interface CajaContentProps {
  userId: string
  cajaAbierta: CashRegister | null
  historial: CashRegister[]
  totalesHoy: TotalesHoy
}

export function CajaContent({ userId, cajaAbierta: initialCaja, historial, totalesHoy }: CajaContentProps) {
  const router = useRouter()
  const [cajaAbierta, setCajaAbierta] = useState<CashRegister | null>(initialCaja)
  const [isLoading, setIsLoading] = useState(false)

  const [aperturaOpen, setAperturaOpen] = useState(false)
  const [montoApertura, setMontoApertura] = useState('')
  const [notasApertura, setNotasApertura] = useState('')

  const [cierreOpen, setCierreOpen] = useState(false)
  const [montoCierre, setMontoCierre] = useState('')
  const [notasCierre, setNotasCierre] = useState('')

  const [detalleOpen, setDetalleOpen] = useState(false)
  const [cajaDetalle, setCajaDetalle] = useState<CashRegister | null>(null)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString))

  const formatDuracion = (apertura: string, cierre: string | null) => {
    const fin = cierre ? new Date(cierre) : new Date()
    const inicio = new Date(apertura)
    const mins = Math.floor((fin.getTime() - inicio.getTime()) / 60000)
    const hrs = Math.floor(mins / 60)
    const m = mins % 60
    return hrs > 0 ? `${hrs}h ${m}m` : `${m}m`
  }

  const handleAbrirCaja = async () => {
    const monto = parseFloat(montoApertura)
    if (isNaN(monto) || monto < 0) { toast.error('Ingresa un monto válido'); return }
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('cash_registers')
        .insert({
          user_id: userId,
          opening_amount: monto,
          cash_sales: 0, card_sales: 0, transfer_sales: 0,
          status: 'open',
          notes: notasApertura || null,
        })
        .select('*, user:profiles(first_name, last_name)')
        .single()

      if (error) throw error
      setCajaAbierta(data)
      setAperturaOpen(false)
      setMontoApertura('')
      setNotasApertura('')
      toast.success('Caja abierta correctamente')
      router.refresh()
    } catch (err) {
      toast.error('Error al abrir la caja')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCerrarCaja = async () => {
    if (!cajaAbierta) return
    const montoCierre_ = parseFloat(montoCierre)
    if (isNaN(montoCierre_) || montoCierre_ < 0) { toast.error('Ingresa el monto físico en caja'); return }
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: ventasCaja } = await supabase
        .from('sales')
        .select('payment_method, total')
        .eq('payment_status', 'paid')
        .gte('created_at', cajaAbierta.opened_at)

      const cashSales = (ventasCaja ?? []).filter(v => v.payment_method === 'cash').reduce((s, v) => s + v.total, 0)
      const cardSales = (ventasCaja ?? []).filter(v => v.payment_method === 'card').reduce((s, v) => s + v.total, 0)
      const transferSales = (ventasCaja ?? []).filter(v => v.payment_method === 'transfer').reduce((s, v) => s + v.total, 0)

      const expectedAmount = cajaAbierta.opening_amount + cashSales
      const difference = montoCierre_ - expectedAmount

      const { error } = await supabase
        .from('cash_registers')
        .update({
          closing_amount: montoCierre_,
          expected_amount: expectedAmount,
          difference,
          cash_sales: cashSales,
          card_sales: cardSales,
          transfer_sales: transferSales,
          status: 'closed',
          closed_at: new Date().toISOString(),
          notes: notasCierre || cajaAbierta.notes,
        })
        .eq('id', cajaAbierta.id)

      if (error) throw error
      setCajaAbierta(null)
      setCierreOpen(false)
      setMontoCierre('')
      setNotasCierre('')
      toast.success('Corte de caja realizado correctamente')
      router.refresh()
    } catch (err) {
      toast.error('Error al cerrar la caja')
    } finally {
      setIsLoading(false)
    }
  }

  const diferencia = cajaAbierta
    ? parseFloat(montoCierre || '0') - (cajaAbierta.opening_amount + totalesHoy.efectivo)
    : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Corte de Caja</h1>
          <p className="text-muted-foreground">
            {cajaAbierta
              ? `Caja abierta desde ${formatDate(cajaAbierta.opened_at)}`
              : 'No hay caja abierta'}
          </p>
        </div>
        {cajaAbierta ? (
          <Button variant="destructive" onClick={() => setCierreOpen(true)}>
            <Lock className="mr-2 h-4 w-4" />
            Cerrar Caja
          </Button>
        ) : (
          <Button onClick={() => setAperturaOpen(true)}>
            <Unlock className="mr-2 h-4 w-4" />
            Abrir Caja
          </Button>
        )}
      </div>

      {/* Estado actual */}
      {cajaAbierta ? (
        <>
          {/* KPIs con borde de color */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl bg-card shadow-sm relative overflow-hidden" style={{ border: '1.5px solid #6366f1' }}>
              <div className="h-1 w-full absolute top-0 left-0" style={{ background: '#6366f1' }} />
              <div className="pt-5 px-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6366f1' }}>Fondo Inicial</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(cajaAbierta.opening_amount)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Al abrir la caja</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <Banknote className="h-5 w-5" style={{ color: '#6366f1' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card shadow-sm relative overflow-hidden" style={{ border: '1.5px solid #10b981' }}>
              <div className="h-1 w-full absolute top-0 left-0" style={{ background: '#10b981' }} />
              <div className="pt-5 px-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#10b981' }}>Ventas Efectivo</p>
                    <p className="mt-1 text-2xl font-bold" style={{ color: '#10b981' }}>{formatCurrency(totalesHoy.efectivo)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Desde apertura</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'rgba(16,185,129,0.1)' }}>
                    <Banknote className="h-5 w-5" style={{ color: '#10b981' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card shadow-sm relative overflow-hidden" style={{ border: '1.5px solid #2f6bff' }}>
              <div className="h-1 w-full absolute top-0 left-0" style={{ background: '#2f6bff' }} />
              <div className="pt-5 px-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#2f6bff' }}>Ventas Tarjeta</p>
                    <p className="mt-1 text-2xl font-bold" style={{ color: '#2f6bff' }}>{formatCurrency(totalesHoy.tarjeta)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{totalesHoy.count} ventas hoy</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'rgba(47,107,255,0.1)' }}>
                    <CreditCard className="h-5 w-5" style={{ color: '#2f6bff' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card shadow-sm relative overflow-hidden" style={{ border: '1.5px solid #f59e0b' }}>
              <div className="h-1 w-full absolute top-0 left-0" style={{ background: '#f59e0b' }} />
              <div className="pt-5 px-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#f59e0b' }}>Total Esperado</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(cajaAbierta.opening_amount + totalesHoy.efectivo)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Fondo + ventas efectivo</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <Calculator className="h-5 w-5" style={{ color: '#f59e0b' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose métodos de pago */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ border: '1.5px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.05)' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0" style={{ background: 'rgba(16,185,129,0.15)' }}>
                <Banknote className="h-5 w-5" style={{ color: '#10b981' }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Efectivo</p>
                <p className="text-xl font-bold" style={{ color: '#10b981' }}>{formatCurrency(totalesHoy.efectivo)}</p>
              </div>
            </div>
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ border: '1.5px solid rgba(47,107,255,0.4)', background: 'rgba(47,107,255,0.05)' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0" style={{ background: 'rgba(47,107,255,0.15)' }}>
                <CreditCard className="h-5 w-5" style={{ color: '#2f6bff' }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Tarjeta</p>
                <p className="text-xl font-bold" style={{ color: '#2f6bff' }}>{formatCurrency(totalesHoy.tarjeta)}</p>
              </div>
            </div>
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ border: '1.5px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.05)' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0" style={{ background: 'rgba(139,92,246,0.15)' }}>
                <Building2 className="h-5 w-5" style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Transferencia</p>
                <p className="text-xl font-bold" style={{ color: '#8b5cf6' }}>{formatCurrency(totalesHoy.transferencia)}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Lock className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Caja cerrada</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Abre la caja para comenzar a registrar ventas.
            </p>
            <Button onClick={() => setAperturaOpen(true)} className="mt-2">
              <Unlock className="mr-2 h-4 w-4" />
              Abrir Caja Ahora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Historial con tabla colorida ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Historial de Cortes
          </CardTitle>
          <CardDescription>Últimos cortes de caja realizados</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {historial.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No hay cortes registrados aún
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Apertura</TableHead>
                  <TableHead>Cierre</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead className="text-right">Fondo</TableHead>
                  <TableHead className="text-right">Efectivo</TableHead>
                  <TableHead className="text-right">Total Ventas</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historial.map((caja) => {
                  const totalVentas = (caja.cash_sales ?? 0) + (caja.card_sales ?? 0) + (caja.transfer_sales ?? 0)
                  const diff = caja.difference ?? 0
                  const diffPositive = diff > 0
                  const diffZero = diff === 0

                  return (
                    <TableRow
                      key={caja.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => { setCajaDetalle(caja); setDetalleOpen(true) }}
                    >
                      {/* Apertura */}
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(caja.opened_at)}
                      </TableCell>

                      {/* Cierre */}
                      <TableCell className="text-sm text-muted-foreground">
                        {caja.closed_at ? formatDate(caja.closed_at) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Abierta
                          </span>
                        )}
                      </TableCell>

                      {/* Duración */}
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ color: '#6366f1', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                          <Clock className="h-3 w-3" />
                          {formatDuracion(caja.opened_at, caja.closed_at)}
                        </span>
                      </TableCell>

                      {/* Fondo inicial */}
                      <TableCell className="text-right">
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(caja.opening_amount)}
                        </span>
                      </TableCell>

                      {/* Ventas efectivo */}
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full"
                          style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <Banknote className="h-3 w-3" />
                          {formatCurrency(caja.cash_sales ?? 0)}
                        </span>
                      </TableCell>

                      {/* Total ventas */}
                      <TableCell className="text-right">
                        <span className="text-sm font-bold tabular-nums">
                          {formatCurrency(totalVentas)}
                        </span>
                      </TableCell>

                      {/* Diferencia */}
                      <TableCell className="text-right">
                        <span
                          className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full tabular-nums"
                          style={{
                            color: diffZero ? '#10b981' : diffPositive ? '#2f6bff' : '#ef4444',
                            background: diffZero ? 'rgba(16,185,129,0.08)' : diffPositive ? 'rgba(47,107,255,0.08)' : 'rgba(239,68,68,0.08)',
                            border: `1px solid ${diffZero ? 'rgba(16,185,129,0.25)' : diffPositive ? 'rgba(47,107,255,0.25)' : 'rgba(239,68,68,0.25)'}`,
                          }}
                        >
                          {diffZero
                            ? <><CheckCircle2 className="h-3 w-3" /> Cuadre</>
                            : diffPositive
                            ? <><ArrowUpRight className="h-3 w-3" /> +{formatCurrency(diff)}</>
                            : <><ArrowDownRight className="h-3 w-3" /> {formatCurrency(diff)}</>
                          }
                        </span>
                      </TableCell>

                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">Ver</Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── DIALOG: ABRIR CAJA ── */}
      <Dialog open={aperturaOpen} onOpenChange={setAperturaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5" />
              Abrir Caja
            </DialogTitle>
            <DialogDescription>
              Cuenta el efectivo inicial y regístralo para comenzar el turno.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="monto-apertura">Fondo inicial (efectivo en caja)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input id="monto-apertura" type="number" min="0" step="0.01" placeholder="0.00" className="pl-7"
                  value={montoApertura} onChange={e => setMontoApertura(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas-apertura">Notas (opcional)</Label>
              <Input id="notas-apertura" placeholder="Ej: Turno matutino"
                value={notasApertura} onChange={e => setNotasApertura(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAperturaOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button onClick={handleAbrirCaja} disabled={isLoading || !montoApertura}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Abrir Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: CERRAR CAJA ── */}
      <Dialog open={cierreOpen} onOpenChange={setCierreOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Corte de Caja
            </DialogTitle>
            <DialogDescription>Cuenta el efectivo físico y registra el cierre del turno.</DialogDescription>
          </DialogHeader>
          {cajaAbierta && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Resumen del turno</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5" />Duración</span>
                    <span className="font-medium">{formatDuracion(cajaAbierta.opened_at, null)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fondo inicial</span>
                    <span className="font-medium">{formatCurrency(cajaAbierta.opening_amount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5 text-emerald-600" />Ventas efectivo</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(totalesHoy.efectivo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-blue-600" />Ventas tarjeta</span>
                    <span className="font-medium text-blue-600">{formatCurrency(totalesHoy.tarjeta)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-purple-600" />Transferencias</span>
                    <span className="font-medium text-purple-600">{formatCurrency(totalesHoy.transferencia)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total ventas</span>
                    <span>{formatCurrency(totalesHoy.total)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base">
                    <span>Efectivo esperado en caja</span>
                    <span>{formatCurrency(cajaAbierta.opening_amount + totalesHoy.efectivo)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto-cierre">Efectivo físico contado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input id="monto-cierre" type="number" min="0" step="0.01" placeholder="0.00"
                    className="pl-7 text-lg font-semibold" value={montoCierre}
                    onChange={e => setMontoCierre(e.target.value)} autoFocus />
                </div>
              </div>

              {montoCierre && (
                <div className={`rounded-lg border p-3 flex items-center justify-between ${
                  diferencia === 0 ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                    : diferencia > 0 ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {diferencia === 0
                      ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                      : <AlertTriangle className="h-4 w-4 text-red-600" />
                    }
                    <span className="text-sm font-medium">
                      {diferencia === 0 ? 'Cuadre perfecto' : diferencia > 0 ? 'Sobrante' : 'Faltante'}
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${
                    diferencia === 0 ? 'text-green-600' : diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {diferencia > 0 ? '+' : ''}{formatCurrency(diferencia)}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notas-cierre">Notas del cierre (opcional)</Label>
                <Input id="notas-cierre" placeholder="Ej: Todo cuadrado, turno sin incidencias"
                  value={notasCierre} onChange={e => setNotasCierre(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCierreOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button variant="destructive" onClick={handleCerrarCaja} disabled={isLoading || !montoCierre}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Corte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: DETALLE ── */}
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del Corte</DialogTitle>
            <DialogDescription>{cajaDetalle && formatDate(cajaDetalle.opened_at)}</DialogDescription>
          </DialogHeader>
          {cajaDetalle && (
            <ScrollArea className="max-h-96">
              <div className="space-y-3 pr-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <p className="text-xs text-muted-foreground mb-0.5">Cajero</p>
                    <p className="font-semibold text-sm">{cajaDetalle.user?.first_name} {cajaDetalle.user?.last_name}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <p className="text-xs text-muted-foreground mb-0.5">Duración</p>
                    <p className="font-semibold text-sm">{formatDuracion(cajaDetalle.opened_at, cajaDetalle.closed_at)}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Fondo inicial', value: formatCurrency(cajaDetalle.opening_amount), color: '' },
                    { label: 'Ventas efectivo', value: formatCurrency(cajaDetalle.cash_sales), color: '#10b981' },
                    { label: 'Ventas tarjeta', value: formatCurrency(cajaDetalle.card_sales), color: '#2f6bff' },
                    { label: 'Transferencias', value: formatCurrency(cajaDetalle.transfer_sales), color: '#8b5cf6' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium" style={row.color ? { color: row.color } : {}}>{row.value}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Efectivo esperado</span>
                    <span className="font-semibold">{formatCurrency(cajaDetalle.expected_amount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Efectivo contado</span>
                    <span className="font-semibold">{formatCurrency(cajaDetalle.closing_amount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-semibold">Diferencia</span>
                    <span
                      className="font-bold text-base"
                      style={{ color: (cajaDetalle.difference ?? 0) === 0 ? '#10b981' : (cajaDetalle.difference ?? 0) > 0 ? '#2f6bff' : '#ef4444' }}
                    >
                      {(cajaDetalle.difference ?? 0) > 0 ? '+' : ''}{formatCurrency(cajaDetalle.difference ?? 0)}
                    </span>
                  </div>
                </div>

                {cajaDetalle.notes && (
                  <div className="rounded-md bg-muted p-3 mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm">{cajaDetalle.notes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}