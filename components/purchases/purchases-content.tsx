'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Truck,
  Loader2,
  Eye,
  Minus,
  Trash2,
  Package,
  ShoppingBag,
  Hash,
} from 'lucide-react'

interface PurchaseItem {
  id: string
  quantity: number
  unit_cost: number
  total: number
  product?: { id: string; name: string; sku: string } | null
}

interface Purchase {
  id: string
  purchase_number: number
  total: number
  status: string
  payment_status: string
  invoice_number: string | null
  created_at: string
  supplier?: { id: string; name: string } | null
  user?: { id: string; first_name: string; last_name: string } | null
  items?: PurchaseItem[]
}

interface Supplier {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  sku: string
  cost_price: number
  stock_quantity: number
}

interface CartItem {
  product: Product
  quantity: number
  unitCost: number
}

interface PurchasesContentProps {
  initialPurchases: Purchase[]
  suppliers: Supplier[]
  products: Product[]
  userId: string
}

export function PurchasesContent({ initialPurchases, suppliers, products, userId }: PurchasesContentProps) {
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases)
  const [search, setSearch] = useState('')
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')

  useEffect(() => {
    setPurchases(initialPurchases)
  }, [initialPurchases])

  const resetForm = () => {
    setSelectedSupplier('')
    setInvoiceNumber('')
    setCart([])
    setSelectedProduct('')
  }

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const existingItem = cart.find(item => item.product.id === productId)
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1, unitCost: product.cost_price }])
    }
    setSelectedProduct('')
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id !== productId) return item
      const newQuantity = item.quantity + delta
      if (newQuantity <= 0) return item
      return { ...item, quantity: newQuantity }
    }))
  }

  const updateUnitCost = (productId: string, cost: number) => {
    setCart(cart.map(item =>
      item.product.id === productId ? { ...item, unitCost: cost } : item
    ))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const total = cart.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) { toast.error('Agrega al menos un producto'); return }
    if (!selectedSupplier) { toast.error('Selecciona un proveedor'); return }

    setIsLoading(true)
    try {
      const supabase = createClient()

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          supplier_id: selectedSupplier,
          user_id: userId,
          subtotal: total,
          tax_amount: 0,
          total,
          status: 'received',
          payment_status: 'paid',
          invoice_number: invoiceNumber || null,
          received_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (purchaseError) throw purchaseError

      const purchaseItems = cart.map(item => ({
        purchase_id: purchase.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        total: item.quantity * item.unitCost,
      }))

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems)

      if (itemsError) throw itemsError

      for (const item of cart) {
        const newStock = item.product.stock_quantity + item.quantity
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock, cost_price: item.unitCost })
          .eq('id', item.product.id)

        if (stockError) throw stockError

        await supabase.from('stock_movements').insert({
          product_id: item.product.id,
          user_id: userId,
          movement_type: 'purchase',
          quantity: item.quantity,
          previous_stock: item.product.stock_quantity,
          new_stock: newStock,
          reference_type: 'purchase',
          reference_id: purchase.id,
        })
      }

      // Agregar al estado local inmediatamente
      const supplier = suppliers.find(s => s.id === selectedSupplier)
      setPurchases(prev => [{
        id: purchase.id,
        purchase_number: 0,
        total,
        status: 'received',
        payment_status: 'paid',
        invoice_number: invoiceNumber || null,
        created_at: new Date().toISOString(),
        supplier: supplier ? { id: supplier.id, name: supplier.name } : null,
        items: cart.map(item => ({
          id: crypto.randomUUID(),
          quantity: item.quantity,
          unit_cost: item.unitCost,
          total: item.quantity * item.unitCost,
          product: { id: item.product.id, name: item.product.name, sku: item.product.sku }
        }))
      }, ...prev])

      toast.success('Compra registrada')
      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Error al registrar compra')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPurchases = purchases.filter(purchase =>
    purchase.purchase_number.toString().includes(search) ||
    (purchase.supplier?.name && purchase.supplier.name.toLowerCase().includes(search.toLowerCase())) ||
    (purchase.invoice_number && purchase.invoice_number.includes(search))
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString))

  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.total, 0)
  const suppliersCount = new Set(filteredPurchases.map(p => p.supplier?.id).filter(Boolean)).size
  const avgPurchase = filteredPurchases.length > 0 ? totalPurchases / filteredPurchases.length : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compras</h1>
          <p className="text-muted-foreground">Registra compras a proveedores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Compra</DialogTitle>
              <DialogDescription>Registra una compra de mercancía</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proveedor *</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice">No. Factura</Label>
                  <Input id="invoice" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="A-12345" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Agregar Producto</Label>
                <Select value={selectedProduct} onValueChange={addToCart}>
                  <SelectTrigger><SelectValue placeholder="Buscar producto..." /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{p.name}</span>
                          <span className="text-muted-foreground text-xs">{p.sku}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {cart.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="w-[100px]">Cantidad</TableHead>
                        <TableHead className="w-[120px]">Costo Unit.</TableHead>
                        <TableHead className="text-right w-[100px]">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map(item => (
                        <TableRow key={item.product.id}>
                          <TableCell>
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)} disabled={item.quantity <= 1}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input type="number" step="0.01" min="0" value={item.unitCost}
                              onChange={e => updateUnitCost(item.product.id, parseFloat(e.target.value) || 0)}
                              className="h-8 w-24" />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.quantity * item.unitCost)}
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.product.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading || cart.length === 0}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Compra
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── KPIs con borde de color ── */}
      <div className="grid gap-4 md:grid-cols-3">

        {/* Total compras */}
        <div className="rounded-xl bg-card shadow-sm relative overflow-hidden"
          style={{ border: '1.5px solid #2f6bff' }}>
          <div className="h-1 w-full absolute top-0 left-0" style={{ background: '#2f6bff' }} />
          <div className="pt-5 px-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#2f6bff' }}>Total Compras</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(totalPurchases)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredPurchases.length} registros</p>
              </div>
              <div className="rounded-lg p-2" style={{ background: 'rgba(47,107,255,0.1)' }}>
                <Truck className="h-5 w-5" style={{ color: '#2f6bff' }} />
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(47,107,255,0.12)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (filteredPurchases.length / 50) * 100)}%`, background: '#2f6bff' }} />
            </div>
          </div>
        </div>

        {/* Proveedores activos */}
        <div className="rounded-xl bg-card shadow-sm relative overflow-hidden"
          style={{ border: '1.5px solid #f59e0b' }}>
          <div className="h-1 w-full absolute top-0 left-0" style={{ background: '#f59e0b' }} />
          <div className="pt-5 px-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#f59e0b' }}>Proveedores</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{suppliersCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">en este período</p>
              </div>
              <div className="rounded-lg p-2" style={{ background: 'rgba(245,158,11,0.1)' }}>
                <ShoppingBag className="h-5 w-5" style={{ color: '#f59e0b' }} />
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (suppliersCount / 10) * 100)}%`, background: '#f59e0b' }} />
            </div>
          </div>
        </div>

        {/* Compra promedio */}
        <div className="rounded-xl bg-card shadow-sm relative overflow-hidden"
          style={{ border: '1.5px solid #10b981' }}>
          <div className="h-1 w-full absolute top-0 left-0" style={{ background: '#10b981' }} />
          <div className="pt-5 px-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#10b981' }}>Compra Promedio</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(avgPurchase)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">por orden</p>
              </div>
              <div className="rounded-lg p-2" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <Hash className="h-5 w-5" style={{ color: '#10b981' }} />
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (avgPurchase / 5000) * 100)}%`, background: '#10b981' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Búsqueda ── */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, proveedor o factura..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* ── Tabla ── */}
      {filteredPurchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No hay compras</h3>
          <p className="text-muted-foreground mb-4">
            {search ? 'No se encontraron compras' : 'Registra tu primera compra'}
          </p>
          {!search && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Compra
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>No. Compra</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map(purchase => (
                <TableRow key={purchase.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-medium">
                    #{purchase.purchase_number}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(purchase.created_at)}
                  </TableCell>
                  <TableCell>
                    {purchase.supplier?.name ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ color: '#2f6bff', background: 'rgba(47,107,255,0.08)', border: '1px solid rgba(47,107,255,0.25)' }}
                      >
                        <Truck className="h-3 w-3" />
                        {purchase.supplier.name}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {purchase.invoice_number ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
                      >
                        {purchase.invoice_number}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(purchase.total)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPurchase(purchase)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Detalle de compra ── */}
      <Dialog open={!!selectedPurchase} onOpenChange={() => setSelectedPurchase(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Compra #{selectedPurchase?.purchase_number}</DialogTitle>
            <DialogDescription>
              {selectedPurchase && formatDate(selectedPurchase.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ background: 'rgba(47,107,255,0.06)', border: '1px solid rgba(47,107,255,0.15)' }}>
                  <p className="text-xs text-muted-foreground mb-1">Proveedor</p>
                  <p className="font-semibold text-sm" style={{ color: '#2f6bff' }}>
                    {selectedPurchase.supplier?.name ?? '—'}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <p className="text-xs text-muted-foreground mb-1">No. Factura</p>
                  <p className="font-semibold text-sm" style={{ color: '#f59e0b' }}>
                    {selectedPurchase.invoice_number ?? '—'}
                  </p>
                </div>
              </div>

              <Separator />

              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {selectedPurchase.items?.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.quantity} × {formatCurrency(item.unit_cost)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              <div className="flex justify-between text-base font-bold pt-1">
                <span>Total</span>
                <span style={{ color: '#2f6bff' }}>{formatCurrency(selectedPurchase.total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}