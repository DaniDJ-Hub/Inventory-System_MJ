import { createClient } from '@/lib/supabase/server'
import { CajaContent } from '@/components/caja/caja-content'
import { redirect } from 'next/navigation'

export default async function CajaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: cajaAbierta },
    { data: historial },
    { data: ventasHoy },
  ] = await Promise.all([
    // Caja actualmente abierta por este usuario
    supabase
      .from('cash_registers')
      .select('*, user:profiles(first_name, last_name)')
      .eq('status', 'open')
      .eq('user_id', user.id)
      .maybeSingle(),

    // Historial de últimas 20 cajas cerradas
    supabase
      .from('cash_registers')
      .select('*, user:profiles(first_name, last_name)')
      .eq('status', 'closed')
      .order('closed_at', { ascending: false })
      .limit(20),

    // Ventas de hoy agrupadas por método de pago
    supabase
      .from('sales')
      .select('payment_method, total')
      .eq('payment_status', 'paid')
      .gte('created_at', new Date().toISOString().split('T')[0]),
  ])

  // Calcular totales de ventas hoy por método de pago
  const totalesHoy = (ventasHoy ?? []).reduce(
    (acc, venta) => {
      acc.total += venta.total
      if (venta.payment_method === 'cash') acc.efectivo += venta.total
      if (venta.payment_method === 'card') acc.tarjeta += venta.total
      if (venta.payment_method === 'transfer') acc.transferencia += venta.total
      acc.count += 1
      return acc
    },
    { total: 0, efectivo: 0, tarjeta: 0, transferencia: 0, count: 0 }
  )

  return (
    <CajaContent
      userId={user.id}
      cajaAbierta={cajaAbierta}
      historial={historial ?? []}
      totalesHoy={totalesHoy}
    />
  )
}