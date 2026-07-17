'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Building,
  Loader2,
  Package,
  X,
  Check,
} from 'lucide-react'

// FIX: importa los tipos centrales en vez de redefinirlos aquí
// FIX: cálculos financieros extraídos a funciones puras testeables (ver lib/pos/calculations.ts)
import {
  calculateChange,
  calculateSubtotal,
  calculateTotal,
  calculateTotalDiscount,
  canAddQuantity,
  formatCurrencyMXN,
  type CartItem,
  type POSProduct,
  type POSCustomer,
} from '@/lib/pos/calculations'

interface POSContentProps {
  products: POSProduct[]
  customers: POSCustomer[]
  userId: string
}

export function POSContent({ products, customers, userId }: POSContentProps) {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [amountReceived, setAmountReceived] = useState('')

  useEffect(() => {
    searchInputRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearch('')
        searchInputRef.current?.focus()
      }
      if (e.key === 'F2') {
        e.preventDefault()
        if (cart.length > 0) setIsCheckoutOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart.length])

  const addToCart = useCallback((product: POSProduct) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.product.id === product.id)

      if (existingItem) {
        if (!canAddQuantity(existingItem, 1)) {
          toast.error('Stock insuficiente')
          return currentCart
        }
        return currentCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...currentCart, { product, quantity: 1, discount: 0 }]
    })
    setSearch('')
    searchInputRef.current?.focus()
  }, [])

  const updateQuantity = (productId: string, delta: number) => {
    setCart(currentCart =>
      currentCart.map(item => {
        if (item.product.id !== productId) return item
        if (item.quantity + delta <= 0) return item
        if (!canAddQuantity(item, delta)) {
          toast.error('Stock insuficiente')
          return item
        }
        return { ...item, quantity: item.quantity + delta }
      })
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer('')
    setAmountReceived('')
  }

  const subtotal = calculateSubtotal(cart)
  const totalDiscount = calculateTotalDiscount(cart)
  const total = calculateTotal(cart)

  const filteredProducts = products
    .filter(
      product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase()) ||
        (product.barcode && product.barcode.includes(search))
    )
    .slice(0, 12)

  const formatCurrency = formatCurrencyMXN

  // ── FIX: checkout usa una sola RPC transaccional ────────────
  // Antes: 3 operaciones independientes (sale → sale_items → stock update)
  //        Si fallaba la segunda o tercera, la venta quedaba corrupta.
  //        Además, el stock se calculaba con valores stale del cliente.
  //
  // Ahora: una sola llamada a process_checkout() que corre dentro de una
  //        transacción Postgres. Si cualquier paso falla, hace ROLLBACK
  //        de todo. El UPDATE de stock es atómico: usa stock_quantity - n
  //        directamente en la DB, no el valor cargado en el browser.
  const handleCheckout = async () => {
    if (cart.length === 0) return
    setIsProcessing(true)

    try {
      const supabase = createClient()

      const items = cart.map(item => ({
        product_id:     item.product.id,
        quantity:       item.quantity,
        unit_price:     item.product.sale_price,
        discount:       item.discount,
        total:          item.product.sale_price * item.quantity - item.discount,
        // previous_stock se usa solo para el registro de auditoría en stock_movements
        previous_stock: item.product.stock_quantity,
      }))

      const { data, error } = await supabase.rpc('process_checkout', {
        p_user_id:        userId,
        p_customer_id:    selectedCustomer && selectedCustomer !== 'general'
                            ? selectedCustomer
                            : null,
        p_subtotal:       subtotal,
        p_tax_amount:     0,
        p_discount:       totalDiscount,
        p_total:          total,
        p_payment_method: paymentMethod,
        p_items:          items,
      })

      if (error) {
        // Mensajes de error legibles para el cajero
        if (error.message.includes('Stock insuficiente')) {
          toast.error('Stock insuficiente — algún producto ya no tiene unidades disponibles')
        } else {
          toast.error('Error al procesar la venta')
          console.error(error)
        }
        return
      }

      toast.success(`Venta #${data?.sale_id?.slice(-6).toUpperCase()} completada`)
      setIsCheckoutOpen(false)
      clearCart()
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Error inesperado al procesar la venta')
    } finally {
      setIsProcessing(false)
    }
  }

  const change =
    paymentMethod === 'cash' && amountReceived
      ? calculateChange(parseFloat(amountReceived) || 0, total)
      : 0

  return (
    <div className="h-full flex gap-4">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar producto por nombre, SKU o codigo de barras..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-12 text-lg"
              autoComplete="off"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => {
                  setSearch('')
                  searchInputRef.current?.focus()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          {search && filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No se encontraron productos</p>
            </div>
          ) : search ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map(product => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-sm line-clamp-2">{product.name}</p>
                      {product.category && (
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: product.category.color }}
                        />
                      )}
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(product.sale_price)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Stock: {product.stock_quantity} {product.unit}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">Busca un producto</h3>
              <p className="text-muted-foreground text-sm">
                Escribe el nombre, SKU o codigo de barras
              </p>
              <div className="flex gap-2 mt-4 text-xs text-muted-foreground">
                <Badge variant="outline">ESC</Badge>
                <span>Limpiar busqueda</span>
                <Badge variant="outline" className="ml-4">F2</Badge>
                <span>Cobrar</span>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Cart Panel */}
      {/* FIX: h-full para que el Card tome exactamente la altura del contenedor padre,
               en vez de crecer según su contenido y empujar el footer fuera de pantalla */}
      <Card className="w-96 h-full flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Carrito
            </CardTitle>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Limpiar
              </Button>
            )}
          </div>
        </CardHeader>

        <Separator className="shrink-0" />

        {/* FIX: min-h-0 es la clave. Sin esto, un hijo flex con flex-1 nunca se
                 encoge por debajo del tamaño de su contenido, así que el ScrollArea
                 crecía indefinidamente y empujaba el footer (Total + botón Cobrar)
                 fuera de la vista en lugar de scrollear internamente. */}
        <ScrollArea className="flex-1 min-h-0">
          <CardContent className="pt-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-sm">Agrega productos al carrito</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.product.id} className="flex gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.product.sale_price)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stock_quantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="w-20 text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(item.product.sale_price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </ScrollArea>

        <Separator className="shrink-0" />

        {/* FIX: shrink-0 asegura que el footer (cliente, totales, botón Cobrar)
                 nunca se aplaste ni se comprima, siempre visible al fondo del Card */}
        <CardFooter className="flex-col gap-4 pt-4 shrink-0">
          <div className="w-full">
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Cliente: Publico General" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Publico General</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-500">
                <span>Descuento</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <Button
            className="w-full h-12 text-lg"
            size="lg"
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            Cobrar {formatCurrency(total)}
          </Button>
        </CardFooter>
      </Card>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Completar Venta</DialogTitle>
            <DialogDescription>Total a cobrar: {formatCurrency(total)}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Metodo de Pago</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="h-16 flex-col gap-1"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote className="h-5 w-5" />
                  <span className="text-xs">Efectivo</span>
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className="h-16 flex-col gap-1"
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Tarjeta</span>
                </Button>
                <Button
                  variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                  className="h-16 flex-col gap-1"
                  onClick={() => setPaymentMethod('transfer')}
                >
                  <Building className="h-5 w-5" />
                  <span className="text-xs">Transferencia</span>
                </Button>
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <Label htmlFor="amount">Monto Recibido</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={total}
                  value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  placeholder={formatCurrency(total)}
                  className="h-12 text-lg"
                />
                {amountReceived && parseFloat(amountReceived) >= total && (
                  <div className="flex justify-between text-lg font-bold text-green-500">
                    <span>Cambio:</span>
                    <span>{formatCurrency(change)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={
                isProcessing ||
                (paymentMethod === 'cash' &&
                  (!amountReceived || parseFloat(amountReceived) < total))
              }
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Confirmar Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}